import { Field } from "@base-ui/react/field";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TextFieldProps extends Omit<ComponentProps<typeof Field.Control>, "className"> {
  label: ReactNode;
  /** Shown under the input when set. */
  error?: string;
  className?: string;
}

/** Labelled input built on Base UI Field. Works for `type="date"` too. */
export function TextField({ label, error, className, disabled, ...props }: TextFieldProps) {
  return (
    <Field.Root disabled={disabled} invalid={!!error} className="flex flex-col">
      <Field.Label className="mb-1 text-xs text-muted">{label}</Field.Label>
      <Field.Control
        className={cn(
          "h-9 w-full max-w-[220px] rounded-[10px] border border-line bg-white px-2.5 font-medium outline-none focus:border-ink data-disabled:opacity-60 data-invalid:border-danger",
          className,
        )}
        {...props}
      />
      {error && <Field.Error match className="mt-1 text-xs text-danger">{error}</Field.Error>}
    </Field.Root>
  );
}
