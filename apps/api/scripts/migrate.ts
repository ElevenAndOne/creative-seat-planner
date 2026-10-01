// Apply db/schema.sql to DATABASE_URL_UNPOOLED. Run: pnpm --filter @creative-seat/api db:migrate
import { readFileSync } from "node:fs";
import pg from "pg";

const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await client.connect();
await client.query(sql);
await client.end();
console.log("Schema applied.");
