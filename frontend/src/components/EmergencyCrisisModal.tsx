import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Button, Modal } from "@/components/ui";
import { classNames } from "@/utils";

interface EmergencyHelpButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label?: string;
}

const steps = [
  {
    title: "If there is immediate danger",
    body: "Call your local emergency number now. If you can, stay on the line and follow their instructions.",
  },
  {
    title: "If you need to talk right now",
    body: "Contact a local crisis line or a trusted person who can stay with you. You do not have to manage this alone.",
  },
  {
    title: "If you are worried about someone else",
    body: "Stay with them if it is safe to do so, and help them contact emergency services or a crisis line.",
  },
];

export function EmergencyHelpButton({
  label = "Get urgent help",
  className,
  ...props
}: EmergencyHelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={classNames(
          "inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-surface px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50",
          className
        )}
        {...props}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 2.8 18 17H2L10 2.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M10 7.2v4.2M10 14.2v.1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Get urgent help"
        description="Mindora is not an emergency service. If you or someone else may be in danger, contact emergency help now."
        className="border-red-200/80"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Find a crisis line
            </a>
          </>
        }
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <p className="font-semibold">Do not wait if life is at risk.</p>
          <p className="mt-1">
            Call your local emergency number or go to the nearest emergency
            department. This page cannot contact emergency services for you.
          </p>
        </div>

        <ol className="mt-5 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}

export default EmergencyHelpButton;
