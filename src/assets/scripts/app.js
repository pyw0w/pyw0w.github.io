import { initTheme } from './theme.js';
import { initRouter } from './router.js';
import { initSearch } from './search.js';
import { fetchList } from './api.js';
import { renderCards, showLoader, getFromStorage, addToArrayStorage, removeFromArrayStorage } from './utils.js';

export async function initPage() {
  initTheme();

  const isCatalog = window.location.pathname.includes('catalog');
  const isAnime = window.location.pathname.includes('anime');
  const isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';

  if (isHome) {
    await loadHomePage();
  }

  if (isCatalog) {
    initSearch('searchInput', 'catalogGrid');
    await loadCatalog();
  } else if (isHome || isAnime) {
    initSearch('searchInput', null);
  }

  if (isAnime) {
    await loadAnimeDetail();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initPage();
  initRouter();
});

async function loadHomePage() {
  const popularGrid = document.getElementById('popularGrid');
  const recentGrid = document.getElementById('recentGrid');

  showLoader(popularGrid);
  showLoader(recentGrid);

  try {
    const data = await fetchList({ limit: 12, sort: 'views', order: 'desc' });
    renderCards(popularGrid, data.results?.slice(0, 6) || []);
    renderCards(recentGrid, data.results?.slice(6, 12) || []);
  } catch {
    popularGrid.innerHTML = '<div class="empty-state">Не удалось загрузить данные</div>';
    recentGrid.innerHTML = '';
  }
}

async function loadCatalog() {
  const grid = document.getElementById('catalogGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid) return;

  let page = 1;
  const limit = 20;
  let allResults = [];

  const fetchPage = async () => {
    showLoader(grid);
    try {
      const data = await fetchList({ limit, page, sort: 'year', order: 'desc' });
      allResults = [...allResults, ...(data.results || [])];
      renderCards(grid, allResults);
      if (data.results?.length < limit) {
        loadMoreBtn.style.display = 'none';
      }
    } catch {
      grid.innerHTML = '<div class="empty-state">Не удалось загрузить каталог</div>';
    }
  };

  await fetchPage();

  loadMoreBtn?.addEventListener('click', async () => {
    page++;
    await fetchPage();
  });
}

async function loadAnimeDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('animeDetail');
  if (!id || !container) return;

  try {
    const data = await fetchList({ id });
    const anime = data.results?.[0];
    if (!anime) { container.innerHTML = '<div class="empty-state">Аниме не найдено</div>'; return; }

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-poster">
          <img src="${anime.screenshots?.[0] || ''}" alt="${anime.title}" style="width:100%;border-radius:var(--radius-md)" onerror="this.style.display='none'" />
        </div>
        <div class="detail-info">
          <h1 class="detail-title">${anime.title}</h1>
          <div class="detail-meta">
            <span>${anime.year || ''}</span>
            ${anime.type ? '<span>' + anime.type + '</span>' : ''}
            ${anime.episodes_count ? '<span>' + anime.episodes_count + ' эп.</span>' : ''}
            ${anime.rating ? '<span>★ ' + anime.rating + '</span>' : ''}
          </div>
          <div class="detail-tags">
            ${(anime.genres || []).map(g => '<span class="tag">' + g + '</span>').join('')}
          </div>
          ${anime.description ? '<p class="detail-description">' + anime.description + '</p>' : ''}
          <button class="btn btn-primary" id="favBtn">
            ${getFromStorage('favorites', []).find(f => f.id === anime.id) ? '✓ В избранном' : '★ В избранное'}
          </button>
        </div>
      </div>
    `;

    const favBtn = document.getElementById('favBtn');
    favBtn?.addEventListener('click', () => {
      const favs = getFromStorage('favorites', []);
      const exists = favs.find(f => f.id === anime.id);
      if (exists) {
        removeFromArrayStorage('favorites', anime.id);
        favBtn.textContent = '★ В избранное';
      } else {
        addToArrayStorage('favorites', { id: anime.id, title: anime.title, year: anime.year, poster: anime.screenshots?.[0] });
        favBtn.textContent = '✓ В избранном';
      }
    });
  } catch {
    container.innerHTML = '<div class="empty-state">Не удалось загрузить информацию об аниме</div>';
  }
}
