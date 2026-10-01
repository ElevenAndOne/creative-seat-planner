export type PillarKey = "backlog" | "seat" | "work" | "service";
export type StatusKey = "brief" | "prod" | "review" | "ok" | "posted";
export type Series = "" | "Seat No." | "Brief → Built" | "Marketing PSA";

/** A post as served by the planner API. */
export interface Post {
  id: string;
  number: number;
  title: string;
  pillar: PillarKey;
  series: Series;
  platform: string;
  format: string;
  sizes: string[];
  /** yyyy-mm-dd; "" when not on the calendar. */
  date: string;
  status: StatusKey;
  /** "The job". */
  objective: string;
  idea: string;
  artDirection: [string, string][];
  lookHere: string;
  holdBack: string;
  /** Words on the asset: [label, text]. */
  assetCopy: [string, string][];
  captionLinkedIn: string;
  captionInstagram: string;
  updatedAt: string;
}

export type PostPatch = Partial<Omit<Post, "id" | "number" | "updatedAt">>;
