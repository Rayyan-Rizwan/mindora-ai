import { forwardRef } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { classNames } from "@/utils";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  children: ReactNode;
}

const base =
  "w-full appearance-none rounded-2xl border bg-white px-4 py-3 pr-10 text-sm text-ink-900 shadow-sm outline-none transition-all focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-400";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid, className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={classNames(
            base,
            invalid
              ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
              : "border-line",
            className
          )}
          {...props}
        >
          {children}
        </select>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5 10 12.5l5-5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    );
  }
);
