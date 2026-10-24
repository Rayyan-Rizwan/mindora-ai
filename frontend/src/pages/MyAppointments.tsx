import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const canConfirmAppointments =
    user?.role === "professional" || user?.role === "admin";

  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Appointment[]>("/appointments/me");
      setAppointments(response.data);
    } catch (err) {
      console.error("Could not load appointments:", err);
      setError("Could not load your appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

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
        appointment.professional_name ?? "",
        appointment.patient_name ?? "",
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

  const handleCancel = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    setError("");

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointmentId}/cancel`
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      );
    } catch (err) {
      console.error("Could not cancel appointment:", err);
      setError("Could not cancel this appointment. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    setError("");

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointmentId}/confirm`
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? response.data : appointment
        )
      );
    } catch (err) {
      console.error("Could not confirm appointment:", err);
      setError("Could not confirm this appointment. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sessions"
        title="My appointments"
        description="View and manage your upcoming consultations."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {!loading && appointments.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or specialization"
              aria-label="Search appointments by name or specialization"
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
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
          <Spinner className="text-brand-500" />
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="You have no appointments scheduled. Find a professional to book a session."
          icon="🗓"
          action={
            <Link to="/professionals">
              <Button>Find a professional</Button>
            </Link>
          }
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
            const canCancel =
              appointment.status !== "cancelled" &&
              appointment.status !== "completed";

            const canConfirm =
              canConfirmAppointments && appointment.status === "pending";

            return (
              <Card
                key={appointment.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-ink-900">
                      {appointment.professional_name || "Professional"}
                    </h2>

                    <Badge tone={statusTone(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  {appointment.specialization && (
                    <p className="mt-1 text-sm font-medium text-brand-600">
                      {appointment.specialization}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-ink-500">
                    {formatDateTime(appointment.scheduled_at)} ·{" "}
                    {appointment.duration_minutes} min ·{" "}
                    <span className="capitalize">
                      {appointment.appointment_type}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {canConfirm && (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => void handleConfirm(appointment.id)}
                      loading={confirmingId === appointment.id}
                    >
                      {confirmingId === appointment.id
                        ? "Working..."
                        : "Accept"}
                    </Button>
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

                  {canCancel && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void handleCancel(appointment.id)}
                      loading={cancellingId === appointment.id}
                    >
                      {cancellingId === appointment.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
