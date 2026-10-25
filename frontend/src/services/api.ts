import axios from "axios";

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

// Attach auth token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Backward-compatible session hardening: when any authenticated request
// comes back 401 (expired/revoked token), drop the stale token and send
// the user to the login page with a friendly flag. Auth endpoints and the
// public auth-probe calls are excluded so login failures behave exactly
// as before.
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

    if (status === 401 && !AUTH_PATHS.some((path) => url.includes(path))) {
      const hadToken = Boolean(localStorage.getItem("access_token"));
      if (hadToken) {
        localStorage.removeItem("access_token");
        if (!window.location.pathname.startsWith("/login")) {
          window.location.assign("/login?expired=1");
        }
      }
    }

    return Promise.reject(error);
  }
);
