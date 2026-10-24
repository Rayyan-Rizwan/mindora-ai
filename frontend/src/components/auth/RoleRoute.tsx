import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import { Spinner } from "@/components/ui";
import { roleHomePath } from "@/utils";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

/**
 * Client-side route guard used as a layout route. This is a convenience for
 * rendering only -- the backend remains the authority on roles/access and
 * enforces authorization on every protected endpoint (see
 * app/api/v1/deps.require_role).
 */
export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center gap-2 py-24 text-sm text-ink-500">
        <Spinner className="text-brand-500" />
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Keep each role inside its own portal instead of exposing a protected
    // page or a dead-end. The backend still rejects unauthorized API calls.
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <Outlet />;
}
