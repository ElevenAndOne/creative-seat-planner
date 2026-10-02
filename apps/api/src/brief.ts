import { Hono } from "hono";
import { pool } from "./db";
import { requireEditor, requireUser, type Env } from "./middleware";
import { exists, readUrl, remove, uploadUrl } from "./storage";

/** Feedback and inspiration on a brief. Visible to signed-in users only. */
export const brief = new Hono<Env>();

const ROLES = ["Designer", "Client", "Art Director", "Creative Director"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

brief.get("/posts/:id/feedback", requireUser, async (c) => {
  const { rows } = await pool.query(
    `select id, body, role, author_id as "authorId", author_name as "authorName", status,
            actioned_by as "actionedBy", actioned_at as "actionedAt", created_at as "createdAt"
     from comments where post_id = $1 order by created_at`,
    [c.req.param("id")],
  );
  return c.json(rows);
});

brief.post("/posts/:id/feedback", requireUser, async (c) => {
  const { body, role } = (await c.req.json().catch(() => ({}))) as { body?: unknown; role?: unknown };
  if (typeof body !== "string" || !body.trim() || body.length > 4000)
    return c.json({ error: "Write some feedback (up to 4,000 characters)." }, 400);
  if (typeof role !== "string" || !ROLES.includes(role)) return c.json({ error: "Pick a role." }, 400);
  const v = c.get("viewer");
  const { rows } = await pool.query(
    `insert into comments (post_id, body, role, author_id, author_name)
     select id, $2, $3, $4, $5 from posts where id = $1
     returning id`,
    [c.req.param("id"), body.trim(), role, v.userId, v.name],
  );
  if (!rows.length) return c.json({ error: "Post not found." }, 404);
  return c.json(rows[0], 201);
});

/** Editors (ADs / CDs) approve a comment to action, or send it back. */
brief.patch("/feedback/:id", requireEditor, async (c) => {
  const { status } = (await c.req.json().catch(() => ({}))) as { status?: unknown };
  if (status !== "open" && status !== "actioned") return c.json({ error: "Invalid status." }, 400);
  const { rowCount } = await pool.query(
    `update comments set status = $2,
       actioned_by = case when $2 = 'actioned' then $3 end,
       actioned_at = case when $2 = 'actioned' then now() end
     where id::text = $1`,
    [c.req.param("id"), status, c.get("viewer").name],
  );
  return rowCount ? c.body(null, 204) : c.json({ error: "Comment not found." }, 404);
});

/** Editors can delete any comment; everyone else only their own. */
brief.delete("/feedback/:id", requireUser, async (c) => {
  const v = c.get("viewer");
  const { rowCount } = await pool.query(
    `delete from comments where id::text = $1 and ($2 or author_id = $3)`,
    [c.req.param("id"), v.editor, v.userId],
  );
  return rowCount ? c.body(null, 204) : c.json({ error: "You can only delete your own comments." }, 403);
});

brief.get("/posts/:id/inspiration", requireUser, async (c) => {
  const { rows } = await pool.query<{ id: string; object_key: string; name: string; added_by: string; created_at: string }>(
    `select id, object_key, name, added_by, created_at from inspiration where post_id = $1 order by created_at`,
    [c.req.param("id")],
  );
  return c.json(
    await Promise.all(
      rows.map(async (r) => ({ id: r.id, name: r.name, addedBy: r.added_by, createdAt: r.created_at, url: await readUrl(r.object_key) })),
    ),
  );
});

/** Step 1: get a URL to upload the image straight to the bucket. */
brief.post("/posts/:id/inspiration/upload", requireEditor, async (c) => {
  const { contentType, size } = (await c.req.json().catch(() => ({}))) as { contentType?: unknown; size?: unknown };
  if (typeof contentType !== "string" || !IMAGE_TYPES.includes(contentType))
    return c.json({ error: "Choose a JPG, PNG, GIF or WebP image." }, 400);
  if (typeof size !== "number" || size > MAX_IMAGE_BYTES) return c.json({ error: "Images can be up to 20 MB." }, 400);
  const ext = contentType.split("/")[1]!.replace("jpeg", "jpg");
  const key = `inspiration/${c.req.param("id")}/${crypto.randomUUID()}.${ext}`;
  return c.json({ key, uploadUrl: await uploadUrl(key, contentType) });
});

/** Step 2: record the uploaded image against the brief. */
brief.post("/posts/:id/inspiration", requireEditor, async (c) => {
  const { key, name, contentType } = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const post = c.req.param("id");
  if (typeof key !== "string" || !key.startsWith(`inspiration/${post}/`)) return c.json({ error: "Invalid upload." }, 400);
  if (typeof contentType !== "string" || !IMAGE_TYPES.includes(contentType)) return c.json({ error: "Invalid type." }, 400);
  if (!(await exists(key))) return c.json({ error: "The upload didn't finish. Try again." }, 400);
  const { rows } = await pool.query(
    `insert into inspiration (post_id, object_key, name, content_type, added_by)
     values ($1, $2, $3, $4, $5) returning id`,
    [post, key, typeof name === "string" ? name.slice(0, 120) : "", contentType, c.get("viewer").name],
  );
  return c.json(rows[0], 201);
});

brief.delete("/inspiration/:id", requireEditor, async (c) => {
  const { rows } = await pool.query<{ object_key: string }>(
    `delete from inspiration where id::text = $1 returning object_key`,
    [c.req.param("id")],
  );
  if (!rows[0]) return c.json({ error: "Image not found." }, 404);
  await remove(rows[0].object_key);
  return c.body(null, 204);
});
