import type { HTMLAttributes } from "react";
import chairUrl from "../assets/chair.png";
import { cn } from "../lib/cn";

/**
 * The brand chair mark, rendered as a mask so it takes `currentColor`.
 * Size it with a width class; the aspect ratio is fixed.
 */
export function Chair({ className, style, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const mask = `url(${chairUrl}) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block aspect-[276/339] bg-current", className)}
      style={{ mask, WebkitMask: mask, ...style }}
      {...props}
    />
  );
}
