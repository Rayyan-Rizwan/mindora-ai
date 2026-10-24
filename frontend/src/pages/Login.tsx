
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";
import { roleHomePath } from "@/utils";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const { setUser } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // 1. Login
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token } = response.data;

      // 2. Save JWT
      localStorage.setItem("access_token", access_token);

      // 3. Get current user
      const userResponse = await api.get("/users/me");

      setUser(userResponse.data);

      const role = userResponse.data?.role;

      // Staff accounts (admin, professional) go straight to their portal.
      // Their profile/assessment onboarding is for patients only.
      if (role === "admin" || role === "professional") {
        navigate(roleHomePath(role), { replace: true });
        return;
      }

      // 4. Check profile setup status
      const profileStatusResponse = await api.get(
        "/users/me/setup-status"
      );

      const profileCompleted =
        profileStatusResponse.data.profile_completed;

      // Profile is not completed yet
      if (!profileCompleted) {
        navigate("/profile-setup", {
          replace: true,
        });
        return;
      }

      // 5. Profile is already completed.
      // Now check assessment status.
      const assessmentStatusResponse = await api.get(
        "/assessment/status"
      );

      const assessmentCompleted =
        assessmentStatusResponse.data.completed;

      // Assessment is not completed yet
      if (!assessmentCompleted) {
        navigate("/assessment", {
          replace: true,
        });
        return;
      }

      // 6. Returning user:
      // Profile + Assessment are both completed.
      navigate("/chat", {
        replace: true,
      });
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError(
          "Login failed. Please check your email and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-blush opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-mist opacity-80 blur-3xl" />
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
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Create account
          </Link>
        </div>
      </div>

      {/* Login area */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 pb-16">
        <div className="grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2">

          {/* Left content */}
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Welcome back
              </span>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-ink-900 xl:text-6xl">
                A calmer mind
                <br />
                starts with{" "}
                <span className="text-brand-600">
                  a conversation.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-8 text-ink-500">
                Continue your wellness journey, reconnect with your AI
                companion, and keep building a better understanding of
                yourself.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <div className="rounded-full border border-line bg-surface/80 px-4 py-2 text-sm text-ink-500 backdrop-blur-sm">
                  ✓ Private &amp; secure
                </div>

                <div className="rounded-full border border-line bg-surface/80 px-4 py-2 text-sm text-ink-500 backdrop-blur-sm">
                  ✓ Available anytime
                </div>
              </div>
            </div>

            {/* Decorative visual */}
            <div className="relative mt-12 h-24">
              <div className="absolute left-0 top-0 h-16 w-16 rounded-full bg-brand-500/10" />
              <div className="absolute left-10 top-5 h-10 w-10 rounded-full bg-brand-400/30" />
              <div className="absolute left-20 top-2 h-20 w-20 rounded-[45%] bg-mist" />
            </div>
          </div>

          {/* Login card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-9">

              {/* Card heading */}
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Sign in to continue your wellness journey.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {sessionExpired && (
                  <div
                    role="status"
                    className="rounded-2xl border border-brand-200 bg-surface-muted px-4 py-3 text-sm leading-5 text-ink-700"
                  >
                    Your session has expired. Please sign in again.
                  </div>
                )}

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
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-ink-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
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
                  {loading
                    ? "Signing in..."
                    : "Sign in"}

                  {!loading && (
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs text-ink-400">
                  OR
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>

              {/* Register */}
              <p className="text-center text-sm text-ink-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Create one
                </Link>
              </p>

              {/* Professional entry points */}
              <div className="mt-7 rounded-2xl border border-line bg-surface-muted p-4">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  For professionals
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/professional/login"
                    className="flex items-center justify-center rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-mist"
                  >
                    Login as a Professional
                  </Link>

                  <Link
                    to="/professional/register"
                    className="flex items-center justify-center rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Sign Up as a Professional
                  </Link>
                </div>
              </div>

              {/* Safety note */}
              <div className="mt-7 rounded-2xl bg-surface-muted p-4">
                <p className="text-center text-xs leading-5 text-ink-400">
                  Your account and personal conversations are protected.
                  Mindora provides supportive AI guidance and does not replace
                  professional mental healthcare.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
