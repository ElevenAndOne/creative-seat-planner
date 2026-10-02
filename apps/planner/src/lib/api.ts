import type { ArtworkSlide, Comment, CommentRole, InspirationImage, PluginKey, Post, PostPatch } from "../data/types";
import { getToken } from "./auth";

// Same-origin /api on Vercel; set VITE_API_URL to call the API elsewhere (e.g. the Neon Function).
const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  if (auth) {
    const token = await getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError("Can't reach the planner. Check your connection.", 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${res.status}).`, res.status);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export const api = {
  posts: () => request<Post[]>("/posts"),
  me: () => request<{ email: string | null; editor: boolean }>("/me", {}, true),
  create: (patch: PostPatch) => request<Post>("/posts", { method: "POST", body: JSON.stringify(patch) }, true),
  update: (id: string, patch: PostPatch) =>
    request<Post>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, true),
  remove: (id: string) => request<null>(`/posts/${id}`, { method: "DELETE" }, true),

  feedback: (postId: string) => request<Comment[]>(`/posts/${postId}/feedback`, {}, true),
  addFeedback: (postId: string, body: string, role: CommentRole) =>
    request<{ id: string }>(`/posts/${postId}/feedback`, { method: "POST", body: JSON.stringify({ body, role }) }, true),
  setFeedbackStatus: (id: string, status: Comment["status"]) =>
    request<null>(`/feedback/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }, true),
  removeFeedback: (id: string) => request<null>(`/feedback/${id}`, { method: "DELETE" }, true),

  inspiration: (postId: string) => request<InspirationImage[]>(`/posts/${postId}/inspiration`, {}, true),
  /** Upload straight to storage with a short-lived URL, then record it on the brief. */
  async addInspiration(postId: string, file: File) {
    const { key, uploadUrl } = await request<{ key: string; uploadUrl: string }>(
      `/posts/${postId}/inspiration/upload`,
      { method: "POST", body: JSON.stringify({ contentType: file.type, size: file.size }) },
      true,
    );
    const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } }).catch(
      () => null,
    );
    if (!put?.ok) throw new ApiError(`Couldn't upload ${file.name}. Try again.`, put?.status ?? 0);
    return request<{ id: string }>(
      `/posts/${postId}/inspiration`,
      { method: "POST", body: JSON.stringify({ key, name: file.name, contentType: file.type }) },
      true,
    );
  },
  removeInspiration: (id: string) => request<null>(`/inspiration/${id}`, { method: "DELETE" }, true),

  artwork: (postId: string) => request<ArtworkSlide[]>(`/posts/${postId}/artwork`, {}, true),
  refreshArtwork: (postId: string) =>
    request<{ slides: number }>(`/posts/${postId}/artwork/refresh`, { method: "POST" }, true),

  pluginKeys: () => request<PluginKey[]>("/plugin-keys", {}, true),
  createPluginKey: (label: string) =>
    request<{ id: string; key: string }>("/plugin-keys", { method: "POST", body: JSON.stringify({ label }) }, true),
  revokePluginKey: (id: string) => request<null>(`/plugin-keys/${id}`, { method: "DELETE" }, true),
};

/** Where the Figma plugin should send artwork. Calls the API directly (not through a proxy) for large videos. */
export const PLUGIN_API_URL = import.meta.env.VITE_PLUGIN_API_URL || "https://br-wandering-morning-b5wjz3x1-api.compute.c-7.us-east-2.aws.neon.tech";
