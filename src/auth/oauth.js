import { config } from '../config';
import { workerApi } from '../api/worker';
const KEY = 'shikimori_tokens';
const SKEW_MS = 60_000;
export function buildAuthorizeUrl() {
    const q = new URLSearchParams({
        client_id: config.shikimoriClientId,
        redirect_uri: config.oauthRedirectUri,
        response_type: 'code',
        scope: 'user_rates',
    });
    return `${config.shikimoriAuthBase}/oauth/authorize?${q}`;
}
export function saveTokens(t) {
    const stored = {
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_at: Date.now() + t.expires_in * 1000,
    };
    localStorage.setItem(KEY, JSON.stringify(stored));
}
export function loadTokens() {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
}
export function clearTokens() {
    localStorage.removeItem(KEY);
}
export function isExpired(t) {
    return Date.now() >= t.expires_at - SKEW_MS;
}
export async function ensureAccessToken() {
    const t = loadTokens();
    if (!t)
        return null;
    if (!isExpired(t))
        return t.access_token;
    const refreshed = await workerApi.refreshOAuth(t.refresh_token);
    saveTokens(refreshed);
    return refreshed.access_token;
}
