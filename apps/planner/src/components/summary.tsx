import { Chair, StatusLabel } from "@creative-seat/ui";
import { statusOf, STATUSES } from "../data/plan";
import type { StatusKey } from "../data/types";
import { fmt, pad2, parse, today } from "../lib/dates";
import { go } from "../lib/use-hash-route";
import type { Plan } from "../lib/use-plan";

export function Summary({ plan }: { plan: Plan }) {
  const { posts, sorted } = plan;
  const dated = sorted.filter((p) => p.date);
  const first = dated[0];
  const last = dated[dated.length - 1];

  const counts = Object.fromEntries(STATUSES.map((s) => [s.k, 0])) as Record<StatusKey, number>;
  posts.forEach((p) => counts[p.status]++);
  const done = counts.ok + counts.posted;

  const now = today();
  const upcoming =
    dated.find((p) => p.status !== "posted" && parse(p.date)! >= now) ?? dated.find((p) => p.status !== "posted");

  let when = "";
  if (upcoming) {
    const days = Math.round((parse(upcoming.date)!.getTime() - now.getTime()) / 864e5);
    when =
      days === 0 ? "today" : days === 1 ? "tomorrow" : days > 1 ? `in ${days} days` : `${Math.abs(days)} days overdue`;
  }

  const ready = plan.load.status === "ready";
  const stats = [
    { value: ready ? String(posts.length) : "–", label: `posts · ${dated.length} scheduled` },
    { value: first ? fmt(first.date).slice(4) : "–", label: `to ${last ? fmt(last.date).slice(4) : "–"}` },
    { value: ready ? `${done}/${posts.length}` : "–", label: "approved or posted" },
  ];

  return (
    <section className="wrap pt-[clamp(28px,4vw,56px)] pb-[clamp(20px,3vw,36px)]">
      <div className="grid items-end gap-x-12 gap-y-7 min-[901px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="eyebrow text-muted">Organic social · LinkedIn + Instagram</p>
          <h1 className="font-serif text-[clamp(2.4rem,5vw,4.4rem)] leading-none tracking-[-0.015em] text-balance">
            Twelve weeks. <em>Eighteen seats.</em>
          </h1>
          <p className="mt-3.5 max-w-[52ch] text-muted">
            The launch plan for Creative Seat’s feed. Drag posts between days on the calendar, scan every idea in
            Content, and open any post for its one-page creative brief.
          </p>
        </div>
        <div className="grid grid-cols-3 border-t border-ink">
          {stats.map((s) => (
            <div key={s.label} className="pt-3.5 pr-3">
              <b className="block text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] tabular-nums">
                {s.value}
              </b>
              <span className="text-[0.8125rem] text-muted">{s.label}</span>
            </div>
          ))}
          {upcoming && (
            <button
              type="button"
              onClick={() => go(upcoming.id)}
              className="col-span-full mt-4 flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] border border-line bg-white px-3.5 py-3 text-left hover:border-ink"
            >
              <Chair className="w-[18px] text-ink" />
              <span className="min-w-0 flex-1">
                <small className="block text-xs text-muted">
                  Next up · {fmt(upcoming.date)} · {when}
                </small>
                <strong className="font-semibold">
                  No. {pad2(upcoming.number)} {upcoming.title}
                </strong>
              </span>
              <StatusLabel color={statusOf(upcoming.status).color}>{statusOf(upcoming.status).name}</StatusLabel>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
