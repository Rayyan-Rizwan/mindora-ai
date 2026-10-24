import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { classNames } from "@/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Accessible, portal-rendered dialog. Closes on Escape and backdrop click,
 * locks body scroll while open, and moves focus into the panel.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={classNames(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-4xl border border-line bg-surface p-6 shadow-lift outline-none animate-scale-in sm:max-w-lg sm:rounded-4xl sm:p-7",
          className
        )}
      >
        {(title || description) && (
          <div className="pr-8">
            {title && (
              <h2
                id={titleId}
                className="text-lg font-semibold tracking-tight text-ink-900"
              >
                {title}
              </h2>
            )}

            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-500">
                {description}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-5 top-5 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-mist hover:text-ink-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mt-5">{children}</div>

        {footer && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
