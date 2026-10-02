// Creative Seat — Publish to planner.
// Finds "CS - <post title> - Slide NN" frames on the current page, exports each as a
// 2x PNG (plus an MP4 when the frame is animated) and uploads them to the planner API.

type Settings = { apiUrl: string; key: string };
type SessionPost = { id: string; number: number; title: string; match: string };
type FoundSlide = { n: number; nodeId: string; name: string; animated: boolean };
type FoundGroup = { title: string; match: string; slides: FoundSlide[] };

type FromUi =
  | { type: "save-settings"; settings: Settings }
  | { type: "scan" }
  | { type: "publish"; groups: { postId: string; slides: FoundSlide[] }[] }
  | { type: "close" };

const DEFAULT_API = "https://br-wandering-morning-b5wjz3x1-api.compute.c-7.us-east-2.aws.neon.tech";

figma.showUI(__html__, { width: 400, height: 560, themeColors: true });

const post = (msg: unknown) => figma.ui.postMessage(msg);

/** Same normalisation the planner uses, so frame names match post titles. */
const normTitle = (s: string) =>
  s.toLowerCase().replace(/[’'‘]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function parseFrameName(name: string) {
  const m = name.match(/^\s*CS\s*[-–—]\s*(.+?)(?:\s*[-–—]\s*(?:slide|s)?\s*#?\s*(\d{1,3}))?\s*$/i);
  return m ? { title: m[1]!.trim(), match: normTitle(m[1]!), n: m[2] ? parseInt(m[2], 10) : 1 } : null;
}

/** A frame is animated when it, or anything inside it, has Motion keyframes. */
function isAnimated(frame: SceneNode) {
  const has = (n: BaseNode) => "animations" in n && Object.keys((n as SceneNode & { animations: object }).animations ?? {}).length > 0;
  if (has(frame)) return true;
  return "findOne" in frame && !!(frame as FrameNode).findOne((n) => has(n));
}

function scan(): FoundGroup[] {
  const groups = new Map<string, FoundGroup>();
  for (const node of figma.currentPage.children) {
    if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") continue;
    const parsed = parseFrameName(node.name);
    if (!parsed) continue;
    const g = groups.get(parsed.match) ?? { title: parsed.title, match: parsed.match, slides: [] };
    if (!g.slides.some((s) => s.n === parsed.n)) {
      g.slides.push({ n: parsed.n, nodeId: node.id, name: node.name, animated: isAnimated(node) });
    }
    groups.set(parsed.match, g);
  }
  return [...groups.values()].map((g) => ({ ...g, slides: g.slides.sort((a, b) => a.n - b.n) }));
}

async function loadSettings(): Promise<Settings> {
  const s = (await figma.clientStorage.getAsync("settings")) as Partial<Settings> | undefined;
  return { apiUrl: s?.apiUrl || DEFAULT_API, key: s?.key || "" };
}

async function api(settings: Settings, path: string, init: FetchOptions = {}) {
  const res = await fetch(settings.apiUrl.replace(/\/$/, "") + path, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${settings.key}` },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      message = (await res.json()).error ?? message;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

async function connect() {
  const settings = await loadSettings();
  post({ type: "settings", settings });
  if (!settings.key) return post({ type: "status", text: "Paste your plugin key from the planner to get started." });
  try {
    const session = (await api(settings, "/plugin/session")) as { owner: string; posts: SessionPost[] };
    post({ type: "session", owner: session.owner, posts: session.posts, groups: scan(), page: figma.currentPage.name });
  } catch (e) {
    post({ type: "status", text: (e as Error).message, error: true });
  }
}

async function publish(groups: { postId: string; slides: FoundSlide[] }[]) {
  const settings = await loadSettings();
  const total = groups.reduce((n, g) => n + g.slides.length, 0);
  let done = 0;
  try {
    for (const g of groups) {
      for (const s of g.slides) {
        const node = (await figma.getNodeByIdAsync(s.nodeId)) as FrameNode | null;
        if (!node) throw new Error(`Frame “${s.name}” is gone. Scan again.`);
        const q = `?node=${encodeURIComponent(s.nodeId)}`;
        post({ type: "progress", done, total, text: `Exporting ${s.name}…` });
        const png = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
        await api(settings, `/plugin/artwork/${g.postId}/${s.n}/still${q}`, {
          method: "PUT",
          headers: { "content-type": "image/png" },
          body: png,
        });
        if (s.animated) {
          post({ type: "progress", done, total, text: `Rendering video for ${s.name}… (can take a while)` });
          const mp4 = await node.exportAsync({ format: "MP4", fps: 30, quality: "HIGH", constraint: { type: "SCALE", value: 2 } });
          await api(settings, `/plugin/artwork/${g.postId}/${s.n}/video${q}`, {
            method: "PUT",
            headers: { "content-type": "video/mp4" },
            body: mp4,
          });
        }
        done++;
        post({ type: "progress", done, total, text: `Published ${s.name}` });
      }
      // Remove slides that no longer exist in Figma.
      await api(settings, `/plugin/artwork/${g.postId}/done`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slides: g.slides.map((s) => s.n) }),
      });
    }
    post({ type: "published", total });
    figma.notify(`Published ${total} slide${total === 1 ? "" : "s"} to the planner`);
  } catch (e) {
    post({ type: "status", text: (e as Error).message, error: true });
  }
}

figma.ui.onmessage = async (msg: FromUi) => {
  if (msg.type === "save-settings") {
    await figma.clientStorage.setAsync("settings", msg.settings);
    await connect();
  } else if (msg.type === "scan") {
    await connect();
  } else if (msg.type === "publish") {
    await publish(msg.groups);
  } else if (msg.type === "close") {
    figma.closePlugin();
  }
};

void connect();
