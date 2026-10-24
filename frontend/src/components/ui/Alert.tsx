import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "@/utils";

export type AlertTone = "info" | "success" | "warning" | "danger" | "brand";

const toneClasses: Record<AlertTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  brand: "border-brand-200 bg-brand-50 text-brand-800",
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: AlertTone;
  title?: ReactNode;
}

export function Alert({
  tone = "info",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={classNames(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
    </div>
  );
}
