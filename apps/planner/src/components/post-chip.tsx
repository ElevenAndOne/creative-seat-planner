import { cn, StatusDot } from "@creative-seat/ui";
import { PILLAR_CLASS, statusOf } from "../data/plan";
import type { Post } from "../data/types";
import { fmt, pad2, shortFormat } from "../lib/dates";
import { go } from "../lib/use-hash-route";

export interface PostChipProps {
  post: Post;
  dim: boolean;
  /** Editors can drag chips to reschedule. */
  draggable: boolean;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  className?: string;
}

/** A calendar chip that opens its brief on click, and can be dragged by editors. */
export function PostChip({ post, dim, draggable, dragging, onDragStart, onDragEnd, className }: PostChipProps) {
  const st = statusOf(post.status);
  return (
    <button
      type="button"
      draggable={draggable}
      onClick={() => go(post.id)}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", post.id);
        onDragStart(post.id);
      }}
      onDragEnd={onDragEnd}
      aria-label={`No. ${post.number} ${post.title}, ${fmt(post.date)}, ${st.name}. Open brief.`}
      className={cn(
        "relative block w-full rounded-[10px] px-2 pt-[7px] pb-2 text-left text-[0.78rem] leading-tight select-none",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "transition-[transform,box-shadow,opacity] hover:-translate-y-px",
        post.pillar === "backlog"
          ? "hover:shadow-[inset_0_0_0_1.5px_var(--color-ink),var(--shadow-lift)]"
          : "hover:shadow-lift",
        PILLAR_CLASS[post.pillar],
        dim && "opacity-22",
        dragging && "opacity-35",
        className,
      )}
    >
      <span className="mb-[3px] flex items-center justify-between text-[0.6875rem] font-semibold tracking-[0.05em] opacity-80">
        <span>No. {pad2(post.number)}</span>
        <StatusDot color={st.color} ring title={st.name} />
      </span>
      <span className="line-clamp-2 font-semibold">{post.title}</span>
      <span className="mt-1 block text-[0.6875rem] opacity-75">{shortFormat(post.format) || "No format yet"}</span>
    </button>
  );
}
