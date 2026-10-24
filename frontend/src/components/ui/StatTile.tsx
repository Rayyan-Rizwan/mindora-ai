import type { ReactNode } from "react";
import { classNames } from "@/utils";

export interface StatTileProps {
  title: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}

/**
 * Compact metric tile used across the admin overview, reports, analytics and
 * content-management pages so every "big number" card looks identical.
 */
export function StatTile({ title, value, detail, className }: StatTileProps) {
  return (
    <div
      className={classNames(
        "rounded-4xl border border-line bg-white p-5 shadow-card",
        className
      )}
    >
      <p className="text-sm font-medium text-ink-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-ink-400">{detail}</p>}
    </div>
  );
}
