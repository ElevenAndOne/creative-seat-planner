import { createMiddleware } from "hono/factory";
import { viewerFrom, type Viewer } from "./auth";

/** Request variables: the signed-in viewer, or the owner of a Figma plugin key. */
export type Env = { Variables: { viewer: Viewer; keyOwner: string } };

/** Any signed-in user. */
export const requireUser = createMiddleware<Env>(async (c, next) => {
  const viewer = await viewerFrom(c.req.header("authorization"));
  if (!viewer) return c.json({ error: "Sign in first." }, 401);
  c.set("viewer", viewer);
  await next();
});

/** Signed in and on the editor list. */
export const requireEditor = createMiddleware<Env>(async (c, next) => {
  const viewer = await viewerFrom(c.req.header("authorization"));
  if (!viewer) return c.json({ error: "Sign in to edit." }, 401);
  if (!viewer.editor) return c.json({ error: "This account can view the plan but not edit it." }, 403);
  c.set("viewer", viewer);
  await next();
});
