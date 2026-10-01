// Insert the original 18-post launch plan. Existing ids are left untouched, so
// this never overwrites edits. Run: pnpm --filter @creative-seat/api db:seed
import pg from "pg";
import { SEED_POSTS } from "./seed-posts.ts";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await client.connect();
let inserted = 0;
for (const p of SEED_POSTS) {
  const res = await client.query(
    `insert into posts (id, number, title, pillar, series, platform, format, sizes, post_date,
       objective, idea, art_direction, look_here, hold_back, asset_copy, caption_linkedin, caption_instagram)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     on conflict (id) do nothing`,
    [
      p.id, p.n, p.t, p.p, p.s, p.pl, p.f, JSON.stringify(p.sz), p.d || null,
      p.obj, p.idea, JSON.stringify(p.ad), p.eye, p.hold, JSON.stringify(p.copy), p.li, p.ig,
    ],
  );
  inserted += res.rowCount ?? 0;
}
await client.end();
console.log(`Seeded ${inserted} of ${SEED_POSTS.length} posts (others already existed).`);
