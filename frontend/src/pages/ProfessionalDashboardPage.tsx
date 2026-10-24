import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { classNames } from "@/utils";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  ProfessionalApplication,
  ProfessionalAppointmentSummary,
  WeeklySchedule,
} from "@/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  EmptyState,
  Input,
  Label,
  PageHeader,
  Select,
  Spinner,
  StatTile,
  statusTone,
} from "@/components/ui";

type StatusFilter = "all" | AppointmentStatus;
type TypeFilter = "all" | AppointmentType;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Weekday = (typeof WEEKDAYS)[number];

interface DayWindow {
  enabled: boolean;
  start: string;
  end: string;
}

type AvailabilityState = Record<Weekday, DayWindow>;

const buildEmptyAvailability = (): AvailabilityState =>
  WEEKDAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, start: "09:00", end: "17:00" };
    return acc;
  }, {} as AvailabilityState);

const buildAvailabilityFromSchedule = (
  schedule: WeeklySchedule | null
): AvailabilityState => {
  const base = buildEmptyAvailability();
  if (!schedule) return base;

  for (const day of WEEKDAYS) {
    const windows = schedule[day];
    if (Array.isArray(windows) && windows.length > 0) {
      base[day] = {
        enabled: true,
        start: windows[0].start,
        end: windows[0].end,
      };
    }
  }

  return base;
};

