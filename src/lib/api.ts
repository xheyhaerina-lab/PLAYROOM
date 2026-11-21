// In-memory session token store (never stored in localStorage/sessionStorage for security)
let memoryAuthToken: string | null = null;

export function setApiToken(token: string | null): void {
  memoryAuthToken = token;
}

export function getApiToken(): string | null {
  return memoryAuthToken;
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryAuthToken) {
    headers.set('Authorization', `Bearer ${memoryAuthToken}`);
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(
      String(payload.message || payload.error || `HTTP ${response.status}`),
      response.status,
      payload
    );
  }

  return payload as T;
}
