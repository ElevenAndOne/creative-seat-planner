import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  color: string;
  ring?: boolean;
}

export function StatusDot({ color, ring, className, style, ...props }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        ring && "shadow-[0_0_0_1.5px_var(--color-white)]",
        className,
      )}
      style={{ background: color, ...style }}
      {...props}
    />
  );
}

export interface StatusLabelProps extends HTMLAttributes<HTMLSpanElement> {
  color: string;
}

/** A coloured dot followed by a status name. */
export function StatusLabel({ color, className, children, ...props }: StatusLabelProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", className)} {...props}>
      <StatusDot color={color} />
      {children}
    </span>
  );
}
