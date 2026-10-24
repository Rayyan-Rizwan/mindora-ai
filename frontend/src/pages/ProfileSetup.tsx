
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  /*
   * Check whether onboarding has already been completed.
   *
   * If profile already exists:
   *   - assessment incomplete -> go to assessment
   *   - assessment complete   -> go to chat
   *
   * This prevents Profile Setup from appearing again.
   */
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const profileResponse = await api.get(
          "/users/me/setup-status"
        );

        const profileCompleted =
          profileResponse.data.profile_completed;

        if (!profileCompleted) {
          setCheckingStatus(false);
          return;
        }

        // Profile already completed.
        // Now check assessment status.
        const assessmentResponse = await api.get(
          "/assessment/status"
        );

        const assessmentCompleted =
          assessmentResponse.data.completed;

        if (!assessmentCompleted) {
          navigate("/assessment", { replace: true });
          return;
        }

        // Both profile and assessment are completed.
        navigate("/chat", { replace: true });
      } catch (error) {
        console.error(
          "Could not check onboarding status:",
          error
        );

        setCheckingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  /*
   * Prefill the form from the values the server actually stored, so a user
   * who already has a profile row never sees their saved phone/timezone
   * replaced by the defaults in this form.
   */
  useEffect(() => {
    let cancelled = false;

    const loadExistingProfile = async () => {
      try {
        const response = await api.get("/users/me");

        if (cancelled) return;

        const account = response.data;

        if (account.full_name) {
          setFullName(account.full_name);
        }

        if (account.profile?.phone) {
          setPhone(account.profile.phone);
        }

        if (account.profile?.timezone) {
          setTimezone(account.profile.timezone);
        }
      } catch (error) {
        console.error("Could not prefill profile:", error);
      }
    };

    void loadExistingProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.put("/users/me", {
        full_name: fullName,
        // Empty string means "clear/unset"; a value is stored trimmed. The
        // backend treats null as "leave unchanged", so we never send null.
        phone: phone.trim(),
        timezone,
      });

      setUser(response.data);

      // Profile is now completed.
      // Check assessment before navigating.
      const assessmentResponse = await api.get(
        "/assessment/status"
      );

      const assessmentCompleted =
        assessmentResponse.data.completed;

      if (assessmentCompleted) {
        navigate("/chat", { replace: true });
      } else {
        navigate("/assessment", { replace: true });
      }
    } catch (error: any) {
      console.error("Profile setup error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError(
          "Unable to save your profile. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * Skip still creates the profile record.
   *
   * This is important because otherwise the backend would
   * think that profile setup was never completed.
   */
  const handleSkip = async () => {
    setError("");
    setLoading(true);

    try {
      // Send an empty body: this still creates the profile row (so the
      // backend marks setup as completed) but never overwrites a saved
      // timezone or any other stored profile value with a default.
      const response = await api.put("/users/me", {});

      setUser(response.data);

      // Profile now exists.
      // Check whether assessment is already completed.
      const assessmentResponse = await api.get(
        "/assessment/status"
      );

      const assessmentCompleted =
        assessmentResponse.data.completed;

      if (assessmentCompleted) {
        navigate("/chat", { replace: true });
      } else {
        navigate("/assessment", { replace: true });
      }
    } catch (error: any) {
      console.error("Profile skip error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError(
          "Unable to continue. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * Don't show the Profile Setup UI while checking
   * whether this user has already completed onboarding.
   */
  if (checkingStatus) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500" />

          <p className="mt-4 text-sm text-ink-500">
            Checking your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-blush opacity-70 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-mist opacity-60 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface opacity-80 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
        >
          ← Mindora
        </button>

        <span className="text-sm text-ink-400">
          Step 1 of 2
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 pb-16">
        <div className="w-full max-w-2xl">

          {/* Progress */}
          <div className="mb-8">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/2 rounded-full bg-brand-500" />
            </div>
          </div>

          {/* Card */}
          <div className="rounded-[32px] border border-line bg-surface/95 p-7 shadow-2xl shadow-brand-500/10 backdrop-blur-xl sm:p-10">

            {/* Header */}
            <div className="max-w-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-xl text-brand-600">
                ✦
              </div>

              <h1 className="mt-7 text-3xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-4xl">
                Let's get to know you.
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-500 sm:text-base">
                A few details will help us personalize your Mindora
                experience. You can change these later from your profile.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleContinue}
              className="mt-9 space-y-6"
            >
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

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-ink-700"
                >
                  Phone number

                  <span className="ml-2 text-xs font-normal text-ink-400">
                    Optional
                  </span>
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                />
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="mb-2 block text-sm font-medium text-ink-700"
                >
                  Timezone
                </label>

                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-line bg-surface-muted px-4 py-3.5 text-sm text-ink-800 outline-none transition-all focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                >
                  <option value="Asia/Karachi">
                    Pakistan — Karachi (PKT)
                  </option>

                  <option value="Asia/Dubai">
                    United Arab Emirates — Dubai (GST)
                  </option>

                  <option value="Asia/Riyadh">
                    Saudi Arabia — Riyadh
                  </option>

                  <option value="Europe/London">
                    United Kingdom — London
                  </option>

                  <option value="America/New_York">
                    United States — New York
                  </option>

                  <option value="America/Los_Angeles">
                    United States — Los Angeles
                  </option>
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                  {error}
                </div>
              )}

              {/* Continue */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Saving..." : "Continue"}

                {!loading && (
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>

              {/* Skip */}
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="w-full text-sm font-medium text-ink-400 transition-colors hover:text-ink-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Skip for now
              </button>
            </form>

            {/* Privacy note */}
            <div className="mt-8 rounded-2xl bg-surface-muted p-4">
              <p className="text-center text-xs leading-5 text-ink-400">
                Your information is associated with your account and is used
                to personalize your experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
