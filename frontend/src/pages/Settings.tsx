import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";
import { Alert, Card, PageHeader } from "@/components/ui";

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthContext();

  const [fullName, setFullName] = useState(user?.full_name || "");
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
        setTimezone(profile.profile?.timezone || "Asia/Karachi");
      } catch (error) {
        console.error("Could not load profile:", error);

        setError("Unable to load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [setUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await api.put("/users/me", {
        full_name: fullName,
        // Send the raw (trimmed) string rather than `phone || null` so the
        // backend can distinguish "cleared the field" ("") from "unchanged"
        // (null). Clearing the input now actually removes the phone number.
        phone: phone.trim(),
        timezone,
      });

      setUser(response.data);

      setMessage("Your profile has been updated successfully.");
    } catch (error: any) {
      console.error("Profile update error:", error);

      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError("Unable to update your profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-ink-900 shadow-sm outline-none transition-all placeholder:text-ink-300 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account and personal information."
      />

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-500" />
          Loading your settings...
        </div>
      ) : (
        <>
          {/* Profile */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink-900">
              Profile information
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-500">
              You can update these details whenever you want. Completing your
              profile here will not send you through the onboarding process
              again.
            </p>

            <form onSubmit={handleSave} className="mt-6 space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-ink-600"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-line bg-mist px-4 py-3.5 text-sm text-ink-400 outline-none"
                />

                <p className="mt-2 text-xs text-ink-400">
                  Your email address cannot be changed here.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-ink-600"
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
                  className={fieldClass}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-ink-600"
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
                  className={fieldClass}
                />
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="mb-2 block text-sm font-medium text-ink-600"
                >
                  Timezone
                </label>

                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={`${fieldClass} appearance-none`}
                >
                  <option value="Asia/Karachi">
                    Pakistan — Karachi (PKT)
                  </option>
                  <option value="Asia/Dubai">
                    United Arab Emirates — Dubai (GST)
                  </option>
                  <option value="Asia/Riyadh">Saudi Arabia — Riyadh</option>
                  <option value="Europe/London">United Kingdom — London</option>
                  <option value="America/New_York">
                    United States — New York
                  </option>
                  <option value="America/Los_Angeles">
                    United States — Los Angeles
                  </option>
                </select>
              </div>

              {message && <Alert tone="success">{message}</Alert>}
              {error && <Alert tone="danger">{error}</Alert>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-ink-900 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </form>
          </Card>

          {/* Assessment — patient-facing only; shown exclusively to the
              user/patient role. Professionals and admins have no wellness
              assessment of their own, so the section is hidden for them. */}
          {user?.role === "user" && (
            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink-900">
                Wellness assessment
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink-500">
                Your initial wellness assessment is kept as part of your wellness
                journey. You can choose to take another assessment later.
              </p>

              <button
                type="button"
                onClick={() => navigate("/assessment")}
                className="mt-5 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink-700 transition-all hover:border-brand-300 hover:bg-mist"
              >
                View assessment
              </button>
            </Card>
          )}

          {/* Account */}
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink-900">Account</h2>

            <p className="mt-2 text-sm leading-6 text-ink-500">
              Sign out of your Mindora account on this device.
            </p>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="mt-5 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100"
            >
              Log out
            </button>
          </Card>
        </>
      )}
    </div>
  );
}
