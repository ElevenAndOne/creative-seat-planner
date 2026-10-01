import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
});

const isJwt = (s: unknown): s is string => typeof s === "string" && s.split(".").length === 3;

/** A short-lived JWT for the API, or null when signed out. */
export async function getToken() {
  // The SDK injects the JWT (from the `set-auth-jwt` header) into the session.
  // That path works cross-origin; the `/token` endpoint needs a third-party
  // cookie that browsers often block, so it's only a fallback.
  try {
    const { data } = await authClient.getSession();
    if (isJwt(data?.session?.token)) return data.session.token;
  } catch {
    // fall through
  }
  try {
    const { data } = await authClient.token();
    return isJwt(data?.token) ? data.token : null;
  } catch {
    return null; // signed out: the API answers with a clear 401
  }
}