const serializeAvailability = (
  availability: AvailabilityState
): WeeklySchedule | undefined => {
  const result: WeeklySchedule = {};

  for (const day of WEEKDAYS) {
    const window = availability[day];
    if (window.enabled) {
      result[day] = [{ start: window.start, end: window.end }];
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
};

const formatDateTime = (value: string) =>
  new Date(`${value}Z`).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getErrorMessage = (err: unknown, fallback: string): string => {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
};

const checkbox =
  "h-4 w-4 shrink-0 rounded border-line text-brand-600 accent-brand-500 focus:ring-brand-500/30";

export default function ProfessionalDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isProfessional = user?.role === "professional";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState<ProfessionalAppointmentSummary | null>(
    null
  );
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [availability, setAvailability] = useState<AvailabilityState>(
    buildEmptyAvailability()
  );
  const [availLoading, setAvailLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [availError, setAvailError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const loadAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const response = await api.get<Appointment[]>("/appointments/me");
      setAppointments(response.data);
    } catch (err) {
      console.error("Could not load appointments:", err);
      setError("Could not load your appointments. Please try again.");
    } finally {
      setApptLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const response = await api.get<ProfessionalAppointmentSummary>(
        "/appointments/me/summary?days=30"
      );
      setSummary(response.data);
    } catch (err) {
      console.error("Could not load practice summary:", err);
      setSummaryError("Could not load your practice summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    setAvailLoading(true);
    setAvailError("");
    try {
      const response = await api.get<ProfessionalApplication>(
        "/professionals/me/application"
      );
      setAvailability(buildAvailabilityFromSchedule(response.data.availability));
    } catch (err) {
      console.error("Could not load availability:", err);
      setAvailError("Could not load your availability. Please try again.");
    } finally {
      setAvailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isProfessional) {
      if (!authLoading) {
        setApptLoading(false);
        setAvailLoading(false);
        setSummaryLoading(false);
      }
      return;
    }

    void loadAppointments();
    void loadAvailability();
    void loadSummary();
  }, [
    authLoading,
    isAuthenticated,
    isProfessional,
    loadAppointments,
    loadAvailability,
    loadSummary,
  ]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const appointment of appointments) {
      counts[appointment.status] += 1;
    }
    return counts;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      if (statusFilter !== "all" && appointment.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && appointment.appointment_type !== typeFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        appointment.patient_name ?? "",
        appointment.professional_name ?? "",
        appointment.specialization ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [appointments, search, statusFilter, typeFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleDecision = async (
    appointmentId: string,
    decision: "confirm" | "decline"
  ) => {
    setActionId(appointmentId);
    setError("");

    try {
      const path =
        decision === "confirm"
          ? `/appointments/${appointmentId}/confirm`
          : `/appointments/${appointmentId}/cancel`;
      await api.patch<Appointment>(path);
      await loadAppointments();
      void loadSummary();
    } catch (err) {
      console.error(`Could not ${decision} appointment:`, err);
      setError(getErrorMessage(err, `Could not ${decision} this appointment.`));
    } finally {
      setActionId(null);
    }
  };

  const updateDay = (day: Weekday, patch: Partial<DayWindow>) => {
    setSavedMessage("");
    setAvailability((current) => ({
      ...current,
      [day]: { ...current[day], ...patch },
    }));
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setAvailError("");
    setSavedMessage("");

    try {
      await api.put("/professionals/me/availability", {
        availability: serializeAvailability(availability),
      });
      setSavedMessage("Availability updated.");
      await loadAvailability();
    } catch (err) {
      console.error("Could not update availability:", err);
      setAvailError(
        getErrorMessage(
          err,
          "Could not update your availability. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Alert tone="brand">
          Please sign in with a professional account to view your dashboard.
        </Alert>
        <Link to="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!isProfessional) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Alert tone="danger">
          You do not have permission to view this page. Professional access is
          required.
        </Alert>
        <Link
          to="/professionals"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          ← Back to professionals
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <PageHeader
        eyebrow="Practice"
        title="Professional Dashboard"
        description="Manage your weekly availability and review your appointment requests."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Your practice at a glance</CardTitle>
            <CardDescription>
              Last 30 days. Counts only — no patient details.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
              <Spinner size="sm" className="text-brand-500" />
              Loading summary...
            </div>
          ) : summaryError ? (
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
          ) : summary ? (
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              role="group"
              aria-label="Practice summary for the last 30 days"
            >
              <StatTile
                title="Appointments"
                value={summary.total}
                detail={`${summary.period.start} → ${summary.period.end}`}
              />
              <StatTile
                title="Upcoming"
                value={summary.upcoming}
                detail="Future pending/confirmed"
              />
              <StatTile
                title="Unique patients"
                value={summary.unique_patients}
                detail="Seen in the last 30 days"
              />
              <StatTile
                title="Completed"
                value={summary.by_status.completed}
                detail={`${
                  summary.by_status.pending ?? 0
                } pending · ${summary.by_status.cancelled ?? 0} cancelled`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Review and act on incoming requests.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!apptLoading && appointments.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by patient or specialization"
                  aria-label="Search appointments by patient or specialization"
                  className="sm:flex-1"
                />

                <Select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as TypeFilter)
                  }
                  aria-label="Filter by appointment type"
                  className="sm:w-48"
                >
                  <option value="all">All types</option>
                  <option value="chat">Chat</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </Select>
              </div>

              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter appointments by status"
              >
                {STATUS_FILTERS.map((option) => {
                  const active = statusFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      aria-pressed={active}
                      className={classNames(
                        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-ink-900 text-white"
                          : "bg-mist text-ink-600 hover:bg-line"
                      )}
                    >
                      {option.label} ({statusCounts[option.value]})
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-ink-400" role="status">
                Showing {filteredAppointments.length} of {appointments.length}{" "}
                appointment{appointments.length === 1 ? "" : "s"}
              </p>
            </div>
          )}

          {apptLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
              <Spinner size="sm" className="text-brand-500" />
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              title="No appointment requests yet"
              description="You have no appointment requests right now. Keep your availability up to date so patients can book."
              icon="🗓"
            />
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title="No matching appointments"
              description="No appointments match your current search and filters."
              icon="🔍"
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="rounded-3xl border border-line p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-ink-900">
                        {appointment.patient_name || "Patient"}
                      </h3>

                      <p className="mt-1 text-sm text-ink-500">
                        {formatDateTime(appointment.scheduled_at)} ·{" "}
                        {appointment.duration_minutes} min ·{" "}
                        <span className="capitalize">
                          {appointment.appointment_type}
                        </span>
                      </p>
                    </div>

                    <Badge tone={statusTone(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {appointment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() =>
                            void handleDecision(appointment.id, "confirm")
                          }
                          disabled={actionId === appointment.id}
                        >
                          {actionId === appointment.id ? "Working..." : "Accept"}
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            void handleDecision(appointment.id, "decline")
                          }
                          disabled={actionId === appointment.id}
                        >
                          {actionId === appointment.id ? "Working..." : "Decline"}
                        </Button>
                      </>
                    )}

                    {appointment.meeting_url && (
                      <a
                        href={appointment.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                      >
                        Join Google Meet
                      </a>
                    )}

                    <Link to={`/appointments/${appointment.id}`}>
                      <Button size="sm" variant="secondary">
                        View details
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Weekly availability</CardTitle>
            <CardDescription>
              Patients can only book the windows you enable here.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {availLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
              <Spinner size="sm" className="text-brand-500" />
              Loading availability...
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Set your open hours</Label>

              <div className="divide-y divide-line rounded-3xl border border-line bg-white">
                {WEEKDAYS.map((day) => {
                  const window = availability[day];

                  return (
                    <div
                      key={day}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      <label className="flex w-32 cursor-pointer items-center gap-2.5 text-sm font-medium capitalize text-ink-700">
                        <input
                          type="checkbox"
                          className={checkbox}
                          checked={window.enabled}
                          onChange={(event) =>
                            updateDay(day, { enabled: event.target.checked })
                          }
                        />
                        {day}
                      </label>

                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={window.start}
                          disabled={!window.enabled}
                          onChange={(event) =>
                            updateDay(day, { start: event.target.value })
                          }
                          className="w-auto px-3 py-2"
                          aria-label={`${day} start time`}
                        />
                        <span className="text-xs text-ink-400">to</span>
                        <Input
                          type="time"
                          value={window.end}
                          disabled={!window.enabled}
                          onChange={(event) =>
                            updateDay(day, { end: event.target.value })
                          }
                          className="w-auto px-3 py-2"
                          aria-label={`${day} end time`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {availError && <Alert tone="danger">{availError}</Alert>}
          {savedMessage && <Alert tone="success">{savedMessage}</Alert>}

          <Button
            onClick={() => void handleSaveAvailability()}
            disabled={saving || availLoading}
            loading={saving}
          >
            {saving ? "Saving..." : "Save availability"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
