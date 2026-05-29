export function initRouter() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    loadPage(window.location.pathname + window.location.search);
  });
}

export async function navigate(url) {
  history.pushState(null, '', url);
  await loadPage(url);
}

async function loadPage(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const main = document.querySelector('main');
    if (!main) { window.location.href = url; return; }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newMain = doc.querySelector('main');

    if (newMain) {
      main.innerHTML = newMain.innerHTML;
      document.title = doc.title;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    reinitPage();
  } catch {
    window.location.href = url;
  }
}

function reinitPage() {
  if (window.location.pathname.includes('catalog')) {
    import('./search.js').then(m => m.initSearch('searchInput', 'catalogGrid'));
  }
}
