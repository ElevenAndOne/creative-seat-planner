import type { PillarKey, Series, StatusKey } from "./types";

export const PILLARS: Record<PillarKey, { name: string; role: string }> = {
  backlog: { name: "The Backlog", role: "Pain point" },
  seat: { name: "The Seat", role: "Brand" },
  work: { name: "The Work", role: "Capability" },
  service: { name: "The Service", role: "Product" },
};

export const PILLAR_KEYS = Object.keys(PILLARS) as PillarKey[];

/** Tailwind classes for each pillar's swatch / chip colour. */
export const PILLAR_CLASS: Record<PillarKey, string> = {
  backlog: "bg-white text-ink shadow-ink",
  seat: "bg-volt text-ink",
  work: "bg-chalk text-ink",
  service: "bg-forest text-paper",
};

export const STATUSES: { k: StatusKey; name: string; color: string }[] = [
  { k: "brief", name: "Briefed", color: "var(--color-st-brief)" },
  { k: "prod", name: "In production", color: "var(--color-st-prod)" },
  { k: "review", name: "In review", color: "var(--color-st-review)" },
  { k: "ok", name: "Approved", color: "var(--color-st-ok)" },
  { k: "posted", name: "Posted", color: "var(--color-st-post)" },
];

export const statusOf = (k: StatusKey) => STATUSES.find((s) => s.k === k) ?? STATUSES[0]!;

export const SERIES_NOTE: Record<Exclude<Series, "">, string> = {
  "Seat No.":
    "Series rule: one chair, dead centre, three-quarter view, same scale and camera height every time, with a small label top-left and one Instrument Serif line underneath.",
  "Brief → Built":
    "Series rule: frame one is always the raw brief in its native UI on paper; a volt arrow wipe leads to the work; the last frame carries a spec strip (disciplines · formats · turnaround).",
  "Marketing PSA":
    "Series rule: grain-textured image in the top 80%, a solid footer band with “Creative Seat” · “Public Service Announcement No. 0X” · “For Marketing Teams”.",
};

export const GROUP_LABELS: Record<string, string> = {
  "Weeks 1–4": "Launch: meet the seat",
  "Weeks 5–8": "Build: the problem and the proof",
  "Weeks 9–12": "Close: range, reveal, invitation",
  Unscheduled: "Not on the calendar",
};
