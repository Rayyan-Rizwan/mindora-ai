import { classNames } from "@/utils";

export type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-14 w-14 text-base",
};

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return `${first}${last}`.toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-200 to-brand-400 font-bold text-brand-800",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
