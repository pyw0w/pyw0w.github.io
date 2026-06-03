import { config } from '../config';
const GRAPHQL_URL = `${config.shikimoriApiBase}/api/graphql`;
async function graphql(query, variables, token) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = (await res.json());
    if (json.errors?.length)
        throw new Error(json.errors[0].message);
    if (!json.data)
        throw new Error('Empty GraphQL response');
    return json.data;
}
async function userRates(token, params) {
    const q = new URLSearchParams(Object.entries(params).reduce((a, [k, v]) => {
        if (v !== undefined)
            a[k] = String(v);
        return a;
    }, {}));
    const res = await fetch(`${config.shikimoriApiBase}/api/v2/user_rates?${q}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok)
        throw new Error(`user_rates -> ${res.status}`);
    return res.json();
}
async function whoami(token) {
    const res = await fetch(`${config.shikimoriApiBase}/api/users/whoami`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok)
        throw new Error('whoami failed');
    return res.json();
}
export const shikimori = { graphql, userRates, whoami };
