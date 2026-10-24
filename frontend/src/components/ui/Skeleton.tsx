import type { HTMLAttributes } from "react";
import { classNames } from "@/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={classNames("animate-pulse rounded-2xl bg-mist", className)}
      {...props}
    />
  );
}
