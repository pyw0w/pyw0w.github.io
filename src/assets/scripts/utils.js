export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function getFromStorage(key, fallback = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function addToArrayStorage(key, item) {
  const arr = getFromStorage(key, []);
  if (!arr.find(i => i.id === item.id)) {
    arr.push(item);
    setToStorage(key, arr);
  }
  return arr;
}

export function removeFromArrayStorage(key, id) {
  const arr = getFromStorage(key, []);
  const filtered = arr.filter(i => i.id !== id);
  setToStorage(key, filtered);
  return filtered;
}

export function createCard(anime) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img class="card-poster" src="${anime.screenshots?.[0] || ''}" alt="${anime.title}" loading="lazy" onerror="this.style.display='none'" />
    <div class="card-body">
      <div class="card-title">${anime.title}</div>
      <div class="card-meta">${anime.year || ''}${anime.type ? ' • ' + anime.type : ''}</div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/anime.html?id=${anime.id}`;
  });
  return card;
}

export function renderCards(container, items) {
  container.innerHTML = '';
  items.forEach(item => container.appendChild(createCard(item)));
}

export function showLoader(container) {
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'card';
    skeleton.innerHTML = `
      <div class="card-poster skeleton"></div>
      <div class="card-body">
        <div class="skeleton" style="height:14px;width:70%;margin-bottom:4px"></div>
        <div class="skeleton" style="height:10px;width:40%"></div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}
