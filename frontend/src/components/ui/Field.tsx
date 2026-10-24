import type { ReactNode } from "react";
import { classNames } from "@/utils";
import { Label } from "./Label";

export interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  hintId?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Groups a form control with its label, optional hint and error message.
 * Keep `hintId`/`errorId` in sync with the control's `aria-describedby`.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  hintId,
  errorId,
  className,
  children,
}: FieldProps) {
  return (
    <div className={classNames("w-full", className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required === false && (
            <span className="ml-2 text-xs font-normal text-ink-300">
              Optional
            </span>
          )}
        </Label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="mt-2 text-xs text-ink-400">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
