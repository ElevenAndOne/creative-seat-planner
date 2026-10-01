import { Tabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SegmentedTabsProps<T extends string> {
  value: T | null;
  onValueChange: (value: T) => void;
  items: { value: T; label: ReactNode }[];
  "aria-label": string;
  size?: "md" | "sm";
  className?: string;
}

/**
 * A pill-shaped tab switcher built on Base UI Tabs. Use it on its own as a
 * view switcher; pass `null` as `value` to show no tab as active.
 */
export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  items,
  size = "md",
  className,
  ...aria
}: SegmentedTabsProps<T>) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <Tabs.List
        aria-label={aria["aria-label"]}
        className={cn(
          "flex",
          size === "md" ? "gap-1 rounded-full border border-line bg-white p-1" : "gap-1",
          className,
        )}
      >
        {items.map((item) => (
          <Tabs.Tab
            key={item.value}
            value={item.value}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-full font-medium outline-offset-2 data-active:bg-ink data-active:text-paper",
              size === "md"
                ? "px-4 py-[7px] text-sm"
                : "border border-line px-[11px] py-[5px] text-[0.8125rem] data-active:border-ink",
            )}
          >
            {item.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
