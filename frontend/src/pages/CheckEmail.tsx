import { Link, useLocation } from "react-router-dom";

interface CheckEmailState {
  email?: string;
}

/**
 * Post-registration confirmation screen.
 *
 * Account creation is handled server-side and requires email verification, so
 * this page only reminds the user to open the link we emailed them. It reads
 * the address passed through navigation state (when available) purely for
 * display -- no data is fetched or stored here.
 */
export default function CheckEmail() {
  const location = useLocation();
  const email = (location.state as CheckEmailState | null)?.email;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-brand-200 opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-line-strong opacity-60 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-4xl border border-line bg-white/90 p-8 text-center shadow-card backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-2xl text-brand-600">
            ✉
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
            Check your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink-500">
            {email ? (
              <>
                We've sent a verification link to{" "}
                <span className="font-semibold text-ink-800">{email}</span>.
              </>
            ) : (
              "We've sent you a verification link."
            )}{" "}
            Open it to verify your account, then continue to log in.
          </p>

          <Link
            to="/login"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800"
          >
            Continue to login →
          </Link>

          <p className="mt-6 text-xs leading-5 text-ink-400">
            Didn't receive the email? Check your spam folder. Verification links
            may take a few minutes to arrive.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
