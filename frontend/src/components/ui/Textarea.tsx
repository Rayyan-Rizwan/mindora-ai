import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { classNames } from "@/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const base =
  "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-300 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-400";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={classNames(
          base,
          "resize-y",
          invalid
            ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
            : "border-line",
          className
        )}
        {...props}
      />
    );
  }
);
