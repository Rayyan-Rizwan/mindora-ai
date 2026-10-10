import { useAuthContext } from "@/context/AuthContext";

/**
 * Thin wrapper hook so components import from hooks/, not context/ directly.
 * Add login/register API calls here once app/api/v1/auth.py exists on the backend.
 */
export function useAuth() {
  const { user, setUser, logout } = useAuthContext();
  return { user, setUser, logout, isAuthenticated: !!user };
}
