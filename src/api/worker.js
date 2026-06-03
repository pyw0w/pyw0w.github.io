import { config } from '../config';
async function get(path) {
    const res = await fetch(`${config.workerUrl}${path}`);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Worker ${path} -> ${res.status}`);
    }
    return res.json();
}
async function post(path, payload) {
    const res = await fetch(`${config.workerUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Worker ${path} -> ${res.status}`);
    }
    return res.json();
}
export const workerApi = {
    search(params) {
        const q = new URLSearchParams();
        if (params.title)
            q.set('title', params.title);
        if (params.id)
            q.set('id', params.id);
        q.set('id_type', params.idType ?? 'shikimori');
        return get(`/kodik/search?${q}`);
    },
    translations(id) {
        return get(`/kodik/translations?id=${encodeURIComponent(id)}`);
    },
    stream(params) {
        const q = new URLSearchParams({
            id: params.id,
            episode: String(params.episode),
            translation: params.translation,
        });
        return get(`/kodik/stream?${q}`);
    },
    exchangeOAuthCode(code) {
        return post('/auth/shikimori/token', { code });
    },
    refreshOAuth(refresh_token) {
        return post('/auth/shikimori/token', { refresh_token });
    },
};
