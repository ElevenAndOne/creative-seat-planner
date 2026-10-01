import { attachDatabasePool } from "@neon/functions";
import pg from "pg";

// One small pool per isolate, reused across requests.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

/** API shape of a post. */
export interface Post {
  id: string;
  number: number;
  title: string;
  pillar: string;
  series: string;
  platform: string;
  format: string;
  sizes: string[];
  date: string; // yyyy-mm-dd, "" when unscheduled
  status: string;
  objective: string;
  idea: string;
  artDirection: [string, string][];
  lookHere: string;
  holdBack: string;
  assetCopy: [string, string][];
  captionLinkedIn: string;
  captionInstagram: string;
  updatedAt: string;
}

/** API field → [column, kind]. Only these can be written. */
export const FIELDS = {
  title: ["title", "text"],
  pillar: ["pillar", "text"],
  series: ["series", "text"],
  platform: ["platform", "text"],
  format: ["format", "text"],
  sizes: ["sizes", "strings"],
  date: ["post_date", "date"],
  status: ["status", "text"],
  objective: ["objective", "text"],
  idea: ["idea", "text"],
  artDirection: ["art_direction", "pairs"],
  lookHere: ["look_here", "text"],
  holdBack: ["hold_back", "text"],
  assetCopy: ["asset_copy", "pairs"],
  captionLinkedIn: ["caption_linkedin", "text"],
  captionInstagram: ["caption_instagram", "text"],
} as const;

export type Field = keyof typeof FIELDS;

export const SELECT = `
  select id, number, title, pillar, series, platform, format, sizes,
         coalesce(to_char(post_date, 'YYYY-MM-DD'), '') as date, status,
         objective, idea, art_direction as "artDirection", look_here as "lookHere",
         hold_back as "holdBack", asset_copy as "assetCopy",
         caption_linkedin as "captionLinkedIn", caption_instagram as "captionInstagram",
         updated_at as "updatedAt"
  from posts`;
