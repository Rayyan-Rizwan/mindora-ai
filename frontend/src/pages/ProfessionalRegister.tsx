import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";

/**
 * Professional signup entry point.
 *
 * Reuses the existing secure registration API (POST /auth/register), which
 * creates a normal (role: user) account and sends the existing email
 * verification link. It does NOT log the applicant in and does NOT grant any
 * professional privileges: the professional application is submitted later,
 * through the existing approval workflow, once the email is verified and the
 * applicant signs in.
 */
export default function ProfessionalRegister() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Same secure registration + email verification flow as patients.
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Professional registration error:", err);

      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-mist opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-blush opacity-70 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface opacity-80 blur-3xl" />
      </div>

      {/* Top navigation */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        <Link
          to="/"
          className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
        >
          ← Back to home
        </Link>

        <div className="text-sm text-ink-500">
          Already have an account?{" "}
          <Link
            to="/professional/login"
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Login as a Professional
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 pb-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-9">
            {submitted ? (
              <>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
                  ✦
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
                  Verify your email
                </h2>

                <p className="mt-3 text-sm leading-6 text-ink-500">
                  We've sent a verification link to{" "}
                  <span className="font-medium text-ink-800">{email}</span>.
                  Please open it to verify your email address (the link is valid
                  for 30 minutes).
                </p>

                <p className="mt-4 text-sm leading-6 text-ink-500">
                  After verifying, sign in through the professional login page.
                  You'll then be able to submit your professional application for
                  review. Your application stays pending until an administrator
                  approves it.
                </p>

                <Link
                  to="/professional/login"
                  className="mt-7 flex w-full items-center justify-center rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-ink-800"
                >
                  Go to professional login
                </Link>
              </>
            ) : (
              <>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
                  ✦
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
                  Sign up as a Professional
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Create your account to apply as a mental health professional.
                  Applications are reviewed by an administrator.
                </p>

                <form onSubmit={handleRegister} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium text-ink-700"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                    />
                  </div>

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

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-ink-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                      className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                    />
                    <p className="mt-2 text-xs text-ink-400">
                      Use at least 8 characters.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-ink-700"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
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
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Creating account..." : "Create professional account"}
                    {!loading && (
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-7 rounded-2xl border border-line bg-surface-muted p-4">
                  <p className="text-xs leading-5 text-ink-400">
                    Looking for the patient experience?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                    >
                      Create a patient account
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
