import { describe, it, expect, vi, afterEach } from 'vitest';
import { shikimori } from '../src/api/shikimori';

afterEach(() => { vi.unstubAllGlobals(); });

describe('shikimori.graphql', () => {
  it('posts a query and returns data', async () => {
    let body = '';
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => {
      body = String(init.body);
      return new Response(JSON.stringify({ data: { animes: [{ id: '1', name: 'X' }] } }), { status: 200 });
    }));
    const data = await shikimori.graphql<{ animes: any[] }>('query{animes{id}}');
    expect(body).toContain('animes');
    expect(data.animes[0].id).toBe('1');
  });

  it('throws on graphql errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ errors: [{ message: 'bad' }] }), { status: 200 })));
    await expect(shikimori.graphql('query{}')).rejects.toThrow('bad');
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
