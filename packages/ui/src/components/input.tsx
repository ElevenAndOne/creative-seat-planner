import { Input as BaseInput } from "@base-ui/react/input";
import { useLayoutEffect, useRef, type ComponentProps, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const field =
  "w-full rounded-[10px] border border-line bg-white px-2.5 outline-none focus:border-ink data-disabled:opacity-60 disabled:opacity-60";

export interface InputProps extends Omit<ComponentProps<typeof BaseInput>, "className"> {
  className?: string;
}

/** Single-line input built on Base UI Input. */
export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(field, "h-9", className)} {...props} />;
}

/** Multi-line input that grows to fit its content. */
export function TextArea({ className, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={cn(field, "resize-none overflow-hidden py-2 leading-normal", className)}
      {...props}
    />
  );
}
