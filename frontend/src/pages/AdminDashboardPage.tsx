import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { AdminAnalyticsSummary } from "@/types";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  PageHeader,
  Spinner,
  StatTile,
} from "@/components/ui";

const adminLinks = [
  {
    to: "/admin/applications",
    label: "Professional Applications",
    description: "Review and approve new professionals.",
    icon: "📝",
  },
  {
    to: "/admin/appointments",
    label: "Appointments",
    description: "Manage sessions and meeting links.",
    icon: "🗓",
  },
  {
    to: "/admin/users",
    label: "Users",
    description: "Activate, deactivate and verify accounts.",
    icon: "👥",
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    description: "Aggregate platform counts.",
    icon: "📊",
  },
  {
    to: "/admin/reports",
    label: "Operational Reports",
    description: "Activity over a chosen window.",
    icon: "📈",
  },
  {
    to: "/admin/knowledge-base",
    label: "Knowledge Base",
    description: "Documents that power the assistant.",
    icon: "📚",
  },
  {
    to: "/admin/content",
    label: "Motivational Messages",
    description: "Daily notification content.",
    icon: "💬",
  },
];

export default function AdminDashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<AdminAnalyticsSummary>(
        "/admin/analytics/summary"
      );
      setSummary(response.data);
    } catch (err) {
      console.error("Could not load admin summary:", err);
      setError("Could not load the dashboard summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    void loadSummary();
  }, [authLoading, isAuthenticated, loadSummary]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Platform overview and management shortcuts."
      />

      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-start gap-4 rounded-4xl border border-line bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg">
              {item.icon}
            </span>

            <span className="min-w-0">
              <span className="block font-semibold text-ink-900 group-hover:text-brand-700">
                {item.label}
              </span>
              <span className="mt-0.5 block text-sm text-ink-500">
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </nav>

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading summary...
        </div>
      ) : summary ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Platform summary</CardTitle>
              <CardDescription>
                Aggregate counts across the platform.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile
                title="Total Users"
                value={summary.users.total}
                detail={`${summary.users.active} active · ${summary.users.inactive} inactive`}
              />
              <StatTile
                title="Professionals"
                value={summary.professionals.total}
                detail={`${summary.professionals.active} active · ${summary.professionals.verified} verified`}
              />
              <StatTile
                title="Appointments"
                value={summary.appointments.total}
                detail={`${
                  summary.appointments.by_status["pending"] ?? 0
                } pending · ${
                  summary.appointments.by_status["confirmed"] ?? 0
                } confirmed`}
              />
              <StatTile
                title="Assessments"
                value={summary.assessments.total}
                detail={`${summary.assessments.completed} completed`}
              />
              <StatTile
                title="Mood Check-ins"
                value={summary.mood_records.total}
                detail="All-time records"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
