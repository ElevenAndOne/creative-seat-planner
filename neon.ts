import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    storage: { access: "private" },
  },
  functions: {
    // Planner REST API (apps/api). Public reads; writes need an editor's Neon Auth JWT.
    api: { name: "api", source: "./apps/api/src/index.ts" },
  },
});
