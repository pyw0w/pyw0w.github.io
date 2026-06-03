import { describe, it, expect } from 'vitest';
import { config } from '../src/config';
describe('config', () => {
    it('exposes worker + shikimori settings', () => {
        expect(config.workerUrl).toBeTypeOf('string');
        expect(config.shikimoriAuthBase).toContain('shikimori');
        expect(config.oauthRedirectUri).toContain('/oauth/callback');
    });
});
