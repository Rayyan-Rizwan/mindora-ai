import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { AdminAnalyticsSummary, AdminReportSummary } from "@/types";
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
import { useTheme } from "@/context/ThemeContext";

const PERIODS = [7, 30, 90];

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

const shortDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

interface TrendRow {
  date: string;
  label: string;
  signups: number;
  appointments: number;
  checkins: number;
}

function buildTrendRows(report: AdminReportSummary | null): TrendRow[] {
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
    .map(([date, counts]) => ({ date, label: shortDate(date), ...counts }));
}

export default function AdminAnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const chartGrid = theme === "dark" ? "#4A3D46" : "#EBE7F4";
  const chartAxis = theme === "dark" ? "#AEA0A2" : "#716D7C";
  const chartBrand = theme === "dark" ? "#D6A0A5" : "#B77980";

  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [days, setDays] = useState(30);
  const [report, setReport] = useState<AdminReportSummary | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const response = await api.get<AdminAnalyticsSummary>(
        "/admin/analytics/summary"
      );
      setSummary(response.data);
    } catch (err) {
      console.error("Could not load analytics:", err);
      setSummaryError("Could not load analytics. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    setReportError("");

    try {
      const response = await api.get<AdminReportSummary>(
        `/admin/reports/summary?days=${days}`
      );
      setReport(response.data);
    } catch (err) {
      console.error("Could not load activity report:", err);
      setReportError("Could not load activity data. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) {
        setSummaryLoading(false);
        setReportLoading(false);
      }
      return;
    }

    void loadSummary();
  }, [authLoading, isAuthenticated, loadSummary]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void loadReport();
  }, [authLoading, isAuthenticated, loadReport]);

  const trendRows = useMemo(() => buildTrendRows(report), [report]);

  const appointmentStatusRows = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.appointments.by_status).map(
      ([status, count]) => ({
        status: capitalize(status),
        count,
      })
    );
  }, [report]);

  const assessmentRows = useMemo(() => {
    if (!report) return [];
    return [
      { name: "Started", count: report.assessments.started },
      { name: "Completed", count: report.assessments.completed },
    ];
  }, [report]);

  const hasTrendData = trendRows.some(
    (row) => row.signups > 0 || row.appointments > 0 || row.checkins > 0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="System Analytics"
        description="Aggregate platform counts and trends. No private or clinical data is shown."
        actions={
          <Tabs
            ariaLabel="Analytics period"
            value={String(days)}
            onChange={(value) => setDays(Number(value))}
            items={PERIODS.map((period) => ({
              value: String(period),
              label: `${period} days`,
            }))}
          />
        }
      />

      {summaryError && (
        <Alert tone="danger">
          {summaryError}{" "}
          <button
            type="button"
            onClick={() => void loadSummary()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Alert>
      )}

      {summaryLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading analytics...
        </div>
      ) : summary ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <BreakdownCard
            title="Users"
            total={summary.users.total}
            rows={[
              { label: "Active", value: summary.users.active },
              { label: "Inactive", value: summary.users.inactive },
              ...Object.entries(summary.users.by_role).map(([role, value]) => ({
                label: capitalize(role),
                value,
              })),
            ]}
          />

          <BreakdownCard
            title="Professionals"
            total={summary.professionals.total}
            rows={[
              { label: "Active", value: summary.professionals.active },
              { label: "Verified", value: summary.professionals.verified },
              ...Object.entries(summary.professionals.by_approval_status).map(
                ([statusName, value]) => ({
                  label: capitalize(statusName),
                  value,
                })
              ),
            ]}
          />

          <BreakdownCard
            title="Appointments"
            total={summary.appointments.total}
            rows={Object.entries(summary.appointments.by_status).map(
              ([statusName, value]) => ({
                label: capitalize(statusName),
                value,
              })
            )}
          />

          <BreakdownCard
            title="Assessments"
            total={summary.assessments.total}
            rows={[
              { label: "Completed", value: summary.assessments.completed },
              { label: "In progress", value: summary.assessments.in_progress },
            ]}
          />

          <BreakdownCard
            title="Mood Check-ins"
            total={summary.mood_records.total}
            rows={[]}
          />
        </div>
      ) : null}

      {/* Activity trends for the selected window (real report data). */}
      {reportError && (
        <Alert tone="danger">
          {reportError}{" "}
          <button
            type="button"
            onClick={() => void loadReport()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </Alert>
      )}

      {reportLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading activity trends...
        </div>
      ) : report ? (
        <div className="space-y-8">
          <p className="text-sm text-ink-500" role="status">
            Window: {report.period.start} to {report.period.end} (
            {report.period.days} days)
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              title="Sign-ups"
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
              title="Notifications"
              value={report.notifications.sent}
              detail={`${report.notifications.read} read · ${
                report.notifications.unread
              } unread`}
            />
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900">
              Daily activity
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Sign-ups, appointments booked and mood check-ins per day.
            </p>

            {trendRows.length === 0 || !hasTrendData ? (
              <EmptyState
                title="No activity in this window"
                description="Try a longer period, or check back once the platform has more activity."
                icon="📈"
                className="mt-4"
              />
            ) : (
              <>
                <div
                  className="mt-4 h-72 w-full"
                  role="img"
                  aria-label={`Line chart of daily activity over ${report.period.days} days. ${
                    trendRows.filter(
                      (row) =>
                        row.signups > 0 ||
                        row.appointments > 0 ||
                        row.checkins > 0
                    ).length
                  } days had activity. A data table with the same numbers is available below the chart.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendRows}
                      margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: chartAxis }}
                        interval="preserveStartEnd"
                        minTickGap={24}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: chartAxis }}
                        width={40}
                      />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="signups"
                        name="Sign-ups"
                        stroke={chartBrand}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="appointments"
                        name="Appointments"
                        stroke="#4f9dff"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="checkins"
                        name="Mood check-ins"
                        stroke="#34c98f"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Accessible data alternative for the chart above. */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-ink-600">
                    View daily data as a table
                  </summary>
                  <div className="mt-3 max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-ink-400">
                          <th className="py-2 font-medium">Date</th>
                          <th className="py-2 text-right font-medium">
                            Sign-ups
                          </th>
                          <th className="py-2 text-right font-medium">
                            Appointments
                          </th>
                          <th className="py-2 text-right font-medium">
                            Check-ins
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {trendRows.map((row) => (
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
                </details>
              </>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">
                Appointments by status
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Booked within the selected window.
              </p>

              {appointmentStatusRows.every((row) => row.count === 0) ? (
                <EmptyState
                  title="No appointments booked"
                  description="No appointments were booked in this window."
                  icon="🗓"
                  className="mt-4"
                />
              ) : (
                <div
                  className="mt-4 h-64 w-full"
                  role="img"
                  aria-label={`Bar chart of appointment statuses in the selected window: ${appointmentStatusRows
                    .map((row) => `${row.status} ${row.count}`)
                    .join(", ")}.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={appointmentStatusRows}
                      margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                      <XAxis
                        dataKey="status"
                        tick={{ fontSize: 11, fill: chartAxis }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: chartAxis }}
                        width={40}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name="Appointments" fill={chartBrand} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-ink-900">
                Assessment activity
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Assessments started vs completed in the window (counts only).
              </p>

              {report.assessments.started === 0 ? (
                <EmptyState
                  title="No assessment activity"
                  description="No assessments were started in this window."
                  icon="📝"
                  className="mt-4"
                />
              ) : (
                <>
                  <div
                    className="mt-4 h-64 w-full"
                    role="img"
                    aria-label={`Bar chart of assessment activity: ${report.assessments.started} started, ${report.assessments.completed} completed.`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={assessmentRows}
                        margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: chartAxis }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: chartAxis }}
                          width={40}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Assessments"
                          fill="#4f9dff"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-3 text-sm text-ink-500">
                    Completion rate:{" "}
                    {report.assessments.started > 0
                      ? Math.round(
                          (report.assessments.completed /
                            report.assessments.started) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
