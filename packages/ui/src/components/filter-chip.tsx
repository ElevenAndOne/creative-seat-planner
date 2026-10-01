import { Toggle } from "@base-ui/react/toggle";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export interface FilterChipProps extends Omit<ComponentProps<typeof Toggle>, "className"> {
  className?: string;
}

/** A pressable pill for filtering, built on Base UI Toggle. */
export function FilterChip({ className, ...props }: FilterChipProps) {
  return (
    <Toggle
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-3 pl-2 text-[0.8125rem] font-medium outline-offset-2",
        "data-pressed:border-ink data-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)]",
        className,
      )}
      {...props}
    />
  );
}
