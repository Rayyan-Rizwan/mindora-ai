import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  Appointment,
  AppointmentType,
  Professional,
  ProfessionalAvailability,
} from "@/types";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";

const DURATIONS = [15, 30, 45, 60];

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalTime = (hhmm: string) => {
  const [hour, minute] = hhmm.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = toDateString(new Date());
  const [date, setDate] = useState(today);
  const [availability, setAvailability] =
    useState<ProfessionalAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [appointmentType, setAppointmentType] =
    useState<AppointmentType>("chat");
  const [duration, setDuration] = useState(30);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [booking, setBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] =
    useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfessional = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<Professional>(`/professionals/${id}`);
        if (!cancelled) {
          setProfessional(response.data);
          const types = response.data.consultation_types;
          if (types && types.length > 0) {
            setAppointmentType(types[0]);
          }
        }
      } catch (err) {
        console.error("Could not load professional:", err);
        if (!cancelled) {
          setError("This professional could not be found.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfessional();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setSelectedSlot(null);

      try {
        const response = await api.get<ProfessionalAvailability>(
          `/professionals/${id}/availability`,
          { params: { date, duration_minutes: duration } }
        );
        if (!cancelled) {
          setAvailability(response.data);
        }
      } catch (err) {
        console.error("Could not load availability:", err);
        if (!cancelled) {
          setAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [id, date, duration]);

  const handleBook = async () => {
    if (!professional || !selectedSlot) return;

    setBooking(true);
    setBookingError("");

    try {
      const response = await api.post<Appointment>("/appointments", {
        professional_id: professional.id,
        scheduled_at: selectedSlot,
        duration_minutes: duration,
        appointment_type: appointmentType,
      });

      setBookedAppointment(response.data);
      setSelectedSlot(null);

      const response2 = await api.get<ProfessionalAvailability>(
        `/professionals/${professional.id}/availability`,
        { params: { date } }
      );
      setAvailability(response2.data);
    } catch (err) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Could not book this slot. Please try another time.";
      setBookingError(message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading professional...
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="space-y-4">
        <Alert tone="danger">{error || "Professional not found."}</Alert>
        <Link
          to="/professionals"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          ← Back to professionals
        </Link>
      </div>
    );
  }

  const consultationTypes = professional.consultation_types ?? ["chat"];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        to="/professionals"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        ← Back to professionals
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={professional.full_name} size="lg" />

          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-3xl">
              {professional.full_name}
            </h1>

            <p className="mt-1 font-medium text-brand-600">
              {professional.specialization}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {professional.qualification && (
            <Badge tone="neutral">{professional.qualification}</Badge>
          )}
          <Badge tone="neutral">
            {professional.years_experience} years experience
          </Badge>
          <Badge tone="brand">Fee: {professional.consultation_fee}</Badge>
        </div>

        {professional.bio && (
          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-ink-600">
            {professional.bio}
          </p>
        )}
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">
          Book an appointment
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <Field label="Date" htmlFor="appointment-date" required>
            <Input
              id="appointment-date"
              type="date"
              value={date}
              min={today}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>

          <Field label="Consultation type" htmlFor="appointment-type" required>
            <Select
              id="appointment-type"
              value={appointmentType}
              onChange={(event) =>
                setAppointmentType(event.target.value as AppointmentType)
              }
              className="capitalize"
            >
              {consultationTypes.map((type) => (
                <option key={type} value={type} className="capitalize">
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Duration" htmlFor="appointment-duration" required>
            <Select
              id="appointment-duration"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            >
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-7">
          <h3 className="text-sm font-medium text-ink-700">
            Available slots
            {availability && (
              <span className="font-normal text-ink-400">
                {" "}
                (times shown in {availability.timezone})
              </span>
            )}
          </h3>

          <div className="mt-3">
            {availabilityLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading slots...
              </div>
            ) : !availability || availability.slots.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line-strong bg-mist/60 px-4 py-6 text-center text-sm text-ink-500">
                No slots available on this date. Try another day.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {availability.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.start_utc;
                  return (
                    <button
                      key={slot.start_utc}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot.start_utc);
                        setBookedAppointment(null);
                        setBookingError("");
                      }}
                      aria-pressed={isSelected}
                      className={
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all " +
                        (isSelected
                          ? "border-brand-500 bg-brand-500 text-white shadow-soft"
                          : "border-line text-ink-700 hover:border-brand-300 hover:bg-brand-50")
                      }
                    >
                      {formatLocalTime(slot.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {bookingError && (
          <Alert tone="danger" className="mt-6">
            {bookingError}
          </Alert>
        )}

        {bookedAppointment && (
          <Alert tone="success" className="mt-6">
            Appointment booked for{" "}
            {new Date(`${bookedAppointment.scheduled_at}Z`).toLocaleString()}.{" "}
            <Link
              to="/appointments"
              className="font-semibold underline"
            >
              View my appointments
            </Link>
          </Alert>
        )}

        {!authLoading && !isAuthenticated && (
          <Alert tone="brand" className="mt-6">
            <Link to="/login" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to book an appointment with this professional.
          </Alert>
        )}

        <Button
          size="lg"
          className="mt-6"
          onClick={() => void handleBook()}
          disabled={!isAuthenticated || !selectedSlot || booking}
          loading={booking}
        >
          {booking ? "Booking..." : "Confirm booking"}
        </Button>
      </Card>
    </div>
  );
}
