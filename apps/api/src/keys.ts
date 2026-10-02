import { createHash, randomBytes } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { pool } from "./db";
import type { Env } from "./middleware";

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");
export const newKey = () => `csp_${randomBytes(24).toString("base64url")}`;

/** Accept a Figma plugin key whose owner is still on the editor list. */
export const requirePluginKey = createMiddleware<Env>(async (c, next) => {
  const auth = c.req.header("authorization") ?? "";
  const key = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!key.startsWith("csp_")) return c.json({ error: "Add your plugin key from the planner." }, 401);
  const { rows } = await pool.query<{ owner_email: string }>(
    `update plugin_keys k set last_used_at = now()
     where key_hash = $1 and exists (select 1 from editors e where lower(e.email) = lower(k.owner_email))
     returning owner_email`,
    [hashKey(key)],
  );
  if (!rows[0]) return c.json({ error: "That plugin key isn't valid any more. Create a new one in the planner." }, 401);
  c.set("keyOwner", rows[0].owner_email);
  await next();
});
