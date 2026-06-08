const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'lushops_token';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  form?: Record<string, string>;
  query?: Record<string, string | undefined>;
}

/** Typed fetch wrapper: attaches the bearer token and unwraps the error envelope. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (opts.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(opts.form).toString();
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(opts.body);
  }

  const query = opts.query
    ? '?' +
      new URLSearchParams(
        Object.entries(opts.query).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString()
    : '';

  const res = await fetch(`${BASE_URL}${path}${query}`, { method: opts.method ?? 'GET', headers, body: payload });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const error = data?.error ?? {};
    throw {
      status: res.status,
      code: error.code ?? 'ERROR',
      message: error.message ?? res.statusText,
      details: error.details,
    } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
