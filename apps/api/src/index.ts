import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { pool, SELECT, type Post } from "./db";
import { viewerFrom, type Viewer } from "./auth";
import { toColumns } from "./validate";

const api = new Hono<{ Variables: { viewer: Viewer } }>();

// Auth uses bearer tokens, not cookies, so any origin may call the API;
// writes are still gated on a verified editor token below.
api.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type"], maxAge: 86400 }));

api.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Something went wrong." }, 500);
});

api.get("/", (c) => c.text("Creative Seat planner API"));

/** Everyone can read the plan. */
api.get("/posts", async (c) => {
  const { rows } = await pool.query<Post>(`${SELECT} order by post_date nulls last, number`);
  return c.json(rows);
});

/** Who is calling, and can they edit? */
api.get("/me", async (c) => {
  const viewer = await viewerFrom(c.req.header("authorization"));
  return c.json(viewer ? { email: viewer.email, editor: viewer.editor } : { email: null, editor: false });
});

// Everything below changes data: editors only.
const requireEditor = createMiddleware<{ Variables: { viewer: Viewer } }>(async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "OPTIONS") return next();
  const viewer = await viewerFrom(c.req.header("authorization"));
  if (!viewer) return c.json({ error: "Sign in to edit." }, 401);
  if (!viewer.editor) return c.json({ error: "This account can view the plan but not edit it." }, 403);
  c.set("viewer", viewer);
  await next();
});
api.use("/posts/*", requireEditor);
api.post("/posts", requireEditor);

/** Create a post. Body may set any editable field; the number is assigned. */
api.post("/posts", async (c) => {
  const parsed = toColumns(await c.req.json().catch(() => ({})));
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  const cols = ["number", "updated_by", ...parsed.cols.map(([k]) => k)];
  const vals = [c.get("viewer").email, ...parsed.cols.map(([, v]) => v)];
  const { rows } = await pool.query<{ id: string }>(
    `insert into posts (${cols.join(", ")})
     values ((select coalesce(max(number), 0) + 1 from posts), ${vals.map((_, i) => `$${i + 1}`).join(", ")})
     returning id`,
    vals,
  );
  const { rows: created } = await pool.query<Post>(`${SELECT} where id = $1`, [rows[0]!.id]);
  return c.json(created[0], 201);
});

/** Update some fields of a post. */
api.patch("/posts/:id", async (c) => {
  const parsed = toColumns(await c.req.json().catch(() => null));
  if ("error" in parsed) return c.json({ error: parsed.error }, 400);
  if (!parsed.cols.length) return c.json({ error: "Nothing to update." }, 400);
  const sets = parsed.cols.map(([k], i) => `${k} = $${i + 3}`).join(", ");
  const { rowCount } = await pool.query(
    `update posts set ${sets}, updated_at = now(), updated_by = $2 where id = $1`,
    [c.req.param("id"), c.get("viewer").email, ...parsed.cols.map(([, v]) => v)],
  );
  if (!rowCount) return c.json({ error: "Post not found." }, 404);
  const { rows } = await pool.query<Post>(`${SELECT} where id = $1`, [c.req.param("id")]);
  return c.json(rows[0]);
});

api.delete("/posts/:id", async (c) => {
  const { rowCount } = await pool.query(`delete from posts where id = $1`, [c.req.param("id")]);
  if (!rowCount) return c.json({ error: "Post not found." }, 404);
  return c.body(null, 204);
});

// On Vercel the api service is mounted at /api and receives the prefixed path
// (/api/posts); the Neon Function serves the same routes from its root (/posts).
const app = new Hono().route("/api", api).route("/", api);

export default app;
