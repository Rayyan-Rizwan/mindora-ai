import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  AppointmentType,
  ProfessionalApplication,
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
  Field,
  Input,
  Label,
  PageHeader,
  Spinner,
  statusTone,
  Textarea,
} from "@/components/ui";

const CONSULTATION_TYPES: AppointmentType[] = ["chat", "audio", "video"];

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

const getErrorMessage = (err: unknown, fallback: string): string => {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item !== null && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : String(item)
      )
      .join(", ");
  }

  return fallback;
};

const statusLabels: Record<string, string> = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

const checkbox =
  "h-4 w-4 shrink-0 rounded border-line text-brand-600 accent-brand-500 focus:ring-brand-500/30";

interface AvailabilityEditorProps {
  availability: AvailabilityState;
  onChange: (day: Weekday, patch: Partial<DayWindow>) => void;
  disabled?: boolean;
}

function AvailabilityEditor({
  availability,
  onChange,
  disabled,
}: AvailabilityEditorProps) {
  return (
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
                disabled={disabled}
                onChange={(event) =>
                  onChange(day, { enabled: event.target.checked })
                }
              />
              {day}
            </label>

            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={window.start}
                disabled={disabled || !window.enabled}
                onChange={(event) => onChange(day, { start: event.target.value })}
                className="w-auto px-3 py-2"
                aria-label={`${day} start time`}
              />
              <span className="text-xs text-ink-400">to</span>
              <Input
                type="time"
                value={window.end}
                disabled={disabled || !window.enabled}
                onChange={(event) => onChange(day, { end: event.target.value })}
                className="w-auto px-3 py-2"
                aria-label={`${day} end time`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ApplicationFormProps {
  application: ProfessionalApplication | null;
  onSubmitted: (application: ProfessionalApplication) => void;
}

function ApplicationForm({ application, onSubmitted }: ApplicationFormProps) {
  const [licenseNumber, setLicenseNumber] = useState(
    application?.license_number ?? ""
  );
  const [specialization, setSpecialization] = useState(
    application?.specialization ?? ""
  );
  const [qualification, setQualification] = useState(
    application?.qualification ?? ""
  );
  const [bio, setBio] = useState(application?.bio ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    String(application?.years_experience ?? 0)
  );
  const [consultationFee, setConsultationFee] = useState(
    application ? String(application.consultation_fee) : ""
  );
  const [consultationTypes, setConsultationTypes] = useState<AppointmentType[]>(
    application?.consultation_types ?? ["chat"]
  );
  const [availability, setAvailability] = useState<AvailabilityState>(() =>
    buildAvailabilityFromSchedule(application?.availability ?? null)
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleConsultationType = (type: AppointmentType) => {
    setConsultationTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  const updateDay = (day: Weekday, patch: Partial<DayWindow>) => {
    setAvailability((current) => ({
      ...current,
      [day]: { ...current[day], ...patch },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await api.post<ProfessionalApplication>(
        "/professionals/apply",
        {
          license_number: licenseNumber.trim(),
          specialization: specialization.trim(),
          qualification: qualification.trim() || null,
          bio: bio.trim() || null,
          years_experience: Number(yearsExperience) || 0,
          consultation_fee: Number(consultationFee) || 0,
          consultation_types:
            consultationTypes.length > 0 ? consultationTypes : undefined,
          availability: serializeAvailability(availability),
        }
      );

      onSubmitted(response.data);
    } catch (err) {
      console.error("Could not submit application:", err);
      setError(
        getErrorMessage(
          err,
          "Could not submit your application. Please try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="License number" required htmlFor="license-number">
          <Input
            id="license-number"
            type="text"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            required
            maxLength={100}
          />
        </Field>

        <Field label="Specialization" required htmlFor="specialization">
          <Input
            id="specialization"
            type="text"
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            required
            maxLength={150}
          />
        </Field>

        <Field label="Qualification" htmlFor="qualification">
          <Input
            id="qualification"
            type="text"
            value={qualification}
            onChange={(event) => setQualification(event.target.value)}
            maxLength={255}
          />
        </Field>

        <Field label="Years of experience" htmlFor="years">
          <Input
            id="years"
            type="number"
            value={yearsExperience}
            onChange={(event) => setYearsExperience(event.target.value)}
            min={0}
          />
        </Field>

        <Field
          label="Consultation fee"
          htmlFor="fee"
          className="sm:col-span-2 sm:max-w-xs"
        >
          <Input
            id="fee"
            type="number"
            value={consultationFee}
            onChange={(event) => setConsultationFee(event.target.value)}
            min={0}
            step="0.01"
          />
        </Field>
      </div>

      <Field label="Bio" htmlFor="bio">
        <Textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={4}
        />
      </Field>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-ink-700">
          Consultation types
        </legend>
        <div className="flex flex-wrap gap-4">
          {CONSULTATION_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 text-sm capitalize text-ink-700"
            >
              <input
                type="checkbox"
                className={checkbox}
                checked={consultationTypes.includes(type)}
                onChange={() => toggleConsultationType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3">
        <div>
          <Label>Weekly availability</Label>
          <p className="-mt-1 text-xs text-ink-400">
            Patients can only book the windows you enable.
          </p>
        </div>

        <AvailabilityEditor
          availability={availability}
          onChange={updateDay}
          disabled={submitting}
        />
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Button type="submit" loading={submitting} size="lg">
        {submitting
          ? "Submitting..."
          : application
            ? "Resubmit application"
            : "Submit application"}
      </Button>
    </form>
  );
}

export default function ProfessionalApplicationPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [application, setApplication] =
    useState<ProfessionalApplication | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    const loadApplication = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<ProfessionalApplication>(
          "/professionals/me/application"
        );
        if (!cancelled) setApplication(response.data);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (!cancelled) {
          if (status === 404) {
            setApplication(null);
          } else {
            console.error("Could not load application:", err);
            setError("Could not load your application. Please try again.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadApplication();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading your application...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="brand">
          Please sign in to apply as a mental health professional.
        </Alert>
        <Link to="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  const canApply = !application || application.approval_status === "rejected";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Join the network"
        title="Become a Professional"
        description="Submit your credentials for review. An administrator will approve or reject your application."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {application && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Application status</CardTitle>
              <CardDescription>
                {application.specialization} · {application.years_experience}{" "}
                years experience · {application.license_number}
              </CardDescription>
            </div>

            <Badge tone={statusTone(application.approval_status)}>
              {statusLabels[application.approval_status] ??
                application.approval_status}
            </Badge>
          </CardHeader>

          <CardContent>
            {application.approval_status === "pending" && (
              <Alert tone="warning">
                Your application is being reviewed. You'll be notified once a
                decision is made.
              </Alert>
            )}

            {application.approval_status === "approved" && (
              <Alert tone="success">
                You're approved and now listed as a professional.{" "}
                <Link
                  to="/professionals"
                  className="font-semibold hover:underline"
                >
                  View the directory
                </Link>
              </Alert>
            )}

            {application.approval_status === "rejected" && (
              <Alert tone="danger">
                Your application was not approved. You can update your details
                and resubmit below.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {canApply && (
        <Card>
          <CardHeader>
            <CardTitle>
              {application ? "Update and resubmit" : "Application details"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ApplicationForm
              key={application?.id ?? "new"}
              application={application}
              onSubmitted={(submitted) => {
                setApplication(submitted);
                setError("");
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
