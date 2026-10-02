import { createRemoteJWKSet, jwtVerify } from "jose";
import { pool } from "./db";

const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));
const issuer = new URL(process.env.NEON_AUTH_BASE_URL!).origin;

export interface Viewer {
  userId: string;
  email: string;
  name: string;
  editor: boolean;
}

/** Verify a Neon Auth bearer token and look up whether the user may edit. */
export async function viewerFrom(authorization: string | undefined): Promise<Viewer | null> {
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;
  let sub: string;
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwks, { issuer });
    if (!payload.sub) return null;
    sub = payload.sub;
  } catch (err) {
    // Log why (never the token) so a misconfigured issuer or JWKS is visible in `neon logs`.
    const e = err as { code?: string; claim?: string; payload?: { iss?: unknown } };
    console.warn("jwt rejected", { code: e.code, claim: e.claim, iss: e.payload?.iss, expected: issuer });
    return null;
  }
  // Identity comes from the verified subject, never from the request body.
  const { rows } = await pool.query<{ email: string; name: string; editor: boolean }>(
    `select u.email, coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)) as name,
            exists (select 1 from editors e where lower(e.email) = lower(u.email)) as editor
     from neon_auth."user" u
     where u.id::text = $1 and coalesce(u.banned, false) = false`,
    [sub],
  );
  const row = rows[0];
  return row ? { userId: sub, email: row.email, name: row.name, editor: row.editor } : null;
}
