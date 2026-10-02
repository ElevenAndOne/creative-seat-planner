import { Chair, cn, Dialog, useToast } from "@creative-seat/ui";
import { useRef, useState, type DragEvent } from "react";
import type { InspirationImage } from "../data/types";
import { api, ApiError } from "../lib/api";
import type { Viewer } from "../lib/use-viewer";

const TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX = 20 * 1024 * 1024;

export interface InspirationSectionProps {
  postId: string;
  viewer: Viewer;
  images: InspirationImage[];
  onChange: () => Promise<void>;
  onSignIn: () => void;
}

/** Reference images on a brief. Editors add and remove; any signed-in viewer can browse. */
export function InspirationSection({ postId, viewer, images, onChange, onSignIn }: InspirationSectionProps) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [zoom, setZoom] = useState<InspirationImage | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  if (!viewer.email) {
    return (
      <p className="text-muted">
        <button type="button" className="cursor-pointer font-medium text-ink underline underline-offset-4" onClick={onSignIn}>
          Sign in
        </button>{" "}
        to see the reference images for this brief.
      </p>
    );
  }

  const upload = async (files: FileList | File[]) => {
    const list = [...files];
    const imgs = list.filter((f) => TYPES.includes(f.type));
    if (!imgs.length) return toast("Choose JPG, PNG, GIF or WebP images.");
    setBusy(true);
    let ok = 0;
    for (const f of imgs) {
      if (f.size > MAX) {
        toast(`${f.name} is over 20 MB. Choose a smaller file.`);
        continue;
      }
      try {
        await api.addInspiration(postId, f);
        ok++;
      } catch (e) {
        toast(e instanceof ApiError ? e.message : `Couldn't upload ${f.name}. Try again.`);
      }
    }
    setBusy(false);
    if (ok) {
      toast(`${ok} image${ok === 1 ? "" : "s"} added`);
      await onChange();
    }
  };

  const remove = async (id: string) => {
    if (armed !== id) {
      setArmed(id);
      setTimeout(() => setArmed((a) => (a === id ? null : a)), 4000);
      return;
    }
    setArmed(null);
    try {
      await api.removeInspiration(id);
      toast("Image removed");
      await onChange();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't remove that image.");
    }
  };

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      if (!e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOver(false);
      if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
    },
  };

  return (
    <div className="flex flex-col gap-3">
      {viewer.editor && (
        <button
          type="button"
          {...dropProps}
          disabled={busy}
          onClick={() => input.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border border-dashed border-muted bg-white px-4 py-5 text-center transition-colors hover:border-ink",
            over && "border-forest bg-soft",
            busy && "cursor-progress opacity-60",
          )}
        >
          <Chair className="w-4 text-ink" />
          <b className="font-semibold">{busy ? "Uploading…" : "Add inspiration images"}</b>
          <small className="text-xs text-muted">Drop images here or click to choose · JPG, PNG, GIF, WebP · up to 20 MB each</small>
          <input
            ref={input}
            type="file"
            accept={TYPES.join(",")}
            multiple
            hidden
            onChange={(e) => {
              if (e.currentTarget.files) void upload(e.currentTarget.files);
              e.currentTarget.value = "";
            }}
          />
        </button>
      )}

      {images.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {images.map((img) => (
            <li key={img.id} className="group relative">
              <button
                type="button"
                onClick={() => setZoom(img)}
                aria-label={`View ${img.name || "image"} larger`}
                className="block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-chalk"
              >
                <img src={img.url} alt={img.name || "Inspiration image"} loading="lazy" className="size-full object-cover" />
              </button>
              {viewer.editor && (
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className={cn(
                    "absolute top-1.5 right-1.5 cursor-pointer rounded-full bg-ink/80 px-2.5 py-1 text-[0.6875rem] font-medium text-paper opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                    armed === img.id && "bg-danger opacity-100",
                  )}
                >
                  {armed === img.id ? "Confirm" : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !viewer.editor && <p className="text-[0.8125rem] text-muted">No inspiration images yet. An Art Director can add references here.</p>
      )}

      <Dialog
        open={!!zoom}
        onOpenChange={(o) => !o && setZoom(null)}
        title={zoom?.name || "Inspiration"}
        description={zoom ? `Added by ${zoom.addedBy}` : undefined}
        className="w-[min(960px,calc(100vw-32px))]"
      >
        {zoom && <img src={zoom.url} alt={zoom.name} className="max-h-[70vh] w-full rounded-xl object-contain" />}
      </Dialog>
    </div>
  );
}
