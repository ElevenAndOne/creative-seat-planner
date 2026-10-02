import { Hono } from "hono";
import { pool } from "./db";
import { figmaNodeUrl, FigmaError, findSlides, normTitle, renderPngs } from "./figma";
import { hashKey, newKey, requirePluginKey } from "./keys";
import { requireEditor, requireUser, type Env } from "./middleware";
import { put, readUrl, remove } from "./storage";

type Slide = { n: number; node_id: string; still_key: string; video_key: string | null; animated: boolean; synced_at: string };

const slidesOf = async (postId: string) =>
  (await pool.query<Slide>(`select * from artwork_slides where post_id = $1 order by n`, [postId])).rows;

/** Store one slide; replaces the row and deletes objects it no longer points to. */
async function upsertSlide(postId: string, s: { n: number; nodeId: string; stillKey?: string; videoKey?: string | null }) {
  const prev = (await pool.query<Slide>(`select * from artwork_slides where post_id = $1 and n = $2`, [postId, s.n])).rows[0];
  const sameNode = prev?.node_id === s.nodeId;
  const stillKey = s.stillKey ?? (sameNode ? prev?.still_key : undefined);
  if (!stillKey) throw new FigmaError("Publish the slide's still before its video.", 400);
  // A video only stays valid while it belongs to the same Figma frame.
  const videoKey = s.videoKey !== undefined ? s.videoKey : sameNode ? (prev?.video_key ?? null) : null;
  await pool.query(
    `insert into artwork_slides (post_id, n, node_id, still_key, video_key, animated, synced_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (post_id, n) do update set node_id = excluded.node_id, still_key = excluded.still_key,
       video_key = excluded.video_key, animated = excluded.animated, synced_at = now()`,
    [postId, s.n, s.nodeId, stillKey, videoKey, !!videoKey],
  );
  for (const old of [prev?.still_key, prev?.video_key]) if (old && old !== stillKey && old !== videoKey) await remove(old);
}

/** Drop slides whose frames are gone from Figma. */
async function pruneSlides(postId: string, keep: number[]) {
  const { rows } = await pool.query<Slide>(
    `delete from artwork_slides where post_id = $1 and not (n = any($2::int[])) returning *`,
    [postId, keep],
  );
  for (const r of rows) {
    await remove(r.still_key);
    if (r.video_key) await remove(r.video_key);
  }
}

