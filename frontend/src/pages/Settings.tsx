
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthContext();

  const [fullName, setFullName] = useState(
    user?.full_name || ""
  );
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/users/me");

        const profile = response.data;

        setUser(profile);
        setFullName(profile.full_name || "");

        setPhone(profile.profile?.phone || "");
        setTimezone(
          profile.profile?.timezone || "Asia/Karachi"
        );
      } catch (error) {
        console.error(
          "Could not load profile:",
          error
        );

        setError(
          "Unable to load your profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [setUser]);

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await api.put("/users/me", {
        full_name: fullName,
        phone: phone || null,
        timezone,
      });

      setUser(response.data);

      setMessage(
        "Your profile has been updated successfully."
      );
    } catch (error: any) {
      console.error(
        "Profile update error:",
        error
      );

      if (error.response?.data?.detail) {
        setError(
          error.response.data.detail
        );
      } else {
        setError(
          "Unable to update your profile. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e5e0ed] border-t-[#8878ed]" />

          <p className="mt-4 text-sm text-[#777381]">
            Loading your settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#faf9ff]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[500px] w-[500px] rounded-full bg-[#e5e0ff] opacity-70 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#ddd7ff] opacity-60 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-80 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="text-sm font-semibold text-[#383541] transition-colors hover:text-[#17151f]"
        >
          ← Mindora
        </button>

        <span className="text-sm text-[#918c9d]">
          Settings
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaff] text-xl text-[#8878ed]">
            ⚙
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#17151f] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#777381] sm:text-base">
            Manage your account and personal information.
          </p>
        </div>

        {/* Profile Card */}
        <section className="rounded-[32px] border border-[#e8e3f2] bg-white/90 p-7 shadow-2xl shadow-[#8b7cf6]/10 backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#17151f]">
              Profile information
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#777381]">
              You can update these details whenever you want.
              Completing your profile here will not send you
              through the onboarding process again.
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-6"
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
                value={user?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-[#e5e0ed] bg-[#f3f1f7] px-4 py-3.5 text-sm text-[#918c9d] outline-none"
              />

              <p className="mt-2 text-xs text-[#aaa5b5]">
                Your email address cannot be changed here.
              </p>
            </div>

            {/* Full Name */}
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
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter your full name"
                required
                className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-[#383541]"
              >
                Phone number

                <span className="ml-2 text-xs font-normal text-[#aaa5b5]">
                  Optional
                </span>
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+92 300 1234567"
                className="w-full rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all placeholder:text-[#aaa5b5] focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
              />
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="mb-2 block text-sm font-medium text-[#383541]"
              >
                Timezone
              </label>

              <select
                id="timezone"
                value={timezone}
                onChange={(e) =>
                  setTimezone(e.target.value)
                }
                className="w-full appearance-none rounded-2xl border border-[#e5e0ed] bg-[#faf9ff] px-4 py-3.5 text-sm text-[#25222e] outline-none transition-all focus:border-[#b7acf5] focus:bg-white focus:ring-4 focus:ring-[#8878ed]/10"
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

            {/* Success */}
            {message && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                {message}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                {error}
              </div>
            )}

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#17151f] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#292631] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving changes..."
                : "Save changes"}
            </button>
          </form>
        </section>

        {/* Assessment */}
        <section className="mt-6 rounded-[32px] border border-[#e8e3f2] bg-white/90 p-7 shadow-xl shadow-[#8b7cf6]/5 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-[#17151f]">
            Wellness assessment
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#777381]">
            Your initial wellness assessment is kept as part
            of your wellness journey. You can choose to take
            another assessment later.
          </p>

          <button
            type="button"
            onClick={() => navigate("/assessment")}
            className="mt-5 rounded-full border border-[#ddd7ee] bg-white px-5 py-3 text-sm font-semibold text-[#383541] transition-all hover:border-[#b7acf5] hover:bg-[#faf9ff]"
          >
            View assessment
          </button>
        </section>

        {/* Account */}
        <section className="mt-6 rounded-[32px] border border-[#e8e3f2] bg-white/90 p-7 shadow-xl shadow-[#8b7cf6]/5 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-[#17151f]">
            Account
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#777381]">
            Sign out of your Mindora account on this device.
          </p>

          <button
            type="button"
            onClick={logout}
            className="mt-5 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
          >
            Log out
          </button>
        </section>
      </div>
    </main>
  );
}
