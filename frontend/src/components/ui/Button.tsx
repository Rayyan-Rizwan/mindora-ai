import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "subtle";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-900 text-white shadow-soft hover:-translate-y-0.5 hover:bg-ink-800 disabled:hover:translate-y-0",
  secondary:
    "border border-line bg-surface text-ink-800 shadow-sm hover:border-line-strong hover:bg-mist disabled:hover:bg-surface",
  ghost: "text-ink-600 hover:bg-mist hover:text-ink-900",
  danger:
    "border border-red-200 bg-surface text-red-600 hover:bg-red-50 disabled:hover:bg-surface",
  subtle: "bg-brand-100 text-brand-700 hover:bg-brand-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={classNames(
          base,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
