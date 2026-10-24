import type { ReactNode } from "react";
import { classNames } from "@/utils";

export interface TabItem {
  value: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Small segmented control used for period/status filters.
 * Keeps the active option visually distinct without relying on colour alone
 * (uses shape/contrast + aria-selected).
 */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={classNames(
        "inline-flex flex-wrap items-center gap-1 rounded-full border border-line bg-mist p-1",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={classNames(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              active
                ? "bg-white text-ink-900 shadow-sm"
                : "text-ink-500 hover:text-ink-800"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
