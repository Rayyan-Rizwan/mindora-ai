export interface AuthorizationHeaders {
  has(headerName: string): boolean;
  set(headerName: string, value: string): void;
}

interface RequestHeaderReader {
  get?: (headerName: string) => unknown;
  Authorization?: unknown;
  authorization?: unknown;
}

interface SessionClearDecision {
  status: number | undefined;
  requestAuthorization: string | null;
  storedToken: string | null;
}

/*
 * An explicit Authorization header binds a request to a specific verified
 * session. Only fall back to the token currently in localStorage when the
 * caller did not choose one.
 */
export function applyStoredAuthorizationHeader(
  headers: AuthorizationHeaders,
  storedToken: string | null
): void {
  if (storedToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${storedToken}`);
  }
}

export function getRequestAuthorization(error: unknown): string | null {
  const headers = (error as { config?: { headers?: RequestHeaderReader } })
    ?.config?.headers;

  if (!headers) return null;

  const value =
    typeof headers.get === "function"
      ? headers.get("Authorization") ??
        headers.Authorization ??
        headers.authorization
      : headers.Authorization ?? headers.authorization;

  return typeof value === "string" && value.length > 0 ? value : null;
}

/*
 * A 401 only proves that the token used for THAT request is invalid. If the
 * stored token has since been replaced (for example by a login in another
 * tab), the newer session must survive the stale response.
 */
export function shouldClearStoredSessionToken({
  status,
  requestAuthorization,
  storedToken,
}: SessionClearDecision): boolean {
  if (status !== 401 || !storedToken) return false;
  return requestAuthorization === `Bearer ${storedToken}`;
}
