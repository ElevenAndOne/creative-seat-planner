import { Chair, ChevronLeftIcon, ChevronRightIcon, cn, PlayIcon, useToast } from "@creative-seat/ui";
import { useEffect, useState } from "react";
import type { ArtworkSlide, PillarKey, Post } from "../data/types";
import { api, ApiError } from "../lib/api";
import { pad2 } from "../lib/dates";
import type { Viewer } from "../lib/use-viewer";

const PLACEHOLDER: Record<PillarKey, string> = {
  service: "bg-forest text-volt",
  seat: "bg-volt text-ink",
  work: "bg-chalk text-ink",
  backlog: "bg-white text-ink shadow-ink",
};

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export interface ArtworkPanelProps {
  post: Post;
  slides: ArtworkSlide[];
  viewer: Viewer;
  onChange: () => Promise<void>;
}

/**
 * The post's artwork from Figma: stills via "Refresh artwork", looping MP4s for
 * animated slides via the Figma plugin. Falls back to a pillar-coloured placeholder.
 */
export function ArtworkPanel({ post: p, slides, viewer, onChange }: ArtworkPanelProps) {
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const total = slides.length;
  const i = Math.min(index, Math.max(total - 1, 0));
  const slide = slides[i];
  const playVideo = !!slide?.videoUrl && !reducedMotion();

  // Arrow keys step through slides when focus isn't in a field.
  useEffect(() => {
    if (total < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (/input|textarea|select/i.test((document.activeElement?.tagName ?? "")) || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowRight") setIndex((n) => Math.min(total - 1, n + 1));
      if (e.key === "ArrowLeft") setIndex((n) => Math.max(0, n - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const refresh = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { slides: n } = await api.refreshArtwork(p.id);
      await onChange();
      setIndex(0);
      setMessage({ text: `${n} slide${n === 1 ? "" : "s"} updated for everyone viewing this brief.`, error: false });
      toast("Artwork refreshed from Figma");
    } catch (e) {
      setMessage({ text: e instanceof ApiError ? e.message : "Couldn't refresh from Figma. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full max-w-[260px] flex-col gap-2.5 justify-self-start min-[761px]:justify-self-end">
      {slide ? (
        <div className="relative aspect-[11/16] overflow-hidden rounded-[22px] bg-chalk">
          <a href={slide.figmaUrl} target="_blank" rel="noopener" title={`Open slide ${slide.n} in Figma`}>
            {playVideo ? (
              <video
                key={slide.videoUrl}
                src={slide.videoUrl!}
                poster={slide.stillUrl}
                autoPlay
                muted
                loop
                playsInline
                aria-label={`Animated slide ${slide.n} of ${total} for post ${pad2(p.number)}, ${p.title}`}
                className="size-full object-cover"
              />
            ) : (
              <img
                src={slide.stillUrl}
                alt={`Slide ${slide.n} of ${total} for post ${pad2(p.number)}, ${p.title}, from Figma`}
                className="size-full object-cover"
              />
            )}
          </a>
          {total > 1 && (
            <>
              <span className="absolute top-2.5 left-2.5 rounded-full bg-ink/75 px-2 py-0.5 text-[0.6875rem] font-semibold text-paper tabular-nums">
                {pad2(i + 1)} / {pad2(total)}
              </span>
              <SlideNav dir="prev" disabled={i === 0} onClick={() => setIndex(i - 1)} />
              <SlideNav dir="next" disabled={i === total - 1} onClick={() => setIndex(i + 1)} />
            </>
          )}
        </div>
      ) : (
        <div className={cn("relative grid aspect-[11/16] place-items-center overflow-hidden rounded-[22px]", PLACEHOLDER[p.pillar])}>
          <span className="absolute top-2.5 left-3.5 font-serif text-[3.2rem] leading-none">{pad2(p.number)}</span>
          <Chair className="w-[38%]" />
          <span className="absolute inset-x-3 bottom-3 text-center text-[0.6875rem] font-semibold tracking-[0.08em] uppercase opacity-70">
            {viewer.email ? "Artwork not designed yet" : "Sign in to see artwork"}
          </span>
        </div>
      )}

      {total > 1 && (
        <div role="tablist" aria-label="Slides" className="flex gap-1.5 overflow-x-auto pb-0.5">
          {slides.map((t, j) => (
            <button
              key={t.n}
              type="button"
              role="tab"
              aria-selected={j === i}
              aria-label={`Slide ${t.n}${t.videoUrl ? ", animated" : ""}`}
              onClick={() => setIndex(j)}
              className={cn(
                "relative aspect-[11/16] w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent opacity-70 hover:opacity-100",
                j === i && "border-ink opacity-100",
              )}
            >
              <img src={t.stillUrl} alt="" className="size-full object-cover" />
              {t.videoUrl && (
                <i aria-hidden="true" className="absolute right-0.5 bottom-0.5 rounded bg-ink/80 px-0.5 py-0.5 text-paper not-italic">
                  <PlayIcon size={7} />
                </i>
              )}
            </button>
          ))}
        </div>
      )}

      {viewer.email && (
        <div className="flex flex-col gap-1.5 text-xs text-muted">
          {slide?.videoUrl && (
            <span className="font-medium text-ink">
              {playVideo ? "● Animated · video from Figma" : "Animated · paused (reduced motion)"}
            </span>
          )}
          {viewer.editor && (
            <button
              type="button"
              disabled={busy}
              onClick={refresh}
              className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-line bg-white px-3 py-1.5 font-medium text-ink hover:border-ink disabled:cursor-progress disabled:opacity-60"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={cn(busy && "animate-spin")}>
                <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
                <path d="M13.5 2.5v3h-3" />
              </svg>
              {busy ? "Refreshing…" : "Refresh artwork"}
            </button>
          )}
          <span>
            {total
              ? `From Figma · ${total} slide${total === 1 ? "" : "s"} · ${when(slides.reduce((a, s) => (s.syncedAt > a ? s.syncedAt : a), slides[0]!.syncedAt))}`
              : `Looks for “CS - ${p.title} - Slide 01” in Figma`}
          </span>
          {message && (
            <p role="status" className={cn(message.error && "text-danger")}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SlideNav({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-paper/90 shadow-sm hover:bg-white disabled:hidden",
        dir === "prev" ? "left-2" : "right-2",
      )}
    >
      {dir === "prev" ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
    </button>
  );
}
