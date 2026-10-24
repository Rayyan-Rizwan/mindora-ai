import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "@/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift + border emphasis, for clickable cards. */
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-4xl border border-line bg-surface shadow-card",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        "flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-7",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return (
    <h2
      className={classNames(
        "text-lg font-semibold tracking-tight text-ink-900",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={classNames("mt-1 text-sm text-ink-500", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("px-6 py-5 sm:px-7", className)} {...props} />
  );
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        "flex flex-wrap items-center gap-3 border-t border-line px-6 py-4 sm:px-7",
        className
      )}
      {...props}
    />
  );
}
