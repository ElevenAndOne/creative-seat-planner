import { cn, FilterChip } from "@creative-seat/ui";
import { PILLAR_CLASS, PILLAR_KEYS, PILLARS } from "../data/plan";
import type { PillarKey, Post } from "../data/types";

export interface LegendProps {
  posts: Post[];
  filter: PillarKey | null;
  onFilterChange: (f: PillarKey | null) => void;
}

/** Pillar filter chips plus a proportional mix bar. */
export function Legend({ posts, filter, onFilterChange }: LegendProps) {
  const counts = Object.fromEntries(PILLAR_KEYS.map((k) => [k, posts.filter((p) => p.pillar === k).length]));
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line py-[18px]">
      <span className="mr-1.5 text-[0.8125rem] text-muted">Pillars</span>
      {PILLAR_KEYS.map((k) => (
        <FilterChip key={k} pressed={filter === k} onPressedChange={(on) => onFilterChange(on ? k : null)}>
          <span className={cn("size-3.5 rounded-[5px]", PILLAR_CLASS[k])} />
          {PILLARS[k].name} <span className="text-muted">{PILLARS[k].role}</span>
          <span className="text-muted tabular-nums">{counts[k]}</span>
        </FilterChip>
      ))}
      <div
        className="ml-auto flex h-2 max-w-[360px] min-w-40 flex-[1_1_220px] overflow-hidden rounded-full border border-line"
        title={`Pillar mix across ${posts.length} posts`}
      >
        {PILLAR_KEYS.map((k) => (
          <div
            key={k}
            className={cn("h-full shadow-none", k === "backlog" ? "bg-ink" : PILLAR_CLASS[k])}
            style={{ flex: counts[k] }}
          />
        ))}
      </div>
    </div>
  );
}
