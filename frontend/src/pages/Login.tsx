
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
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
    <main className="relative min-h-screen overflow-hidden bg-[#faf9ff]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-32 h-[500px] w-[500px] rounded-full bg-[#ddd7ff] opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-[#e9e5ff] opacity-70 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl" />
      </div>

      {/* Top navigation */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        <Link
          to="/"
          className="text-sm font-semibold text-[#383541] transition-colors hover:text-[#17151f]"
        >
          ← Back to home
        </Link>

        <div className="text-sm text-[#777381]">
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-[#8878ed] transition-colors hover:text-[#6f5fdb]"
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
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e0f5] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8878ed] backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#8878ed]" />
                Welcome back
              </span>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#17151f] xl:text-6xl">
                A calmer mind
                <br />
                starts with{" "}
                <span className="text-[#8878ed]">
                  a conversation.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-8 text-[#716d7c]">
                Continue your wellness journey, reconnect with your AI
                companion, and keep building a better understanding of
                yourself.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <div className="rounded-full border border-[#e5e0f5] bg-white/70 px-4 py-2 text-sm text-[#777381] backdrop-blur-sm">
                  ✓ Private & secure
                </div>

                <div className="rounded-full border border-[#e5e0f5] bg-white/70 px-4 py-2 text-sm text-[#777381] backdrop-blur-sm">
                  ✓ Available anytime
                </div>
              </div>
            </div>

            {/* Decorative visual */}
            <div className="relative mt-12 h-24">
              <div className="absolute left-0 top-0 h-16 w-16 rounded-full bg-[#8878ed]/10" />
              <div className="absolute left-10 top-5 h-10 w-10 rounded-full bg-[#bdb2ff]/30" />
              <div className="absolute left-20 top-2 h-20 w-20 rounded-[45%] bg-[#eeeaff]" />
            </div>
          </div>

          {/* Login card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-[#e8e3f2] bg-white/90 p-7 shadow-2xl shadow-[#8b7cf6]/10 backdrop-blur-xl sm:p-9">

              {/* Card heading */}
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaff] text-xl text-[#8878ed]">
                  ✦
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17151f]">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#777381]">
                  Sign in to continue your wellness journey.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleLogin}
                className="mt-8 space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#383541]"
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
                    className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[#383541]"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-medium text-[#8878ed] transition-colors hover:text-[#6f5fdb]"
                    >
                      Forgot password?
                    </button>
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
                    className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
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
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#17151f] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#292631] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="h-px flex-1 bg-[#ebe7f2]" />
                <span className="text-xs text-[#aaa5b5]">
                  OR
                </span>
                <div className="h-px flex-1 bg-[#ebe7f2]" />
              </div>

              {/* Register */}
              <p className="text-center text-sm text-[#777381]">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#8878ed] transition-colors hover:text-[#6f5fdb]"
                >
                  Create one
                </Link>
              </p>

              {/* Safety note */}
              <div className="mt-7 rounded-2xl bg-[#faf9ff] p-4">
                <p className="text-center text-xs leading-5 text-[#918c9d]">
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
