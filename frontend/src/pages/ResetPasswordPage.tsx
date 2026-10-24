import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      setError(detail || "Could not reset the password. Please try again.");
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
          Reset your password
        </h1>

        {!token ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-600">
            This reset link is missing its token. Please request a new link
            from the{" "}
            <Link
              to="/forgot-password"
              className="font-semibold underline"
            >
              forgot password
            </Link>{" "}
            page.
          </div>
        ) : done ? (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-line bg-surface-muted px-4 py-4 text-sm leading-6 text-ink-700"
          >
            Your password has been updated.{" "}
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Sign in now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-ink-700"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={MIN_PASSWORD_LENGTH}
                required
                autoComplete="new-password"
                className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-ink-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter the new password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                autoComplete="new-password"
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
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
