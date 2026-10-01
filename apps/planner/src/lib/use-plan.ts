import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Post, PostPatch } from "../data/types";
import { api, ApiError } from "./api";

export type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

/**
 * The plan, loaded from the API. Edits apply immediately and roll back if the
 * server rejects them; `onError` receives the reason.
 */
export function usePlan(onError: (message: string) => void) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const errorRef = useRef(onError);
  errorRef.current = onError;

  const refresh = useCallback(async () => {
    try {
      setPosts(await api.posts());
      setLoad({ status: "ready" });
    } catch (e) {
      setLoad({ status: "error", message: e instanceof ApiError ? e.message : "Couldn't load the plan." });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fail = (e: unknown) => errorRef.current(e instanceof ApiError ? e.message : "That change didn't save.");

  /** Apply a patch locally, then persist it. Resolves true when saved. */
  const save = useCallback(async (id: string, patch: PostPatch) => {
    let before: Post | undefined;
    setPosts((ps) => ps.map((p) => (p.id === id ? ((before = p), { ...p, ...patch }) : p)));
    try {
      const saved = await api.update(id, patch);
      setPosts((ps) => ps.map((p) => (p.id === id ? saved : p)));
      return true;
    } catch (e) {
      if (before) setPosts((ps) => ps.map((p) => (p.id === id ? before! : p)));
      fail(e);
      return false;
    }
  }, []);

  const create = useCallback(async (patch: PostPatch) => {
    try {
      const post = await api.create(patch);
      setPosts((ps) => [...ps, post]);
      return post;
    } catch (e) {
      fail(e);
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await api.remove(id);
      setPosts((ps) => ps.filter((p) => p.id !== id));
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  }, []);

  /** Posts in date order; unscheduled last, ties broken by number. */
  const sorted = useMemo(
    () =>
      posts.slice().sort((a, b) => {
        const da = a.date || "9999";
        const db = b.date || "9999";
        return da < db ? -1 : da > db ? 1 : a.number - b.number;
      }),
    [posts],
  );

  return { posts, sorted, load, refresh, save, create, remove };
}

export type Plan = ReturnType<typeof usePlan>;
