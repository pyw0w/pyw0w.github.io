import { describe, it, expect, beforeEach } from 'vitest';
import { buildAuthorizeUrl, saveTokens, loadTokens, isExpired, clearTokens } from '../src/auth/oauth';

beforeEach(() => localStorage.clear());

describe('buildAuthorizeUrl', () => {
  it('contains client_id, redirect_uri, response_type=code', () => {
    const url = buildAuthorizeUrl();
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('/oauth/authorize');
  });
});

describe('token storage', () => {
  it('saves and loads tokens with computed expiry', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 100 });
    const t = loadTokens()!;
    expect(t.access_token).toBe('a');
    expect(t.expires_at).toBeGreaterThan(Date.now());
  });

  it('isExpired true when past expiry', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: -10 });
    expect(isExpired(loadTokens()!)).toBe(true);
  });

  it('clearTokens removes them', () => {
    saveTokens({ access_token: 'a', refresh_token: 'r', expires_in: 100 });
    clearTokens();
    expect(loadTokens()).toBeNull();
  });
});
