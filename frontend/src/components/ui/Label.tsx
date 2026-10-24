import type { LabelHTMLAttributes } from "react";
import { classNames } from "@/utils";

export function Label({
  className,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={classNames(
        "mb-2 block text-sm font-medium text-ink-700",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
