import { describe, it, expect, vi, afterEach } from 'vitest';
import { shikimori } from '../src/api/shikimori';

afterEach(() => { vi.unstubAllGlobals(); });

describe('shikimori.fetchAnimes', () => {
  it('sends params and returns mapped data', async () => {
    let url = '';
    vi.stubGlobal('fetch', vi.fn(async (u: string) => {
      url = u;
      return new Response(JSON.stringify([{ id: 52991, name: 'X', episodesAired: 27 }]), { status: 200 });
    }));
    const data = await shikimori.fetchAnimes({ order: 'ranked', limit: '30', kind: 'tv' });
    expect(url).toContain('order=ranked');
    expect(data[0].id).toBe(52991);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'bad' }), { status: 502 })));
    await expect(shikimori.fetchAnimes({})).rejects.toThrow('bad');
  });
});

describe('shikimori.userRates', () => {
  it('sends bearer token', async () => {
    let auth = '';
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => {
      auth = init.headers.Authorization;
      return new Response(JSON.stringify([]), { status: 200 });
    }));
    await shikimori.userRates('tok123', { user_id: 5, status: 'watching' });
    expect(auth).toBe('Bearer tok123');
  });
});
