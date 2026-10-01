/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Defaults to the same-origin `/api` (the Vercel api service). */
  readonly VITE_API_URL?: string;
  readonly VITE_NEON_AUTH_URL: string;
}
