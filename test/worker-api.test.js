import { describe, it, expect, vi, afterEach } from 'vitest';
import { workerApi } from '../src/api/worker';
afterEach(() => { vi.unstubAllGlobals(); });
describe('workerApi.stream', () => {
    it('calls /kodik/stream with query params', async () => {
        let url = '';
        vi.stubGlobal('fetch', vi.fn(async (u) => {
            url = u;
            return new Response(JSON.stringify({ manifest: 'm.m3u8', qualities: [480, 720] }), { status: 200 });
        }));
        const res = await workerApi.stream({ id: '20', episode: 2, translation: '610' });
        expect(url).toContain('/kodik/stream');
        expect(url).toContain('id=20');
        expect(url).toContain('episode=2');
        expect(url).toContain('translation=610');
        expect(res.qualities).toEqual([480, 720]);
    });
    it('throws on non-ok with server message', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'extract_failed', message: 'boom' }), { status: 502 })));
        await expect(workerApi.stream({ id: 'x', episode: 1, translation: '0' }))
            .rejects.toThrow('boom');
    });
});
