import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { AdminReportSummary } from "@/types";
import {
  Alert,
  BreakdownCard,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  StatTile,
  Tabs,
} from "@/components/ui";

const PERIODS = [7, 30, 90];

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

interface DailyRow {
  date: string;
  signups: number;
  appointments: number;
  checkins: number;
}

function buildDailyRows(report: AdminReportSummary | null): DailyRow[] {
  if (!report) return [];

  const merged: Record<
    string,
    { signups: number; appointments: number; checkins: number }
  > = {};

  const accumulate = (
    points: { date: string; count: number }[],
    field: "signups" | "appointments" | "checkins"
  ) => {
    for (const point of points) {
      const row = (merged[point.date] ??= {
        signups: 0,
        appointments: 0,
        checkins: 0,
      });
      row[field] += point.count;
    }
  };

  accumulate(report.user_signups.daily, "signups");
  accumulate(report.appointments.daily, "appointments");
  accumulate(report.mood_checkins.daily, "checkins");

  return Object.entries(merged)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}

export default function AdminReportsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [days, setDays] = useState(30);
  const [report, setReport] = useState<AdminReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<AdminReportSummary>(
        `/admin/reports/summary?days=${days}`
      );
      setReport(response.data);
    } catch (err) {
      console.error("Could not load reports:", err);
      setError("Could not load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    void loadReport();
  }, [authLoading, isAuthenticated, loadReport]);

  const dailyRows = buildDailyRows(report);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Operational Reports"
        description="Aggregate activity for a selected window. No private or clinical data is shown."
        actions={
          <Tabs
            ariaLabel="Report period"
            value={String(days)}
            onChange={(value) => setDays(Number(value))}
            items={PERIODS.map((period) => ({
              value: String(period),
              label: `${period} days`,
            }))}
          />
        }
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading report...
        </div>
      ) : report ? (
        <div className="space-y-8">
          <p className="text-sm text-ink-500">
            Window: {report.period.start} to {report.period.end} (
            {report.period.days} days)
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              title="User Sign-ups"
              value={report.user_signups.total}
              detail="Accounts created in window"
            />
            <StatTile
              title="Appointments Booked"
              value={report.appointments.booked}
              detail={`${
                report.appointments.by_status["completed"] ?? 0
              } completed · ${
                report.appointments.by_status["cancelled"] ?? 0
              } cancelled`}
            />
            <StatTile
              title="Assessments Started"
              value={report.assessments.started}
              detail={`${report.assessments.completed} completed · ${percent(
                report.assessments.completion_rate
              )} completion`}
            />
            <StatTile
              title="Mood Check-ins"
              value={report.mood_checkins.total}
              detail="Check-ins recorded in window"
            />
            <StatTile
              title="Notifications Sent"
              value={report.notifications.sent}
              detail={`${report.notifications.unread} unread · ${percent(
                report.notifications.read_rate
              )} read`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownCard
              title="Appointments by Status"
              rows={Object.entries(report.appointments.by_status).map(
                ([label, value]) => ({ label: capitalize(label), value })
              )}
            />
            <BreakdownCard
              title="Appointments by Type"
              rows={Object.entries(report.appointments.by_type).map(
                ([label, value]) => ({ label: capitalize(label), value })
              )}
            />
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Assessment Engagement
            </h2>

            {report.assessments.by_type &&
            Object.keys(report.assessments.by_type).length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-400">
                      <th className="py-2 font-medium">Assessment</th>
                      <th className="py-2 text-right font-medium">Started</th>
                      <th className="py-2 text-right font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.assessments.by_type).map(
                      ([type, counts]) => (
                        <tr
                          key={type}
                          className="border-b border-line last:border-0"
                        >
                          <td className="py-2 capitalize text-ink-800">
                            {type}
                          </td>
                          <td className="py-2 text-right text-ink-600">
                            {counts.started}
                          </td>
                          <td className="py-2 text-right text-ink-600">
                            {counts.completed}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">No activity.</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Daily Activity
            </h2>

            {dailyRows.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-400">
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 text-right font-medium">Sign-ups</th>
                      <th className="py-2 text-right font-medium">
                        Appointments
                      </th>
                      <th className="py-2 text-right font-medium">Check-ins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row) => (
                      <tr
                        key={row.date}
                        className="border-b border-line last:border-0"
                      >
                        <td className="py-2 text-ink-800">{row.date}</td>
                        <td className="py-2 text-right text-ink-600">
                          {row.signups}
                        </td>
                        <td className="py-2 text-right text-ink-600">
                          {row.appointments}
                        </td>
                        <td className="py-2 text-right text-ink-600">
                          {row.checkins}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No activity"
                description="No activity in this window."
                icon="📈"
                className="mt-4"
              />
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
