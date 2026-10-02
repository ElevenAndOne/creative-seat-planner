import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    storage: { access: "private" },
  },
  functions: {
    // Planner REST API (apps/api). Public reads; writes need an editor's Neon Auth JWT.
    api: {
      name: "api",
      source: "./apps/api/src/index.ts",
      // Figma personal access token (file_content:read) for "Refresh artwork".
      // Deploy with `neon deploy --env .env.local`; left out, the live value is kept.
      ...(process.env.FIGMA_TOKEN ? { env: { FIGMA_TOKEN: process.env.FIGMA_TOKEN } } : {}),
    },
  },
});
