import { classNames } from "@/utils";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

/**
 * Accessible loading indicator. Inherits `currentColor` so it works on both
 * light and dark surfaces.
 */
export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <span
        aria-hidden="true"
        className={classNames(
          "block animate-spin rounded-full border-current border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
    </span>
  );
}
