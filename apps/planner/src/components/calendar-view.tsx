import { Button, cn, PlusIcon } from "@creative-seat/ui";
import { useState, type DragEvent, type ReactNode } from "react";
import type { PillarKey, Post } from "../data/types";
import { addDays, DAYS, iso, MONTHS, START, weekOf, WEEKS } from "../lib/dates";
import type { Plan } from "../lib/use-plan";
import { PostChip } from "./post-chip";

export interface CalendarViewProps {
  plan: Plan;
  filter: PillarKey | null;
  /** Move a post to a date; `""` takes it off the calendar. */
  onMove: (post: Post, date: string) => void;
  /** Editors can drag posts and add new ones. */
  canEdit: boolean;
  onAdd: () => void;
}

const TRAY = "tray";

export function CalendarView({ plan, filter, onMove, canEdit, onAdd }: CalendarViewProps) {
  const { posts } = plan;
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const byDate: Record<string, Post[]> = {};
  const off: Post[] = [];
  posts.forEach((p) => {
    const d = p.date;
    if (d && weekOf(d)) (byDate[d] ??= []).push(p);
    else off.push(p);
  });

  const endDrag = () => {
    setDragId(null);
    setOverKey(null);
  };

  /** Drop-zone handlers for a day cell (`date`) or the tray (`""`). */
  const zone = (key: string, date: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overKey !== key) setOverKey(key);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverKey((k) => (k === key ? null : k));
    },
    onDrop: (e: DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      const post = posts.find((p) => p.id === dragId);
      endDrag();
      if (post && post.date !== date) onMove(post, date);
    },
  });

  const chip = (p: Post, className?: string) => (
    <PostChip
      key={p.id}
      post={p}
      dim={!!filter && filter !== p.pillar}
      draggable={canEdit}
      dragging={dragId === p.id}
      onDragStart={setDragId}
      onDragEnd={endDrag}
      className={className}
    />
  );

  const cells: ReactNode[] = [];
  for (let w = 0; w < WEEKS; w++) {
    const mon = addDays(START, w * 7);
    const n = posts.filter((p) => weekOf(p.date) === w + 1).length;
    cells.push(
      <div key={`w${w}`} className="flex flex-col gap-0.5 border-b border-line px-2 py-2.5 text-xs text-muted">
        <b className="text-[0.9375rem] font-semibold text-ink">W{w + 1}</b>
        <span>
          {n} post{n === 1 ? "" : "s"}
        </span>
      </div>,
    );
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const k = iso(d);
      const showMonth = d.getDate() === 1 || (w === 0 && i === 0);
      cells.push(
        <div
          key={k}
          {...zone(k, k)}
          className={cn(
            "flex min-h-[108px] flex-col gap-[5px] border-b border-l border-line p-1.5 transition-colors",
            i > 4 && "bg-weekend",
            overKey === k && "bg-soft outline-2 -outline-offset-3 outline-forest outline-dashed",
          )}
        >
          <span className={cn("text-xs tabular-nums", showMonth ? "font-semibold text-ink" : "text-muted")}>
            {d.getDate()}
            {showMonth && ` ${MONTHS[d.getMonth()]}`}
          </span>
          {(byDate[k] ?? []).sort((a, b) => a.number - b.number).map((p) => chip(p))}
        </div>,
      );
    }
  }

  return (
    <>
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <h2 className="text-xl font-bold tracking-[-0.01em]">Posting calendar</h2>
        <div className="flex items-center gap-4">
          <p className="text-[0.8125rem] text-muted">
            {canEdit
              ? "Drag a post to another day to reschedule it. Click a post to open its brief."
              : "Click a post to open its brief. Sign in as an editor to reschedule."}
          </p>
          {canEdit && (
            <Button variant="ink" icon={<PlusIcon />} onClick={onAdd}>
              Add post
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto border-t border-ink pb-1.5">
        <div className="grid min-w-[820px] grid-cols-[76px_repeat(7,minmax(104px,1fr))]">
          {["Week", ...DAYS].map((d) => (
            <div
              key={d}
              className="border-b border-line px-2 py-2.5 text-xs font-semibold tracking-[0.06em] text-muted uppercase"
            >
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>
      <div
        {...zone(TRAY, "")}
        className={cn(
          "mt-[18px] flex min-h-[60px] flex-wrap items-center gap-2 rounded-[14px] border border-dashed border-muted p-3",
          overKey === TRAY && "bg-soft",
        )}
      >
        {off.length ? (
          <>
            <p className="basis-full text-[0.8125rem] text-muted">
              Not on the calendar ({off.length}) — drag onto a day to schedule.
            </p>
            {off.map((p) => chip(p, "w-[180px]"))}
          </>
        ) : (
          <p className="text-[0.8125rem] text-muted">
            {canEdit ? "Drop a post here to take it off the calendar." : "Every post is on the calendar."}
          </p>
        )}
      </div>
    </>
  );
}
