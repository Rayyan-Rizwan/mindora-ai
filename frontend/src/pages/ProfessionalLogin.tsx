import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";
import type { ProfessionalApplication } from "@/types";
import { roleHomePath } from "@/utils";

type ApplicantStatus = "pending" | "rejected" | "approved";

/**
 * Professional login entry point.
 *
 * Reuses the existing secure login API (POST /auth/login) and the existing
 * professional application/approval workflow. It never grants professional
 * privileges itself: only accounts already approved by an administrator
 * (role: professional) reach the Professional Dashboard. Applicants who are
 * still pending or rejected are shown their status and kept out of
 * professional-only features.
 */
export default function ProfessionalLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<ApplicantStatus | null>(null);
  const [statusApplication, setStatusApplication] =
    useState<ProfessionalApplication | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setStatus(null);
    setStatusApplication(null);
    setLoading(true);

    try {
      // 1. Existing secure login + email-verified/active checks.
      const response = await api.post("/auth/login", { email, password });
      const { access_token } = response.data;
      localStorage.setItem("access_token", access_token);

      // 2. Resolve the current account.
      const userResponse = await api.get("/users/me");
      const user = userResponse.data;
      setUser(user);

      // 3. Only approved professionals reach the professional dashboard.
      if (user.role === "professional" || user.role === "admin") {
        navigate(roleHomePath(user.role), { replace: true });
        return;
      }

      // 4. A regular account: check the existing professional application.
      try {
        const applicationResponse = await api.get<ProfessionalApplication>(
          "/professionals/me/application"
        );
        const application = applicationResponse.data;

        if (application.approval_status === "approved") {
          // Approved but role not yet promoted; treat as approved status.
          setStatus("approved");
          setStatusApplication(application);
        } else {
          setStatus(application.approval_status);
          setStatusApplication(application);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // No application yet: send them to the existing application form
          // to complete/submit it (same account, no new registration).
          navigate("/professional-application", { replace: true });
          return;
        }
        console.error("Could not load professional application:", err);
        setError("Could not load your professional application. Please try again.");
      }
    } catch (err: any) {
      console.error("Professional login error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Login failed. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const statusContent: Record<
    ApplicantStatus,
    { title: string; message: string; style: string }
  > = {
    pending: {
      title: "Application under review",
      message:
        "Your professional application is pending administrator approval. You'll be able to access the Professional Dashboard once it is approved.",
      style: "border-yellow-200 bg-yellow-50 text-yellow-800",
    },
    rejected: {
      title: "Application not approved",
      message:
        "Your professional application was not approved. You can update your details and resubmit it for review.",
      style: "border-red-200 bg-red-50 text-red-700",
    },
    approved: {
      title: "Application approved",
      message:
        "Your application has been approved. Please sign in again to access your Professional Dashboard.",
      style: "border-green-200 bg-green-50 text-green-700",
    },
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
          New professional?{" "}
          <Link
            to="/professional/register"
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Sign up as a Professional
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 pb-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-9">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
              ✦
            </div>

            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-ink-900">
              Professional login
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-500">
              Sign in to access your professional dashboard.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                  placeholder="Enter your password"
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
                {loading ? "Signing in..." : "Sign in"}
                {!loading && (
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </form>

            {status && statusApplication && (
              <div
                className={`mt-6 rounded-2xl border p-4 text-sm leading-6 ${statusContent[status].style}`}
              >
                <p className="font-semibold">{statusContent[status].title}</p>
                <p className="mt-1">{statusContent[status].message}</p>

                {status === "rejected" && (
                  <Link
                    to="/professional-application"
                    className="mt-3 inline-block font-semibold underline"
                  >
                    Update and resubmit application
                  </Link>
                )}
              </div>
            )}

            <div className="mt-7 rounded-2xl border border-line bg-surface-muted p-4">
              <p className="text-xs leading-5 text-ink-400">
                Looking for the patient experience?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Patient login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
