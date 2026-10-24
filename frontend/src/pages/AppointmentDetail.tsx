import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  Appointment,
  PatientAssessmentSummary,
  PatientMoodHistory,
} from "@/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Spinner,
  statusTone,
} from "@/components/ui";
import type { BadgeTone } from "@/components/ui";

const formatDateTime = (value: string) =>
  new Date(`${value}Z`).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });

const severityTone = (level: string): BadgeTone => {
  switch (level) {
    case "good_wellbeing":
    case "minimal":
      return "success";
    case "lower_wellbeing":
    case "mild":
    case "moderate":
      return "warning";
    case "severe":
      return "danger";
    case "screening":
      return "info";
    default:
      return "neutral";
  }
};

interface MoodTileProps {
  label: string;
  value: string | number;
}

function MoodTile({ label, value }: MoodTileProps) {
  return (
    <div className="rounded-2xl bg-mist p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-lg font-semibold text-ink-900">{value}</p>
    </div>
  );
}

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [assessments, setAssessments] = useState<PatientAssessmentSummary[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [assessmentsError, setAssessmentsError] = useState("");

  const [moodHistory, setMoodHistory] = useState<PatientMoodHistory | null>(
    null
  );
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState("");

  const canViewPatientData =
    user?.role === "professional" || user?.role === "admin";

  useEffect(() => {
    if (authLoading || !isAuthenticated || !id) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAppointment = async () => {
      setLoading(true);
      setError("");
      setAccessDenied(false);

      try {
        const response = await api.get<Appointment>(`/appointments/${id}`);
        if (!cancelled) setAppointment(response.data);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (!cancelled) {
          if (status === 403) {
            setAccessDenied(true);
          } else if (status === 404) {
            setError("This appointment could not be found.");
          } else {
            console.error("Could not load appointment:", err);
            setError("Could not load this appointment. Please try again.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAppointment();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, id]);

  useEffect(() => {
    if (!appointment || !canViewPatientData) return;

    let cancelled = false;

    const loadPatientData = async () => {
      setAssessmentsLoading(true);
      setMoodLoading(true);
      setAssessmentsError("");
      setMoodError("");

      const [assessmentsResult, moodResult] = await Promise.allSettled([
        api.get<PatientAssessmentSummary[]>(
          `/appointments/${appointment.id}/patient/assessments`
        ),
        api.get<PatientMoodHistory>(
          `/appointments/${appointment.id}/patient/mood`
        ),
      ]);

      if (cancelled) return;

      if (assessmentsResult.status === "fulfilled") {
        setAssessments(assessmentsResult.value.data);
      } else {
        console.error(
          "Could not load patient assessments:",
          assessmentsResult.reason
        );
        setAssessmentsError(
          "Could not load this patient's assessment reports. Please try again."
        );
      }
      setAssessmentsLoading(false);

      if (moodResult.status === "fulfilled") {
        setMoodHistory(moodResult.value.data);
      } else {
        console.error("Could not load patient mood history:", moodResult.reason);
        setMoodError(
          "Could not load this patient's mood history. Please try again."
        );
      }
      setMoodLoading(false);
    };

    void loadPatientData();

    return () => {
      cancelled = true;
    };
  }, [appointment, canViewPatientData]);

  const handleCancel = async () => {
    if (!appointment) return;

    setCancelling(true);
    setError("");

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointment.id}/cancel`
      );
      setAppointment(response.data);
    } catch (err) {
      console.error("Could not cancel appointment:", err);
      setError("Could not cancel this appointment. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    setConfirming(true);
    setError("");

    try {
      const response = await api.patch<Appointment>(
        `/appointments/${appointment.id}/confirm`
      );
      setAppointment(response.data);
    } catch (err) {
      console.error("Could not confirm appointment:", err);
      setError("Could not confirm this appointment. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading appointment...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="brand">Please sign in to view this appointment.</Alert>
        <Link to="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="danger">
          You do not have permission to view this appointment.
        </Alert>
        <Link
          to="/appointments"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          ← Back to my appointments
        </Link>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="danger">{error || "Appointment not found."}</Alert>
        <Link
          to="/appointments"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          ← Back to my appointments
        </Link>
      </div>
    );
  }

  const canCancel =
    appointment.status !== "cancelled" && appointment.status !== "completed";

  const canConfirm =
    (user?.role === "professional" || user?.role === "admin") &&
    appointment.status === "pending";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        to="/appointments"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        ← Back to my appointments
      </Link>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink-900">
            {appointment.professional_name || "Professional"}
          </h1>

          <Badge tone={statusTone(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>

        {appointment.specialization && (
          <p className="mt-1 font-medium text-brand-600">
            {appointment.specialization}
          </p>
        )}

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-400">Scheduled for</dt>
            <dd className="mt-0.5 font-medium text-ink-800">
              {formatDateTime(appointment.scheduled_at)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Duration</dt>
            <dd className="mt-0.5 font-medium text-ink-800">
              {appointment.duration_minutes} minutes
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Type</dt>
            <dd className="mt-0.5 font-medium capitalize text-ink-800">
              {appointment.appointment_type}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Booked on</dt>
            <dd className="mt-0.5 font-medium text-ink-800">
              {formatDateTime(appointment.created_at)}
            </dd>
          </div>
        </dl>

        {error && (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {appointment.meeting_url && (
            <a
              href={appointment.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Join Google Meet
            </a>
          )}

          {canConfirm && (
            <Button
              variant="subtle"
              onClick={() => void handleConfirm()}
              loading={confirming}
            >
              {confirming ? "Confirming..." : "Accept appointment"}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="danger"
              onClick={() => void handleCancel()}
              loading={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel appointment"}
            </Button>
          )}
        </div>
      </Card>

      {canViewPatientData && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Patient assessment reports</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                {appointment.patient_name
                  ? `Completed assessments for ${appointment.patient_name}.`
                  : "Completed assessments for this patient."}
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {assessmentsLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading assessment reports...
              </div>
            ) : assessmentsError ? (
              <Alert tone="danger">{assessmentsError}</Alert>
            ) : assessments.length === 0 ? (
              <EmptyState
                title="No assessments yet"
                description="This patient has no completed assessments yet."
                icon="📋"
              />
            ) : (
              <ul className="space-y-3">
                {assessments.map((assessment) => (
                  <li
                    key={assessment.id}
                    className="rounded-2xl border border-line p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink-800">
                        {assessment.assessment_name}
                      </span>

                      <Badge tone={severityTone(assessment.severity_level)}>
                        {assessment.severity_level.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-ink-500">
                      <p>
                        <span className="font-medium text-ink-600">Score:</span>{" "}
                        {assessment.total_score}
                      </p>

                      {assessment.completed_at && (
                        <p>
                          <span className="font-medium text-ink-600">
                            Completed:
                          </span>{" "}
                          {formatDateTime(assessment.completed_at)}
                        </p>
                      )}

                      {assessment.interpretation && (
                        <p className="text-ink-700">
                          {assessment.interpretation}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {canViewPatientData && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Patient mood history</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                {appointment.patient_name
                  ? `Recent mood check-ins from ${appointment.patient_name}.`
                  : "Recent mood check-ins from this patient."}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {moodLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
                <Spinner size="sm" className="text-brand-500" />
                Loading mood history...
              </div>
            ) : moodError ? (
              <Alert tone="danger">{moodError}</Alert>
            ) : !moodHistory || moodHistory.records.length === 0 ? (
              <EmptyState
                title="No mood check-ins"
                description="This patient has no mood check-ins yet."
                icon="📈"
              />
            ) : (
              <>
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <MoodTile
                    label="Average"
                    value={moodHistory.statistics.average_mood ?? "—"}
                  />
                  <MoodTile
                    label="Highest"
                    value={moodHistory.statistics.highest_mood ?? "—"}
                  />
                  <MoodTile
                    label="Lowest"
                    value={moodHistory.statistics.lowest_mood ?? "—"}
                  />
                  <MoodTile
                    label="Check-ins"
                    value={moodHistory.statistics.total_check_ins}
                  />
                </div>

                <ul className="space-y-2">
                  {moodHistory.records.map((record) => (
                    <li
                      key={record.mood_date}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line p-3 text-sm"
                    >
                      <span className="font-medium text-ink-800">
                        {formatDate(record.mood_date)}
                      </span>

                      <span className="text-ink-600">
                        Mood: {record.mood_score}/10
                        {record.mood_label ? ` · ${record.mood_label}` : ""}
                      </span>

                      {record.note && (
                        <span className="w-full text-ink-400">
                          {record.note}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
