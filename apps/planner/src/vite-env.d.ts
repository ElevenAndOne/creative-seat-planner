/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Defaults to the same-origin `/api` (the Vercel api service). */
  readonly VITE_API_URL?: string;
  readonly VITE_NEON_AUTH_URL: string;
  /** API base the Figma plugin publishes to; defaults to the Neon Function URL. */
  readonly VITE_PLUGIN_API_URL?: string;
}
