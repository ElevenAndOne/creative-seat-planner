import { cn, Pill, StatusLabel } from "@creative-seat/ui";
import { GROUP_LABELS, PILLAR_CLASS, PILLARS, statusOf } from "../data/plan";
import type { PillarKey, Post } from "../data/types";
import { fmt, pad2, shortFormat, weekOf } from "../lib/dates";
import { go } from "../lib/use-hash-route";
import type { Plan } from "../lib/use-plan";

const groupOf = (w: number | null) =>
  w ? `Weeks ${w <= 4 ? "1–4" : w <= 8 ? "5–8" : "9–12"}` : "Unscheduled";

export function ContentView({ plan, filter }: { plan: Plan; filter: PillarKey | null }) {
  const { sorted } = plan;
  const groups: Record<string, Post[]> = {};
  sorted.forEach((p) => (groups[groupOf(weekOf(p.date))] ??= []).push(p));

  return Object.entries(groups).map(([key, ps], gi) => (
    <div key={key}>
      <div className={cn("mb-3 flex items-baseline gap-3 border-t border-ink pt-3", gi > 0 && "mt-7")}>
        <h2 className="text-xl font-bold tracking-[-0.01em]">{key}</h2>
        <span className="text-[0.8125rem] text-muted">
          {GROUP_LABELS[key]} · {ps.length} posts
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {ps.map((p) => (
          <PostCard key={p.id} post={p} dim={!!filter && filter !== p.pillar} />
        ))}
      </div>
    </div>
  ));
}

function PostCard({ post: p, dim }: { post: Post; dim: boolean }) {
  const st = statusOf(p.status);
  const w = weekOf(p.date);
  return (
    <button
      type="button"
      onClick={() => go(p.id)}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col gap-3 rounded-[18px] border border-line bg-white p-[18px] text-left transition-[border-color,transform,opacity] hover:-translate-y-0.5 hover:border-ink",
        dim && "opacity-22",
      )}
    >
      <span className="flex items-center justify-between gap-2 text-[0.8125rem]">
        <span className="font-serif text-[2rem] leading-[0.9]">{pad2(p.number)}</span>
        <Pill className={PILLAR_CLASS[p.pillar]}>{PILLARS[p.pillar].name}</Pill>
      </span>
      <h3 className="font-serif text-2xl leading-[1.05] font-normal tracking-[-0.005em] text-balance">{p.title}</h3>
      <p className="line-clamp-3 text-sm text-muted">{p.idea}</p>
      <span className="mt-auto flex justify-between gap-2.5 border-t border-line pt-3 text-xs text-muted">
        <span>
          {fmt(p.date)}
          {w ? ` · W${w}` : ""}
          <br />
          {[shortFormat(p.format), p.platform.replace(" lead", "")].filter(Boolean).join(" · ")}
        </span>
        <StatusLabel color={st.color}>{st.name}</StatusLabel>
      </span>
    </button>
  );
}
