import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Optional leading adornment, e.g. a status dot. */
  icon?: ReactNode;
}

export interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Single-value select built on Base UI Select. */
export function Select<T extends string>({
  value,
  onValueChange,
  options,
  label,
  disabled,
  className,
}: SelectProps<T>) {
  const current = options.find((o) => o.value === value);
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(v) => v != null && onValueChange(v as T)}
      disabled={disabled}
    >
      {label && <BaseSelect.Label className="mb-1 block text-xs text-muted">{label}</BaseSelect.Label>}
      <BaseSelect.Trigger
        className={cn(
          "flex h-9 w-full max-w-[220px] cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-line bg-white px-2.5 text-left font-medium outline-none",
          "focus-visible:border-ink data-popup-open:border-ink data-disabled:cursor-default data-disabled:opacity-60",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {current?.icon}
          <BaseSelect.Value className="truncate" />
        </span>
        <BaseSelect.Icon className="text-muted">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3.5 4.75 6 2.25l2.5 2.5M3.5 7.25 6 9.75l2.5-2.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-40 outline-none select-none" sideOffset={6} alignItemWithTrigger={false}>
          <BaseSelect.Popup
            className={cn(
              "min-w-[var(--anchor-width)] origin-[var(--transform-origin)] rounded-[14px] border border-line bg-white p-1 shadow-[0_12px_32px_-12px_rgb(20_18_26/0.35)] outline-none",
              "transition-[scale,opacity] duration-100 data-starting-style:scale-97 data-starting-style:opacity-0 data-ending-style:scale-97 data-ending-style:opacity-0",
            )}
          >
            <BaseSelect.List className="max-h-[var(--available-height)] overflow-y-auto">
              {options.map((o) => (
                <BaseSelect.Item
                  key={o.value}
                  value={o.value}
                  className="flex cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-2 text-sm outline-none select-none data-highlighted:bg-paper data-selected:font-semibold"
                >
                  {o.icon}
                  <BaseSelect.ItemText className="flex-1">{o.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-ink">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="m2.5 6.25 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
