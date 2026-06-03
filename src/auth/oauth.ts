import { config } from '../config';
import { workerApi } from '../api/worker';

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const KEY = 'shikimori_tokens';
const SKEW_MS = 60_000;

export function buildAuthorizeUrl(): string {
  const q = new URLSearchParams({
    client_id: config.shikimoriClientId,
    redirect_uri: config.oauthRedirectUri,
    response_type: 'code',
    scope: 'user_rates',
  });
  return `${config.shikimoriAuthBase}/oauth/authorize?${q}`;
}

export function saveTokens(t: { access_token: string; refresh_token: string; expires_in: number }): void {
  const stored: StoredTokens = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: Date.now() + t.expires_in * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export function loadTokens(): StoredTokens | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

export function clearTokens(): void {
  localStorage.removeItem(KEY);
}

export function isExpired(t: StoredTokens): boolean {
  return Date.now() >= t.expires_at - SKEW_MS;
}

export async function ensureAccessToken(): Promise<string | null> {
  const t = loadTokens();
  if (!t) return null;
  if (!isExpired(t)) return t.access_token;
  const refreshed = await workerApi.refreshOAuth(t.refresh_token);
  saveTokens(refreshed);
  return refreshed.access_token;
}
