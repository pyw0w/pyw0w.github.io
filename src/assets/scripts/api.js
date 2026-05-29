const PROXY_URL = '/api';

export async function fetchList(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${PROXY_URL}/list${query ? '?' + query : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

export async function searchAnime(query, params = {}) {
  const searchParams = new URLSearchParams({ q: query, ...params }).toString();
  const url = `${PROXY_URL}/search?${searchParams}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search error: ' + res.status);
  return res.json();
}

export async function getPlayer(id, translation, episode) {
  const params = new URLSearchParams({ id, translation, episode }).toString();
  const url = `${PROXY_URL}/player?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Player error: ' + res.status);
  return res.json();
}
