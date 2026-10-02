import { useCallback, useEffect, useState } from "react";
import type { ArtworkSlide, Comment, InspirationImage } from "../data/types";
import { api } from "./api";

/** Artwork, feedback and inspiration for one brief. Only loads for signed-in viewers. */
export function useBriefExtras(postId: string, signedIn: boolean) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [slides, setSlides] = useState<ArtworkSlide[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    const [c, i, a] = await Promise.allSettled([api.feedback(postId), api.inspiration(postId), api.artwork(postId)]);
    if (c.status === "fulfilled") setComments(c.value);
    if (i.status === "fulfilled") setImages(i.value);
    if (a.status === "fulfilled") setSlides(a.value);
    setLoaded(true);
  }, [postId, signedIn]);

  useEffect(() => {
    setComments([]);
    setImages([]);
    setSlides([]);
    setLoaded(false);
    void refresh();
    // Pick up other people's comments when coming back to the tab.
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { comments, images, slides, loaded, refresh };
}
