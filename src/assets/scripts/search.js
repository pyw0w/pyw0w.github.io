import { debounce, renderCards } from './utils.js';
import { searchAnime } from './api.js';

export function initSearch(inputId, gridId) {
  const input = document.getElementById(inputId);
  const grid = document.getElementById(gridId);
  if (!input || !grid) return;

  const doSearch = debounce(async (query) => {
    if (!query.trim()) return;
    try {
      const data = await searchAnime(query, { limit: 20 });
      renderCards(grid, data.results || []);
    } catch {
      grid.innerHTML = '<div class="empty-state">Не удалось загрузить результаты</div>';
    }
  }, 400);

  input.addEventListener('input', (e) => doSearch(e.target.value));
}
