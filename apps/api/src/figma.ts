/** Figma REST access for slide stills. Needs FIGMA_TOKEN (scope: file_content:read). */

// The Creative Seat design file and its "CS_Social Media" page.
export const FIGMA_FILE_KEY = "9hpD5w4IPnt1gEzhW00IaI";
export const FIGMA_PAGE_ID = "763:206";
export const figmaNodeUrl = (nodeId: string) =>
  `https://www.figma.com/design/${FIGMA_FILE_KEY}/Creative-Seat?node-id=${nodeId.replace(":", "-")}`;

export class FigmaError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

async function figma<T>(path: string): Promise<T> {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new FigmaError("Figma isn't connected yet. Add a FIGMA_TOKEN to the API and redeploy.", 503);
  const res = await fetch(`https://api.figma.com${path}`, { headers: { "X-Figma-Token": token } });
  if (res.status === 429) throw new FigmaError("Figma is rate-limiting requests. Try again in a minute.", 429);
  if (res.status === 403 || res.status === 401)
    throw new FigmaError("Figma refused the token. Check it hasn't expired and can see the design file.");
  if (res.status === 404) throw new FigmaError("Figma couldn't find the design file or page.");
  if (!res.ok) throw new FigmaError(`Figma didn't respond properly (${res.status}). Try again.`);
  return res.json() as Promise<T>;
}

/** "CS - Pull Up a Seat - Slide 01" → { title: "pull up a seat", n: 1 }. No slide part counts as slide 1. */
export const normTitle = (s: string) =>
  s.toLowerCase().replace(/[’'‘]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function parseFrameName(name: string) {
  const m = name.match(/^\s*CS\s*[-–—]\s*(.+?)(?:\s*[-–—]\s*(?:slide|s)?\s*#?\s*(\d{1,3}))?\s*$/i);
  return m ? { title: normTitle(m[1]!), n: m[2] ? Number.parseInt(m[2], 10) : 1 } : null;
}

/** Top-level frames on the page that belong to a post, ordered by slide number. */
export async function findSlides(postTitle: string) {
  type Node = { id: string; name: string; type: string; children?: Node[] };
  const data = await figma<{ nodes: Record<string, { document: Node } | null> }>(
    `/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(FIGMA_PAGE_ID)}&depth=1`,
  );
  const page = data.nodes[FIGMA_PAGE_ID]?.document;
  const want = normTitle(postTitle);
  const byN = new Map<number, string>();
  for (const child of page?.children ?? []) {
    if (!["FRAME", "COMPONENT", "INSTANCE", "SECTION", "GROUP"].includes(child.type)) continue;
    const parsed = parseFrameName(child.name);
    if (parsed?.title === want && !byN.has(parsed.n)) byN.set(parsed.n, child.id);
  }
  return [...byN].sort((a, b) => a[0] - b[0]).map(([n, nodeId]) => ({ n, nodeId }));
}

/** Render frames to PNG at 2× and return the bytes per node id. */
export async function renderPngs(nodeIds: string[]) {
  const data = await figma<{ err: string | null; images: Record<string, string | null> }>(
    `/v1/images/${FIGMA_FILE_KEY}?ids=${encodeURIComponent(nodeIds.join(","))}&format=png&scale=2`,
  );
  if (data.err) throw new FigmaError(`Figma couldn't render the slides: ${data.err}`);
  const out = new Map<string, Uint8Array>();
  for (const id of nodeIds) {
    const url = data.images[id];
    if (!url) throw new FigmaError("Figma didn't send back an image for one of the slides. Try again.");
    const res = await fetch(url);
    if (!res.ok) throw new FigmaError("Couldn't download a slide image from Figma. Try again.");
    out.set(id, new Uint8Array(await res.arrayBuffer()));
  }
  return out;
}
