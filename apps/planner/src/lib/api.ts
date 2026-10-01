import type { Post, PostPatch } from "../data/types";
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
};
