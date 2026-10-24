import type { ReactNode } from "react";
import { classNames } from "@/utils";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={classNames(
        "flex flex-col items-center justify-center rounded-4xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-xl text-brand-600">
        {icon ?? "✦"}
      </div>

      <h3 className="mt-4 text-base font-semibold text-ink-900">{title}</h3>

      {description && (
        <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
