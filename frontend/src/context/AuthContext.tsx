import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/services/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Only "busy" if a token exists that we still need to resolve.
  const [loading, setLoading] = useState<boolean>(() =>
    Boolean(localStorage.getItem("access_token"))
  );

  const logout = () => {
    const token = localStorage.getItem("access_token");

    if (token) {
      // Best-effort server-side revocation of this specific JWT so it can
      // no longer be used (see POST /api/v1/auth/logout).
      // The Authorization header is passed explicitly because we clear the
      // token from localStorage right away and cannot rely on the request
      // interceptor. Failure is ignored (e.g. token already expired or the
      // backend is unreachable): local logout always proceeds.
      void api
        .post("/auth/logout", null, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => undefined);
    }

    localStorage.removeItem("access_token");
    setUser(null);
  };

  // The auth token is the source of truth; reload the current user from the
  // backend so role-based UI stays correct after a page refresh. The backend
  // remains the authority on roles/access -- this is only for rendering.
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response = await api.get<User>("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Another tab may have replaced the token while this probe was in
        // flight; do not apply an identity that no longer matches storage.
        if (!cancelled && localStorage.getItem("access_token") === token) {
          setUser(response.data);
        }
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;

        if (status === 401) {
          // Expired or invalid token: drop it so the app falls back to the
          // logged-out state. Only remove the exact token this request used;
          // a newer cross-tab login may already have replaced it.
          if (localStorage.getItem("access_token") === token) {
            localStorage.removeItem("access_token");
          }
          if (!cancelled) setUser(null);
        } else {
          console.error("Could not load current user:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
