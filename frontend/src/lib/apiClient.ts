import { getApiBaseUrl } from '@/lib/config';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
}

export async function apiRequest<T>(
  path: string,
  opts?: {
    method?: string;
    body?: unknown;
    token?: string | null;
    headers?: Record<string, string>;
  }
): Promise<{ ok: true; data: T } | { ok: false; status: number; detail: string }> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return { ok: false, status: 0, detail: 'API is not configured (missing VITE_API_URL).' };
  }

  const method = opts?.method ?? 'GET';
  const token = opts?.token ?? getAuthToken();

  const headers: Record<string, string> = {
    ...(opts?.headers ?? {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts?.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      headers,
      body: opts?.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    return { ok: false, status: 0, detail: 'Network error.' };
  }

  if (!response.ok) {
    let detail = `Request failed (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore
    }
    return { ok: false, status: response.status, detail };
  }

  try {
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, status: response.status, detail: 'Invalid JSON response.' };
  }
}
