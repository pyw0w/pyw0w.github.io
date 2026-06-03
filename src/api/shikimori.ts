import { config } from '../config';
import type { ShikimoriAnime } from './types';

const SHIKIMORI_PROXY = `${config.workerUrl}/shikimori`;

async function fetchAnimes(params: Record<string, string>): Promise<ShikimoriAnime[]> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${SHIKIMORI_PROXY}/animes?${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `animes -> ${res.status}`);
  }
  return res.json() as Promise<ShikimoriAnime[]>;
}

async function userRates(
  token: string,
  params: { user_id: number; status?: string; limit?: number; page?: number },
): Promise<unknown[]> {
  const q = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((a, [k, v]) => {
      if (v !== undefined) a[k] = String(v);
      return a;
    }, {}),
  );
  const res = await fetch(`${SHIKIMORI_PROXY}/user_rates?${q}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`user_rates -> ${res.status}`);
  return res.json() as Promise<unknown[]>;
}

async function whoami(token: string): Promise<{ id: number; nickname: string }> {
  const res = await fetch(`${SHIKIMORI_PROXY}/whoami`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('whoami failed');
  return res.json() as Promise<{ id: number; nickname: string }>;
}

export const shikimori = { fetchAnimes, userRates, whoami };
