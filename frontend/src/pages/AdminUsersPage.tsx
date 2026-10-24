import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import type { User, UserRole } from "@/types";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
  type BadgeTone,
} from "@/components/ui";

const roleTone: Record<UserRole, BadgeTone> = {
  user: "neutral",
  professional: "info",
  admin: "brand",
};

// Mirrors ALLOWED_ROLE_TRANSITIONS on the backend
// (backend/app/services/admin_role_service.py). The server enforces the
// same rules; this list only decides which select options are shown.
const ALLOWED_ROLE_CHANGES: Record<UserRole, UserRole[]> = {
  user: ["admin"],
  professional: ["admin"],
  admin: ["user"],
};

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<User[]>("/users/");
      setUsers(response.data);
    } catch (err) {
      console.error("Could not load users:", err);
      setError("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) setLoading(false);
      return;
    }

    void loadUsers();
  }, [authLoading, isAuthenticated, loadUsers]);

  const applyUpdate = async (
    userId: string,
    payload: { is_active?: boolean; is_verified?: boolean },
    failureMessage: string
  ) => {
    setActionId(userId);
    setError("");

    try {
      const response = await api.patch<User>(`/users/${userId}`, payload);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? response.data : item))
      );
    } catch (err) {
      console.error(failureMessage, err);
      setError(failureMessage);
    } finally {
      setActionId(null);
    }
  };

  const changeRole = async (userId: string, role: UserRole) => {
    setActionId(userId);
    setError("");

    try {
      const response = await api.patch<User>(`/users/${userId}/role`, {
        role,
      });
      setUsers((current) =>
        current.map((item) => (item.id === userId ? response.data : item))
      );
    } catch (err) {
      console.error("Could not change role:", err);
      const detail = (err as { response?: { data?: { detail?: unknown } } })
        ?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Could not change this role. Please try again."
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="View accounts and activate, deactivate, or verify them."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
          <Spinner size="sm" className="text-brand-500" />
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="There are no user accounts to show."
          icon="👥"
        />
      ) : (
        <div className="space-y-4">
          {users.map((item) => {
            const isActive = item.is_active !== false;
            const isSelf = item.id === currentUser?.id;
            const busy = actionId === item.id;
            const protectedAccount = item.is_protected === true;
            const roleOptions = ALLOWED_ROLE_CHANGES[item.role] ?? [];
            const canChangeRole = !isSelf && !protectedAccount && !busy;

            return (
              <Card key={item.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.full_name} />

                    <div>
                      <h2 className="text-lg font-semibold text-ink-900">
                        {item.full_name}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-ink-400">
                            (you)
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-ink-500">{item.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={roleTone[item.role]}>{item.role}</Badge>

                    <Badge tone={isActive ? "success" : "danger"}>
                      {isActive ? "Active" : "Deactivated"}
                    </Badge>

                    <Badge tone={item.is_verified ? "success" : "warning"}>
                      {item.is_verified ? "Verified" : "Unverified"}
                    </Badge>

                    {protectedAccount && (
                      <Badge tone="info" title="Super-admin account cannot be role-changed or deactivated.">
                        Protected
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!item.is_verified && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void applyUpdate(
                          item.id,
                          { is_verified: true },
                          "Could not verify this user. Please try again."
                        )
                      }
                      disabled={busy}
                    >
                      {busy ? "Working..." : "Verify"}
                    </Button>
                  )}

                  {isActive ? (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        void applyUpdate(
                          item.id,
                          { is_active: false },
                          "Could not deactivate this user. Please try again."
                        )
                      }
                      disabled={busy || isSelf || protectedAccount}
                      title={
                        protectedAccount
                          ? "The protected super-admin cannot be deactivated."
                          : isSelf
                          ? "You cannot deactivate your own account"
                          : undefined
                      }
                    >
                      {busy ? "Working..." : "Deactivate"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() =>
                        void applyUpdate(
                          item.id,
                          { is_active: true },
                          "Could not reactivate this user. Please try again."
                        )
                      }
                      disabled={busy}
                    >
                      {busy ? "Working..." : "Reactivate"}
                    </Button>
                  )}

                  {roleOptions.length > 0 && (
                    <div className="ml-auto flex items-center gap-2">
                      <label
                        htmlFor={`role-change-${item.id}`}
                        className="text-xs font-medium text-ink-400"
                      >
                        Change role
                      </label>
                      <Select
                        id={`role-change-${item.id}`}
                        value=""
                        aria-label={`Change role for ${item.full_name}`}
                        className="w-40 py-2"
                        disabled={!canChangeRole}
                        title={
                          protectedAccount
                            ? "The protected super-admin cannot be role-changed."
                            : isSelf
                            ? "You cannot change your own role"
                            : busy
                            ? "Another action is in progress"
                            : undefined
                        }
                        onChange={(event) => {
                          const next = event.target.value as UserRole;
                          if (next) void changeRole(item.id, next);
                        }}
                      >
                        <option value="">
                          {busy
                            ? "Working..."
                            : protectedAccount
                            ? "Protected"
                            : isSelf
                            ? "Own account"
                            : "Select role..."}
                        </option>
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            Set as {role}
                          </option>
                        ))}
                      </Select>
                    </div>
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
