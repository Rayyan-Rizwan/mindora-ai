import type { ReactNode } from "react";
import { classNames } from "@/utils";

export interface BreakdownRow {
  label: ReactNode;
  value: ReactNode;
}

export interface BreakdownCardProps {
  title: ReactNode;
  total?: ReactNode;
  rows: BreakdownRow[];
  className?: string;
}

/**
 * Label/value breakdown used by the admin analytics and reports pages to show
 * grouped counts per status, type or role.
 */
export function BreakdownCard({
  title,
  total,
  rows,
  className,
}: BreakdownCardProps) {
  return (
    <div
      className={classNames(
        "rounded-4xl border border-line bg-white p-6 shadow-card",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {total !== undefined && (
          <span className="text-2xl font-semibold text-ink-900">{total}</span>
        )}
      </div>

      {rows.length > 0 && (
        <dl className="mt-4 space-y-1.5">
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <dt className="text-ink-500">{row.label}</dt>
              <dd className="font-medium text-ink-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
