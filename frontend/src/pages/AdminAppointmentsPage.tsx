import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { classNames } from "@/utils";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  statusTone,
} from "@/components/ui";

const formatDateTime = (value: string) =>
  new Date(`${value}Z`).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

type StatusFilter = "all" | AppointmentStatus;
type TypeFilter = "all" | AppointmentType;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const getErrorMessage = (err: unknown, fallback: string): string => {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
};

export default function AdminAppointmentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowMessages, setRowMessages] = useState<
    Record<string, { kind: "success" | "error"; text: string }>
  >({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [actionId, setActionId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Appointment[]>("/appointments/admin");
      setAppointments(response.data);
      setLinkDrafts((current) => {
        const next = { ...current };
        for (const appointment of response.data) {
          if (!(appointment.id in next)) {
            next[appointment.id] = appointment.meeting_url ?? "";
          }
        }
        return next;
      });
    } catch (err) {
      console.error("Could not load appointments:", err);
      setError("Could not load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin) {
      if (!authLoading) setLoading(false);
      return;
    }

    void loadAppointments();
  }, [authLoading, isAuthenticated, isAdmin, loadAppointments]);

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

  const handleStatusAction = async (
    appointmentId: string,
    action: "confirm" | "cancel"
  ) => {
    setActionId(appointmentId);
    setRowMessages((current) => {
      const next = { ...current };
      delete next[appointmentId];
      return next;
    });

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointmentId}/${action}`
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      );
      setRowMessages((current) => ({
        ...current,
        [appointmentId]: {
          kind: "success",
          text:
            action === "confirm"
              ? "Appointment confirmed. The patient has been notified."
              : "Appointment cancelled. The affected parties have been notified.",
        },
      }));
    } catch (err) {
      console.error(`Could not ${action} appointment:`, err);
      setRowMessages((current) => ({
        ...current,
        [appointmentId]: {
          kind: "error",
          text: getErrorMessage(
            err,
            `Could not ${action} this appointment. Please try again.`
          ),
        },
      }));
    } finally {
      setActionId(null);
    }
  };

  const handleSaveLink = async (appointmentId: string) => {
    const meetingUrl = (linkDrafts[appointmentId] ?? "").trim();
    setSavingId(appointmentId);
    setRowMessages((current) => {
      const next = { ...current };
      delete next[appointmentId];
      return next;
    });

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointmentId}/meeting-link`,
        { meeting_url: meetingUrl }
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      );
      setRowMessages((current) => ({
        ...current,
        [appointmentId]: {
          kind: "success",
          text:
            response.data.status === "confirmed"
              ? "Google Meet link saved."
              : "Link saved. It will appear once the appointment is confirmed.",
        },
      }));
    } catch (err) {
      console.error("Could not save meeting link:", err);
      setRowMessages((current) => ({
        ...current,
        [appointmentId]: {
          kind: "error",
          text: getErrorMessage(
            err,
            "Could not save the link. Use an https://meet.google.com URL."
          ),
        },
      }));
    } finally {
      setSavingId(null);
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
      <Alert tone="brand">
        Please sign in with an administrator account to manage appointments.
      </Alert>
    );
  }

  if (!isAdmin) {
    return (
      <Alert tone="danger">
        You do not have permission to view this page. Administrator access is
        required.
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Appointments"
        description="Add or update the Google Meet link for any appointment."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {!loading && appointments.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient, professional, or specialization"
              aria-label="Search appointments by patient, professional, or specialization"
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

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description="There are no appointments to manage right now."
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
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const rowMessage = rowMessages[appointment.id];

            const canConfirm = appointment.status === "pending";
            const canCancel =
              appointment.status !== "cancelled" &&
              appointment.status !== "completed";

            return (
              <Card key={appointment.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">
                      {appointment.patient_name || "Patient"}
                      <span className="font-normal text-ink-400"> with </span>
                      {appointment.professional_name || "Professional"}
                    </h2>
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

                {appointment.meeting_url && (
                  <a
                    href={appointment.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Open current Google Meet link
                  </a>
                )}

                {(canConfirm || canCancel) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {canConfirm && (
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() =>
                          void handleStatusAction(appointment.id, "confirm")
                        }
                        loading={actionId === appointment.id}
                      >
                        {actionId === appointment.id
                          ? "Working..."
                          : "Confirm appointment"}
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          void handleStatusAction(appointment.id, "cancel")
                        }
                        loading={actionId === appointment.id}
                      >
                        {actionId === appointment.id
                          ? "Working..."
                          : "Cancel appointment"}
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="url"
                    value={linkDrafts[appointment.id] ?? ""}
                    onChange={(event) =>
                      setLinkDrafts((current) => ({
                        ...current,
                        [appointment.id]: event.target.value,
                      }))
                    }
                    placeholder="https://meet.google.com/abc-defg-hij"
                    aria-label="Google Meet link"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => void handleSaveLink(appointment.id)}
                    disabled={
                      savingId === appointment.id ||
                      !(linkDrafts[appointment.id] ?? "").trim()
                    }
                    loading={savingId === appointment.id}
                  >
                    {savingId === appointment.id ? "Saving..." : "Save link"}
                  </Button>
                </div>

                {rowMessage && (
                  <Alert
                    tone={rowMessage.kind === "success" ? "success" : "danger"}
                  >
                    {rowMessage.text}
                  </Alert>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
