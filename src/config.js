export const config = {
    workerUrl: import.meta.env.VITE_WORKER_URL ?? 'http://localhost:8787',
    shikimoriApiBase: 'https://shikimori.io',
    shikimoriAuthBase: import.meta.env.VITE_SHIKIMORI_AUTH_BASE ?? 'https://shikimori.io',
    shikimoriClientId: import.meta.env.VITE_SHIKIMORI_CLIENT_ID ?? '',
    oauthRedirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI ?? 'https://pyw0w.github.io/oauth/callback',
};
