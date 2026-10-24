import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/ui";

interface TodayMood {
  mood_score: number;
  note: string | null;
  mood_date?: string;
}

interface MoodSummaryStats {
  statistics: {
    average_mood: number | null;
  };
  trends: {
    current_7_day_average: number | null;
    current_streak: number;
  };
}

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  professional_name: string | null;
  specialization: string | null;
}

interface NotificationItem {
  id: string;
  is_read: boolean;
}

interface AssessmentStatus {
  completed: boolean;
}

const formatDateTime = (value: string) =>
  new Date(`${value}Z`).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const moodLabel = (score: number) => {
  if (score <= 2) return "Very low";
  if (score <= 4) return "Low";
  if (score <= 6) return "Okay";
  if (score <= 8) return "Good";
  return "Great";
};

interface QuickLink {
  to: string;
  title: string;
  description: string;
  icon: string;
}

const quickLinks: QuickLink[] = [
  {
    to: "/chat",
    title: "AI Companion",
    description: "Talk things through and revisit your chat history.",
    icon: "💬",
  },
  {
    to: "/assessment",
    title: "Assessments",
    description: "Reflect on your wellbeing with a screening assessment.",
    icon: "📋",
  },
  {
    to: "/mood",
    title: "Mood Tracking",
    description: "Log today's mood and follow your trends over time.",
    icon: "📈",
  },
  {
    to: "/appointments",
    title: "Appointments",
    description: "Manage your consultations with professionals.",
    icon: "🗓",
  },
  {
    to: "/professionals",
    title: "Professionals",
    description: "Find and book a qualified professional.",
    icon: "🩺",
  },
  {
    to: "/settings",
    title: "Profile & Settings",
    description: "Update your name, phone number, and timezone.",
    icon: "⚙",
  },
];

export default function Dashboard() {
  const [todayMood, setTodayMood] = useState<TodayMood | null>(null);
  const [moodTrend, setMoodTrend] = useState<MoodSummaryStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [assessment, setAssessment] = useState<AssessmentStatus | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const [
      todayResult,
      summaryResult,
      appointmentsResult,
      assessmentResult,
      notificationsResult,
    ] = await Promise.allSettled([
      api.get<TodayMood | null>("/mood/today"),
      api.get<MoodSummaryStats>("/mood/summary"),
      api.get<Appointment[]>("/appointments/me"),
      api.get<AssessmentStatus>("/assessment/status"),
      api.get<NotificationItem[]>("/notifications"),
    ]);

    if (todayResult.status === "fulfilled") {
      setTodayMood(todayResult.value.data || null);
    }

    if (summaryResult.status === "fulfilled") {
      setMoodTrend(summaryResult.value.data);
    }

    if (appointmentsResult.status === "fulfilled") {
      setAppointments(appointmentsResult.value.data);
    }

    if (assessmentResult.status === "fulfilled") {
      setAssessment(assessmentResult.value.data);
    }

    if (notificationsResult.status === "fulfilled") {
      setUnreadCount(
        notificationsResult.value.data.filter((item) => !item.is_read).length
      );
    }

    // Only surface a page-level error when nothing at all could be loaded,
    // so one failing endpoint never hides the rest of the dashboard.
    const allFailed = [
      todayResult,
      summaryResult,
      appointmentsResult,
      assessmentResult,
      notificationsResult,
    ].every((result) => result.status === "rejected");

    if (allFailed) {
      setError(
        "We could not load your dashboard right now. Please check your connection and try again."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const now = new Date();

  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status !== "cancelled" &&
        appointment.status !== "completed" &&
        new Date(`${appointment.scheduled_at}Z`) >= now
    )
    .sort(
      (a, b) =>
        new Date(`${a.scheduled_at}Z`).getTime() -
        new Date(`${b.scheduled_at}Z`).getTime()
    );

  const nextAppointment = upcomingAppointments[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Home
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink-900">
          Your wellness overview
        </h1>

        <p className="mt-2 text-sm leading-6 text-ink-500">
          A quick look at your check-ins, appointments, and results -- plus
          shortcuts to everything in Mindora.
        </p>
      </div>

      {error && (
        <Alert tone="danger">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadDashboard()}
              loading={loading}
            >
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to} className="group">
            <Card className="h-full p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-card">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-xl text-brand-600"
                aria-hidden
              >
                {link.icon}
              </span>

              <h2 className="mt-4 text-base font-semibold text-ink-900">
                {link.title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-ink-500">
                {link.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Status cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's check-in */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s check-in</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading...
              </div>
            ) : todayMood ? (
              <div>
                <p className="text-3xl font-semibold tracking-tight text-ink-900">
                  {todayMood.mood_score}
                  <span className="text-lg text-ink-400">/10</span>
                  <span className="ml-2 text-sm font-medium text-brand-600">
                    {moodLabel(todayMood.mood_score)}
                  </span>
                </p>

                {todayMood.note && (
                  <p className="mt-2 text-sm text-ink-500">
                    {todayMood.note}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-ink-500">
                  You have not checked in today.
                </p>
                <Link
                  to="/mood"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Log your mood →
                </Link>
              </div>
            )}

            {moodTrend && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="info">
                  7-day average:{" "}
                  {moodTrend.trends.current_7_day_average ?? "—"}
                </Badge>
                <Badge tone="neutral">
                  Streak: {moodTrend.trends.current_streak}{" "}
                  {moodTrend.trends.current_streak === 1 ? "day" : "days"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next appointment */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming appointment</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading...
              </div>
            ) : nextAppointment ? (
              <div>
                <p className="text-base font-semibold text-ink-900">
                  {nextAppointment.professional_name || "Professional"}
                </p>

                {nextAppointment.specialization && (
                  <p className="mt-0.5 text-sm font-medium text-brand-600">
                    {nextAppointment.specialization}
                  </p>
                )}

                <p className="mt-2 text-sm text-ink-500">
                  {formatDateTime(nextAppointment.scheduled_at)}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <Badge tone="neutral">{nextAppointment.status}</Badge>
                  <Link
                    to="/appointments"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View appointments →
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-ink-500">
                  You have no upcoming appointments.
                </p>
                <Link
                  to="/professionals"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Find a professional →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment status */}
        <Card>
          <CardHeader>
            <CardTitle>Wellness assessment</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading...
              </div>
            ) : assessment?.completed ? (
              <div>
                <Badge tone="success">Completed</Badge>
                <p className="mt-3 text-sm text-ink-500">
                  You have completed your initial wellness assessment.
                </p>
                <Link
                  to="/assessment"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Take another →
                </Link>
              </div>
            ) : (
              <div>
                <Badge tone="warning">Not completed</Badge>
                <p className="mt-3 text-sm text-ink-500">
                  Complete your initial assessment to personalize your
                  experience.
                </p>
                <Link
                  to="/assessment"
                  className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Start assessment →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading...
              </div>
            ) : unreadCount === null ? (
              <p className="text-sm text-ink-500">
                Notification count is unavailable right now.
              </p>
            ) : unreadCount === 0 ? (
              <p className="text-sm text-ink-500">
                You&apos;re all caught up.
              </p>
            ) : (
              <div>
                <p className="text-3xl font-semibold tracking-tight text-ink-900">
                  {unreadCount}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  unread {unreadCount === 1 ? "notification" : "notifications"}
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-ink-400">
              Open the bell icon in the top bar to view your notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
