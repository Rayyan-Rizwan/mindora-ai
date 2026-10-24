import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setError(detail || "Could not submit the request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-9">
        <Link
          to="/login"
          className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
        >
          ← Back to sign in
        </Link>

        <div className="mb-6 mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
          ✦
        </div>

        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
          Forgot your password?
        </h1>

        <p className="mt-2 text-sm leading-6 text-ink-500">
          Enter the email address on your account and we'll send you a link to
          reset your password. The link is valid for one hour and can only be
          used once.
        </p>

        {submitted ? (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-line bg-surface-muted px-4 py-4 text-sm leading-6 text-ink-700"
          >
            If an account exists for that email, a password reset link has
            been sent. Check your inbox and spam folder.{" "}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-ink-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
