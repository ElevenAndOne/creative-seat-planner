import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  /** `plain` is a quiet outlined tag; `none` leaves colour to the caller. */
  tone?: "plain" | "none";
}

/** Small uppercase tag. */
export function Pill({ tone = "none", className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.08em] uppercase",
        tone === "plain" && "bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]",
        className,
      )}
      {...props}
    />
  );
}