const objectKey = (postId: string, n: number, ext: string) => `artwork/${postId}/${n}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

export const artwork = new Hono<Env>();

/** Slides for a brief, with short-lived URLs. Signed-in viewers only. */
artwork.get("/posts/:id/artwork", requireUser, async (c) => {
  const rows = await slidesOf(c.req.param("id"));
  return c.json(
    await Promise.all(
      rows.map(async (r) => ({
        n: r.n,
        nodeId: r.node_id,
        figmaUrl: figmaNodeUrl(r.node_id),
        stillUrl: await readUrl(r.still_key),
        videoUrl: r.video_key ? await readUrl(r.video_key) : null,
        syncedAt: r.synced_at,
      })),
    ),
  );
});

/** Pull the latest stills from Figma for one brief. Videos come from the Figma plugin. */
artwork.post("/posts/:id/artwork/refresh", requireEditor, async (c) => {
  const postId = c.req.param("id");
  const post = (await pool.query<{ title: string }>(`select title from posts where id = $1`, [postId])).rows[0];
  if (!post) return c.json({ error: "Post not found." }, 404);
  try {
    const found = await findSlides(post.title);
    if (!found.length) {
      return c.json(
        { error: `No frames for this post in Figma yet. Name them “CS - ${post.title} - Slide 01”, “… - Slide 02” on the CS_Social Media page, then refresh.` },
        404,
      );
    }
    const pngs = await renderPngs(found.map((f) => f.nodeId));
    for (const f of found) {
      const key = objectKey(postId, f.n, "png");
      await put(key, pngs.get(f.nodeId)!, "image/png");
      await upsertSlide(postId, { n: f.n, nodeId: f.nodeId, stillKey: key });
    }
    await pruneSlides(postId, found.map((f) => f.n));
    return c.json({ slides: found.length });
  } catch (e) {
    if (e instanceof FigmaError) return c.json({ error: e.message }, e.status as 400);
    throw e;
  }
});

/** Plugin keys: an editor creates one, pastes it into the Figma plugin, and can revoke it. */
artwork.get("/plugin-keys", requireEditor, async (c) => {
  const { rows } = await pool.query(
    `select id, label, created_at as "createdAt", last_used_at as "lastUsedAt"
     from plugin_keys where lower(owner_email) = lower($1) order by created_at desc`,
    [c.get("viewer").email],
  );
  return c.json(rows);
});

artwork.post("/plugin-keys", requireEditor, async (c) => {
  const { label } = (await c.req.json().catch(() => ({}))) as { label?: unknown };
  const key = newKey();
  const { rows } = await pool.query(
    `insert into plugin_keys (key_hash, owner_email, label) values ($1, $2, $3) returning id`,
    [hashKey(key), c.get("viewer").email, typeof label === "string" ? label.slice(0, 60) : ""],
  );
  return c.json({ id: rows[0].id, key }, 201); // shown once
});

artwork.delete("/plugin-keys/:id", requireEditor, async (c) => {
  const { rowCount } = await pool.query(`delete from plugin_keys where id::text = $1 and lower(owner_email) = lower($2)`, [
    c.req.param("id"),
    c.get("viewer").email,
  ]);
  return rowCount ? c.body(null, 204) : c.json({ error: "Key not found." }, 404);
});

/** Endpoints the Figma plugin calls with a plugin key. */
export const plugin = new Hono<Env>();
plugin.use("/plugin/*", requirePluginKey);

const MAX_UPLOAD = 100 * 1024 * 1024;

/** Who the key belongs to, plus posts to match frame names against. */
plugin.get("/plugin/session", async (c) => {
  const { rows } = await pool.query<{ id: string; number: number; title: string }>(
    `select id, number, title from posts order by number`,
  );
  return c.json({ owner: c.get("keyOwner"), posts: rows.map((p) => ({ ...p, match: normTitle(p.title) })) });
});

/** Upload one slide's still (image/png) or video (video/mp4). Raw bytes in the body. */
plugin.put("/plugin/artwork/:postId/:n/:kind", async (c) => {
  const { postId, kind } = c.req.param();
  const n = Number.parseInt(c.req.param("n"), 10);
  const nodeId = c.req.query("node") ?? "";
  if (!Number.isInteger(n) || n < 1 || n > 99) return c.json({ error: "Invalid slide number." }, 400);
  if (!/^\d+:\d+$/.test(nodeId)) return c.json({ error: "Invalid Figma node id." }, 400);
  const type = kind === "still" ? "image/png" : kind === "video" ? "video/mp4" : null;
  if (!type) return c.json({ error: "Kind must be still or video." }, 400);
  const exists = await pool.query(`select 1 from posts where id = $1`, [postId]);
  if (!exists.rowCount) return c.json({ error: "Post not found." }, 404);
  const body = new Uint8Array(await c.req.arrayBuffer());
  if (!body.length || body.length > MAX_UPLOAD) return c.json({ error: "File is empty or over 100 MB." }, 400);
  const key = objectKey(postId, n, kind === "still" ? "png" : "mp4");
  await put(key, body, type);
  try {
    await upsertSlide(postId, kind === "still" ? { n, nodeId, stillKey: key, videoKey: null } : { n, nodeId, videoKey: key });
  } catch (e) {
    await remove(key);
    if (e instanceof FigmaError) return c.json({ error: e.message }, 400);
    throw e;
  }
  return c.body(null, 204);
});

/** After publishing every slide of a post: remove slides that no longer exist in Figma. */
plugin.post("/plugin/artwork/:postId/done", async (c) => {
  const { slides } = (await c.req.json().catch(() => ({}))) as { slides?: unknown };
  if (!Array.isArray(slides) || !slides.every((n) => Number.isInteger(n))) return c.json({ error: "Invalid slides." }, 400);
  await pruneSlides(c.req.param("postId"), slides as number[]);
  return c.body(null, 204);
});
