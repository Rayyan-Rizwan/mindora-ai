import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type {
  ProfessionalApplication,
  ProfessionalApprovalStatus,
} from "@/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  statusTone,
  Tabs,
} from "@/components/ui";

const FILTERS: { value: ProfessionalApprovalStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const statusLabels: Record<string, string> = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminApplicationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [filter, setFilter] = useState<ProfessionalApprovalStatus>("pending");
  const [applications, setApplications] = useState<ProfessionalApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<ProfessionalApplication[]>(
        "/professionals/admin/applications",
        { params: { status: filter } }
      );
      setApplications(response.data);
    } catch (err) {
      console.error("Could not load applications:", err);
      setError("Could not load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin) {
      if (!authLoading) setLoading(false);
      return;
    }

    void loadApplications();
  }, [authLoading, isAuthenticated, isAdmin, loadApplications]);

  const handleDecision = async (
    applicationId: string,
    decision: "approve" | "reject"
  ) => {
    setActionId(applicationId);
    setError("");

    try {
      await api.patch(
        `/professionals/admin/applications/${applicationId}/${decision}`
      );
      await loadApplications();
    } catch (err) {
      console.error(`Could not ${decision} application:`, err);
      setError(`Could not ${decision} this application. Please try again.`);
    } finally {
      setActionId(null);
    }
  };

  const handleToggleActive = async (
    applicationId: string,
    isCurrentlyActive: boolean
  ) => {
    setActionId(applicationId);
    setError("");

    const action = isCurrentlyActive ? "deactivate" : "reactivate";

    try {
      await api.patch(
        `/professionals/admin/applications/${applicationId}/${action}`
      );
      await loadApplications();
    } catch (err) {
      console.error(`Could not ${action} professional:`, err);
      setError(`Could not ${action} this professional. Please try again.`);
    } finally {
      setActionId(null);
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
        Please sign in with an administrator account to review applications.
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
        title="Professional Applications"
        description="Review and decide on applications from users who want to become professionals."
      />

      <Tabs
        ariaLabel="Application status filter"
        value={filter}
        onChange={(value) => setFilter(value as ProfessionalApprovalStatus)}
        items={FILTERS.map((item) => ({ value: item.value, label: item.label }))}
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title={`No ${filter} applications`}
          description="There is nothing to review in this category right now."
          icon="📝"
        />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">
                    {application.applicant_name || "Applicant"}
                  </h2>
                  {application.applicant_email && (
                    <p className="text-sm text-ink-500">
                      {application.applicant_email}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(application.approval_status)}>
                    {statusLabels[application.approval_status] ??
                      application.approval_status}
                  </Badge>

                  {application.approval_status === "approved" && (
                    <Badge
                      tone={
                        application.applicant_is_active === false
                          ? "danger"
                          : "success"
                      }
                    >
                      {application.applicant_is_active === false
                        ? "Deactivated"
                        : "Active"}
                    </Badge>
                  )}
                </div>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-400">Specialization</dt>
                  <dd className="font-medium text-ink-800">
                    {application.specialization}
                  </dd>
                </div>
                {application.qualification && (
                  <div>
                    <dt className="text-ink-400">Qualification</dt>
                    <dd className="font-medium text-ink-800">
                      {application.qualification}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-400">License</dt>
                  <dd className="font-medium text-ink-800">
                    {application.license_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Experience</dt>
                  <dd className="font-medium text-ink-800">
                    {application.years_experience} years
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Fee</dt>
                  <dd className="font-medium text-ink-800">
                    {application.consultation_fee}
                  </dd>
                </div>
              </dl>

              {application.bio && (
                <p className="text-sm leading-6 text-ink-600">{application.bio}</p>
              )}

              {application.approval_status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() =>
                      void handleDecision(application.id, "approve")
                    }
                    disabled={actionId === application.id}
                  >
                    {actionId === application.id ? "Working..." : "Approve"}
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void handleDecision(application.id, "reject")}
                    disabled={actionId === application.id}
                  >
                    {actionId === application.id ? "Working..." : "Reject"}
                  </Button>
                </div>
              )}

              {application.approval_status === "approved" && (
                <div className="flex flex-wrap gap-2">
                  {application.applicant_is_active === false ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() =>
                        void handleToggleActive(application.id, false)
                      }
                      disabled={actionId === application.id}
                    >
                      {actionId === application.id ? "Working..." : "Reactivate"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        void handleToggleActive(application.id, true)
                      }
                      disabled={actionId === application.id}
                    >
                      {actionId === application.id ? "Working..." : "Deactivate"}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
