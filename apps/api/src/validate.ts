import { FIELDS, type Field } from "./db";

const PILLARS = ["backlog", "seat", "work", "service"];
const SERIES = ["", "Seat No.", "Brief → Built", "Marketing PSA"];
const STATUSES = ["brief", "prod", "review", "ok", "posted"];
const MAX_TEXT = 20_000;

const isPairs = (v: unknown): v is [string, string][] =>
  Array.isArray(v) &&
  v.length <= 100 &&
  v.every((r) => Array.isArray(r) && r.length === 2 && r.every((s) => typeof s === "string" && s.length <= MAX_TEXT));

/**
 * Turn a JSON patch into column/value pairs, rejecting unknown fields and bad values.
 * Returns an error message instead when invalid.
 */
export function toColumns(body: unknown): { cols: [string, unknown][] } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Expected a JSON object." };
  const cols: [string, unknown][] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!(key in FIELDS)) return { error: `Unknown field: ${key}` };
    const [col, kind] = FIELDS[key as Field];
    switch (kind) {
      case "text":
        if (typeof value !== "string" || value.length > MAX_TEXT) return { error: `${key} must be text.` };
        if (key === "pillar" && !PILLARS.includes(value)) return { error: "Invalid pillar." };
        if (key === "series" && !SERIES.includes(value)) return { error: "Invalid series." };
        if (key === "status" && !STATUSES.includes(value)) return { error: "Invalid status." };
        if (key === "title" && !value.trim()) return { error: "Title can't be empty." };
        cols.push([col, value]);
        break;
      case "date":
        if (value !== "" && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)))
          return { error: "date must be yyyy-mm-dd or empty." };
        cols.push([col, value || null]);
        break;
      case "strings":
        if (!Array.isArray(value) || value.length > 50 || !value.every((s) => typeof s === "string" && s.length <= 500))
          return { error: `${key} must be a list of text.` };
        cols.push([col, JSON.stringify(value)]);
        break;
      case "pairs":
        if (!isPairs(value)) return { error: `${key} must be a list of [label, text] rows.` };
        cols.push([col, JSON.stringify(value)]);
        break;
    }
  }
  return { cols };
}
