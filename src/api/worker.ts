import { config } from '../config';
import type { StreamResult } from './types';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.workerUrl}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Worker ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${config.workerUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Worker ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const workerApi = {
  search(params: { title?: string; id?: string; idType?: string }) {
    const q = new URLSearchParams();
    if (params.title) q.set('title', params.title);
    if (params.id) q.set('id', params.id);
    q.set('id_type', params.idType ?? 'shikimori');
    return get<unknown>(`/kodik/search?${q}`);
  },
  translations(id: string) {
    return get<unknown>(`/kodik/translations?id=${encodeURIComponent(id)}`);
  },
  stream(params: { id: string; episode: number; translation: string }) {
    const q = new URLSearchParams({
      id: params.id,
      episode: String(params.episode),
      translation: params.translation,
    });
    return get<StreamResult>(`/kodik/stream?${q}`);
  },
  exchangeOAuthCode(code: string) {
    return post<{ access_token: string; refresh_token: string; expires_in: number }>(
      '/auth/shikimori/token', { code });
  },
  refreshOAuth(refresh_token: string) {
    return post<{ access_token: string; refresh_token: string; expires_in: number }>(
      '/auth/shikimori/token', { refresh_token });
  },
};
