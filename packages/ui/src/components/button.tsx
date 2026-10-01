import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

type BaseProps = ComponentProps<typeof BaseButton>;

export interface ButtonProps extends Omit<BaseProps, "className"> {
  variant?: "outline" | "ink";
  className?: string;
  /** Trailing glyph shown in a volt disc on the `ink` variant. */
  icon?: ReactNode;
}

const styles = {
  outline:
    "h-10 gap-2.5 border border-line bg-white px-4 text-sm font-medium hover:not-data-disabled:border-ink data-disabled:opacity-35 data-disabled:cursor-default",
  ink: "group h-9 gap-2.5 bg-ink pr-[5px] pl-3.5 text-[0.8125rem] font-medium text-paper",
};

export function Button({ variant = "outline", className, icon, children, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex cursor-pointer items-center whitespace-nowrap rounded-full outline-offset-3 select-none",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
      {variant === "ink" && icon !== null && (
        <i
          aria-hidden="true"
          className="grid size-[26px] place-items-center rounded-full bg-volt text-[0.8rem] not-italic text-ink transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-106"
        >
          {icon ?? "↗"}
        </i>
      )}
    </BaseButton>
  );
}
