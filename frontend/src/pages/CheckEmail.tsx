
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
    <main className="relative min-h-screen overflow-hidden bg-[#faf9ff]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-[#e5e0ff] opacity-70 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-[#ddd7ff] opacity-60 blur-3xl" />
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
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#8878ed] transition-colors hover:text-[#6f5fdb]"
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
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e0f5] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8878ed] backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-[#8878ed]" />
                Begin your journey
              </span>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#17151f] xl:text-6xl">
                A little space
                <br />
                for{" "}
                <span className="text-[#8878ed]">
                  yourself.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-lg leading-8 text-[#716d7c]">
                Create your account and take the first step toward
                understanding your emotions, reflecting on your wellbeing,
                and building healthier habits.
              </p>

              <div className="mt-9 space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#777381]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeeaff] text-[#8878ed]">
                    ✓
                  </span>
                  Personalized wellness experience
                </div>

                <div className="flex items-center gap-3 text-sm text-[#777381]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeeaff] text-[#8878ed]">
                    ✓
                  </span>
                  AI companion available anytime
                </div>

                <div className="flex items-center gap-3 text-sm text-[#777381]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eeeaff] text-[#8878ed]">
                    ✓
                  </span>
                  Private and secure account
                </div>
              </div>
            </div>
          </div>

          {/* Register card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[32px] border border-[#e8e3f2] bg-white/90 p-7 shadow-2xl shadow-[#8b7cf6]/10 backdrop-blur-xl sm:p-9">

              {/* Heading */}
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaff] text-xl text-[#8878ed]">
                  ✦
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#17151f]">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#777381]">
                  Start your personal wellness journey with Mindora.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="mt-8 space-y-5">

                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-[#383541]"
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
                    className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
                  />
                </div>

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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#383541]"
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
                    className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
                  />

                  <p className="mt-2 text-xs text-[#aaa5b5]">
                    Use at least 8 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-[#383541]"
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
                  {loading ? "Creating account..." : "Create account"}

                  {!loading && (
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Terms */}
              <p className="mt-6 text-center text-xs leading-5 text-[#918c9d]">
                By creating an account, you agree to use Mindora responsibly
                and understand that it does not replace professional mental
                healthcare.
              </p>

              {/* Login */}
              <div className="mt-6 border-t border-[#ebe7f2] pt-6 text-center">
                <p className="text-sm text-[#777381]">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#8878ed] transition-colors hover:text-[#6f5fdb]"
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
