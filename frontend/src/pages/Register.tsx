import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      await api.post("/auth/register", {
  full_name: fullName,
  email,
  password,
});

navigate("/check-email", {
  state: {
    email,
  },
});
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-blush opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-mist opacity-60 blur-3xl" />
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
            to="/login"
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Register area */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 pb-16">
        <div className="grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2">

          {/* Left content */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Begin your journey
              </span>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-ink-900 xl:text-6xl">
                A little space
                <br />
                for{" "}
                <span className="text-brand-600">
                  yourself.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-8 text-ink-500">
                Create your account and take the first step toward
                understanding your emotions, reflecting on your wellbeing,
                and building healthier habits.
              </p>

              <div className="mt-9 space-y-4">
                <div className="flex items-center gap-3 text-sm text-ink-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mist text-brand-600">
                    ✓
                  </span>
                  Personalized wellness experience
                </div>

                <div className="flex items-center gap-3 text-sm text-ink-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mist text-brand-600">
                    ✓
                  </span>
                  AI companion available anytime
                </div>

                <div className="flex items-center gap-3 text-sm text-ink-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mist text-brand-600">
                    ✓
                  </span>
                  Private and secure account
                </div>
              </div>
            </div>
          </div>

          {/* Register card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-9">

              {/* Heading */}
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
                  ✦
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Start your personal wellness journey with Mindora.
                </p>
              </div>

              {/* Professional entry point */}
              <div className="mt-6 rounded-2xl border border-line bg-surface-muted p-4">
                <p className="text-sm leading-6 text-ink-500">
                  Are you a mental health professional?{" "}
                  <Link
                    to="/professional/register"
                    className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                  >
                    Sign up as a Professional
                  </Link>
                  .
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="mt-8 space-y-5">

                {/* Full name */}
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

                {/* Email */}
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

                {/* Password */}
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

                {/* Confirm password */}
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

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}

                  {!loading && (
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Terms */}
              <p className="mt-6 text-center text-xs leading-5 text-ink-400">
                By creating an account, you agree to use Mindora responsibly
                and understand that it does not replace professional mental
                healthcare.
              </p>

              {/* Login */}
              <div className="mt-6 border-t border-line pt-6 text-center">
                <p className="text-sm text-ink-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}