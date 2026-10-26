import axios from "axios";
import {
  applyStoredAuthorizationHeader,
  getRequestAuthorization,
  shouldClearStoredSessionToken,
} from "./apiAuth";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (import.meta.env.PROD && !configuredApiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL is not configured. Production builds must target the deployed backend API."
  );
}

// Points to the FastAPI backend (see backend/app/main.py)
export const api = axios.create({
  baseURL:
    configuredApiBaseUrl ||
    (import.meta.env.DEV ? "http://localhost:8000/api/v1" : ""),
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "1",
  },
});

// Attach auth token automatically if present, unless the caller supplied
// an explicit Authorization header for a specific session.
api.interceptors.request.use((config) => {
  if (config.headers) {
    applyStoredAuthorizationHeader(
      config.headers,
      localStorage.getItem("access_token")
    );
  }
  return config;
});

// Backward-compatible session hardening: when an authenticated request comes
// back 401 because its own token expired or was revoked, drop that token and
// send the user to the login page. Auth endpoints are excluded so login
// failures behave exactly as before. A stale 401 from an older request must
// never clear a newer token that was stored by another tab.
const AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    const url = (error as { config?: { url?: string } })?.config?.url ?? "";

    if (!AUTH_PATHS.some((path) => url.includes(path))) {
      const storedToken = localStorage.getItem("access_token");

      if (
        shouldClearStoredSessionToken({
          status,
          requestAuthorization: getRequestAuthorization(error),
          storedToken,
        })
      ) {
        localStorage.removeItem("access_token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login?expired=1");
        }
      }
    }

    return Promise.reject(error);
  }
);
