import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[20px] border border-line bg-white p-[18px]", className)} {...props} />;
}

export function PanelHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2.5", className)}>
      <h3 className="text-base font-bold">{title}</h3>
      {action}
    </div>
  );
}
