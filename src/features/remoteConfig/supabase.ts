import { env } from '../../config/env';
import type { ConfigRow } from './schema';

/**
 * Minimal Supabase client over fetch: read the config table, sign in, save rows.
 * It uses only the public URL and anon key. Who may write is decided by the database
 * rules in supabase/setup.sql, never by this app.
 */
const TABLE = 'app_config';
const TIMEOUT_MS = 8000;

export const isConfigured = env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; reason: 'network' | 'denied' | 'invalid' };

async function request(path: string, init: RequestInit & { token?: string }): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${env.supabaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: env.supabaseAnonKey,
        'Content-Type': 'application/json',
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : null),
        ...init.headers,
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRows(): Promise<ApiResult<ConfigRow[]>> {
  const res = await request(`/rest/v1/${TABLE}?select=key,value`, { method: 'GET' });
  if (!res || !res.ok) {
    return { ok: false, reason: 'network' };
  }
  const rows: unknown = await res.json().catch(() => null);
  return Array.isArray(rows) ? { ok: true, data: rows as ConfigRow[] } : { ok: false, reason: 'invalid' };
}

/** Email and password sign-in. Returns a short-lived access token, kept in memory only. */
export async function signIn(email: string, password: string): Promise<ApiResult<string>> {
  const res = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (!res) {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) {
    return { ok: false, reason: 'denied' };
  }
  const body = (await res.json().catch(() => null)) as { access_token?: unknown } | null;
  return typeof body?.access_token === 'string'
    ? { ok: true, data: body.access_token }
    : { ok: false, reason: 'invalid' };
}

/** Saves rows. The database rejects it unless the signed-in user is listed as an admin. */
export async function saveRows(token: string, rows: readonly ConfigRow[]): Promise<ApiResult<null>> {
  const res = await request(`/rest/v1/${TABLE}?on_conflict=key`, {
    method: 'POST',
    token,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res) {
    return { ok: false, reason: 'network' };
  }
  return res.ok ? { ok: true, data: null } : { ok: false, reason: 'denied' };
}
