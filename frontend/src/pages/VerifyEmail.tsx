import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [message, setMessage] = useState("");

  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get("/auth/verify-email", {
          params: { token },
        });

        setStatus("success");
        setMessage(response.data.message);
      } catch (error: any) {
        setStatus("error");

        setMessage(
          error?.response?.data?.detail ||
            "This verification link is invalid or has expired."
        );
      }
    };

    void verifyEmail();
  }, [searchParams]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-line-strong opacity-60 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-4xl border border-line bg-white/90 p-8 text-center shadow-card backdrop-blur-xl sm:p-10">
        {status === "verifying" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <span
                className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
                aria-hidden="true"
              />
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink-900">
              Verifying your email
            </h1>

            <p className="mt-3 text-sm text-ink-500">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
              ✓
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink-900">
              Email verified
            </h1>

            <p className="mt-3 text-sm text-ink-500">{message}</p>

            <Link
              to="/login"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800"
            >
              Continue to login →
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
              !
            </div>

            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink-900">
              Verification failed
            </h1>

            <p className="mt-3 text-sm text-ink-500">{message}</p>

            <Link
              to="/login"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink-800 shadow-sm transition-colors hover:border-line-strong hover:bg-mist"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
