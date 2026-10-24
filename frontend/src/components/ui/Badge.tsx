import type { HTMLAttributes } from "react";
import { classNames } from "@/utils";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-mist text-ink-600",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Maps common backend status strings to a consistent badge tone so statuses
 * look the same everywhere (appointments, applications, assessments, users).
 */
export function statusTone(status: string): BadgeTone {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "approved":
    case "active":
    case "completed":
    case "verified":
    case "success":
    case "enabled":
      return "success";
    case "pending":
    case "under_review":
    case "scheduled":
    case "in_progress":
      return "warning";
    case "cancelled":
    case "canceled":
    case "rejected":
    case "inactive":
    case "deactivated":
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}
