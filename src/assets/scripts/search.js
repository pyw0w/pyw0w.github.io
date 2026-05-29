import { debounce, renderCards } from './utils.js';
import { searchAnime } from './api.js';

export function initSearch(inputId, gridId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const doSearch = debounce(async (query) => {
    if (!query.trim()) return;

    if (!gridId) {
      window.location.href = '/catalog.html?q=' + encodeURIComponent(query);
      return;
    }

    const grid = document.getElementById(gridId);
    if (!grid) return;

    try {
      const data = await searchAnime(query, { limit: 20 });
      renderCards(grid, data.results || []);
    } catch {
      grid.innerHTML = '<div class="empty-state">Не удалось загрузить результаты</div>';
    }
  }, 400);

  input.addEventListener('input', (e) => doSearch(e.target.value));
}
