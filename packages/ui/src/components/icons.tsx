import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children"> & { size?: number };

function icon(d: string, strokeWidth = 1.4) {
  return function Icon({ size = 12, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        aria-hidden="true"
        {...props}
      >
        <path d={d} />
      </svg>
    );
  };
}

export const ArrowUpRightIcon = icon("M3.5 8.5 8.5 3.5M4.25 3.5H8.5v4.25");
export const ArrowLeftIcon = icon("M10 6H2.5M5.5 3 2.5 6l3 3");
export const ArrowRightIcon = icon("M2 6h7.5M6.5 3l3 3-3 3");
export const ChevronLeftIcon = icon("M7.5 2.5 4 6l3.5 3.5", 1.6);
export const ChevronRightIcon = icon("M4.5 2.5 8 6 4.5 9.5", 1.6);
export const CheckIcon = icon("m2.5 6.25 2.25 2.25 4.75-5", 1.6);
export const PlusIcon = icon("M6 2.5v7M2.5 6h7");
export const CloseIcon = icon("m3 3 6 6M9 3 3 9");

/** Solid play triangle, used to mark animated slides. */
export function PlayIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3.5 2.25v7.5L9.75 6z" />
    </svg>
  );
}
