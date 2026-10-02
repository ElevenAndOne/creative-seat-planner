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

export const COMMENT_ROLES = ["Designer", "Client", "Art Director", "Creative Director"] as const;
export type CommentRole = (typeof COMMENT_ROLES)[number];

export interface Comment {
  id: string;
  body: string;
  role: CommentRole;
  authorId: string;
  authorName: string;
  /** "actioned" once an AD/CD approves it for the designer. */
  status: "open" | "actioned";
  actionedBy: string | null;
  actionedAt: string | null;
  createdAt: string;
}

export interface InspirationImage {
  id: string;
  name: string;
  addedBy: string;
  createdAt: string;
  /** Short-lived signed URL. */
  url: string;
}

/** One slide of a post's artwork, from Figma. */
export interface ArtworkSlide {
  n: number;
  nodeId: string;
  figmaUrl: string;
  /** Short-lived signed URLs. */
  stillUrl: string;
  /** MP4 published from the Figma plugin when the frame is animated. */
  videoUrl: string | null;
  syncedAt: string;
}

export interface PluginKey {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
}
