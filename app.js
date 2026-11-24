
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let allGames = [];
let allWebsites = [];
let activeCategory = 'All';
let activePage = 'home';
let visibleCount = 60;

let favorites = new Set(
  JSON.parse(localStorage.getItem('arcade-favorites') || '[]')
);

let recent = JSON.parse(
  localStorage.getItem('arcade-recent') || '[]'
);

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const fileUrl = (file) => encodeURI('./' + file);

// IMAGE FALLBACKS
document.addEventListener('error', event => {
  const img = event.target;

  if (
    img instanceof HTMLImageElement &&
    img.dataset.fallback &&
    !img.dataset.fallbackApplied
  ) {
    img.dataset.fallbackApplied = 'true';
    img.src = img.dataset.fallback;
  }
}, true);


// WEBSITE VIEWER
function createWebsiteViewer() {
  const grid = $('#website-grid');

  if (!grid || $('#website-viewer')) return;

  grid.insertAdjacentHTML('afterend', `
    <section id="website-viewer" class="website-viewer hidden">
      <div class="website-viewer-bar">
        <button id="website-back" class="secondary-button">
          ← Back to websites
        </button>

        <strong id="website-viewer-title">Website</strong>

        <div class="website-viewer-controls">
          <button id="website-reload" title="Reload">↻</button>
          <button id="website-fullscreen" title="Fullscreen">⛶</button>
        </div>
      </div>

      <iframe
        id="website-frame"
        title="Website viewer"
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        allowfullscreen>
      </iframe>

      <div class="website-viewer-notice">
        Some websites block embedded viewing and may not load here.
      </div>
    </section>
  `);

  $('#website-back').addEventListener('click', closeWebsite);

  $('#website-reload').addEventListener('click', () => {
    const frame = $('#website-frame');
    if (frame.src) frame.src = frame.src;
  });

  $('#website-fullscreen').addEventListener('click', () => {
    const frame = $('#website-frame');
    if (frame.requestFullscreen) frame.requestFullscreen();
  });
}


function renderWebsites() {
  const grid = $('#website-grid');
  if (!grid) return;

  createWebsiteViewer();

  grid.innerHTML = allWebsites.map((site, index) => `
    <a
      class="website-card"
      href="${escapeHtml(site.url)}"
      data-site-index="${index}"
      aria-label="Open ${escapeHtml(site.name)}">

      <div class="website-image-wrap">
        <img
          class="website-image"
          src="${escapeHtml(site.image)}"
          data-fallback="${escapeHtml(site.fallback || 'assets/sites/' + site.key + '.svg')}"
          alt="${escapeHtml(site.name)} icon"
          loading="lazy">
      </div>

      <div class="website-info">
        <h3>${escapeHtml(site.name)}</h3>
        <p>${escapeHtml(site.description)}</p>
        <span class="website-open">OPEN SITE <b>↗</b></span>
      </div>
    </a>
  `).join('');
}


function openWebsite(site) {
  try {
    const url = new URL(site.url);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      alert('This website address is not supported.');
      return;
    }

    createWebsiteViewer();

    $('#website-viewer-title').textContent = site.name;
    $('#website-frame').src = url.href;

    $('#website-grid').classList.add('hidden');
    $('#website-viewer').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    alert('This website has an invalid address.');
  }
}


function closeWebsite() {
  const frame = $('#website-frame');
  const viewer = $('#website-viewer');
  const grid = $('#website-grid');

  if (frame) frame.src = 'about:blank';
  if (viewer) viewer.classList.add('hidden');
  if (grid) grid.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


async function loadWebsites() {
  const grid = $('#website-grid');

  try {
    const response = await fetch('./websites.json');

    if (!response.ok) {
      throw new Error('Could not load websites.json');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Website data must be a JSON array');
    }

    allWebsites = data.filter(site =>
      site &&
      typeof site.name === 'string' &&
      typeof site.url === 'string' &&
      typeof site.image === 'string'
    );

    if (activePage === 'websites') {
      renderWebsites();
    }

  } catch (error) {
    console.error('Website loading error:', error);

    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          Could not load websites. Check that websites.json contains valid JSON.
        </div>
      `;
    }
  }
}


// GAME CARDS
function gameCard(g) {
  const saved = favorites.has(g.file);
  const playable = g.playable !== false;

  return `
    <article
      class="game-card"
      data-file="${escapeHtml(g.file)}"
      ${playable ? 'tabindex="0"' : 'aria-disabled="true"'}
      title="${playable ? 'Play ' + escapeHtml(g.title) : 'Flash file — not supported in modern browsers'}">

      <img
        class="card-image"
        src="${escapeHtml(g.image)}"
        data-fallback="${escapeHtml(g.fallback || g.image)}"
        alt="${escapeHtml(g.title)} cover"
        loading="lazy">

      <button
        class="favorite-toggle ${saved ? 'saved' : ''}"
        data-favorite="${escapeHtml(g.file)}"
        aria-label="${saved ? 'Remove from favorites' : 'Add to favorites'}">
        ${saved ? '★' : '☆'}
      </button>

      <div class="card-info">
        <h3 class="card-title">${escapeHtml(g.title)}</h3>
        <div class="card-meta">
          <span>${escapeHtml(g.category)}</span>
          <span class="category-pill">${playable ? 'PLAY' : 'FLASH'}</span>
        </div>
      </div>
    </article>
  `;
}


function saveFavorites() {
  localStorage.setItem(
    'arcade-favorites',
    JSON.stringify([...favorites])
  );

  $('#favorite-count').textContent = favorites.size;
}


function setPage(page) {
  const target = document.getElementById(`${page}-page`);

  if (!target) {
    console.error('Page not found:', page);
    return;
  }

  activePage = page;

  $$('.page').forEach(section => {
    section.classList.toggle('active', section === target);
  });

  $$('.nav-link').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.page === page
    );
  });

  if (page === 'favorites') renderFavorites();
  if (page === 'websites') renderWebsites();
  if (page === 'games') renderGames();

  if (page !== 'websites') closeWebsite();

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const nav = $('.main-nav');
  if (nav) nav.classList.remove('open');
}


// GAME PLAYER
function openGame(g) {
  if (g.playable === false) {
    alert('This is an older Flash file. Modern browsers no longer run Flash games.');
    return;
  }

  $('#player-name').textContent = g.title;
  $('#game-frame').src = fileUrl(g.file);
  $('#player').classList.remove('hidden');

  document.body.style.overflow = 'hidden';

  recent = [
    g.file,
    ...recent.filter(x => x !== g.file)
  ].slice(0, 12);

  localStorage.setItem('arcade-recent', JSON.stringify(recent));
  renderRecent();
}


function closeGame() {
  $('#player').classList.add('hidden');
  $('#game-frame').src = 'about:blank';
  document.body.style.overflow = '';
}


// GAME CARD EVENTS
function bindCards(root) {
  root.querySelectorAll('.game-card').forEach(card => {
    const g = allGames.find(x => x.file === card.dataset.file);

    card.addEventListener('click', event => {
      if (event.target.closest('.favorite-toggle')) return;
      if (g) openGame(g);
    });

    card.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && g) {
        event.preventDefault();
        openGame(g);
      }
    });
  });

  root.querySelectorAll('.favorite-toggle').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();

      const file = button.dataset.favorite;

      if (favorites.has(file)) {
        favorites.delete(file);
      } else {
        favorites.add(file);
      }

      saveFavorites();

      const saved = favorites.has(file);

      button.classList.toggle('saved', saved);
      button.textContent = saved ? '★' : '☆';

      button.setAttribute(
        'aria-label',
        saved ? 'Remove from favorites' : 'Add to favorites'
      );

      if (activePage === 'favorites') renderFavorites();
    });
  });

  root.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      if (img.src !== new URL(img.dataset.fallback, location.href).href) {
        img.src = img.dataset.fallback;
      }
    }, { once: true });
  });
}


function renderRecent() {
  const items = recent
    .map(file => allGames.find(g => g.file === file))
    .filter(Boolean)
    .slice(0, 4);

  $('#recent-grid').innerHTML = items.length
    ? items.map(gameCard).join('')
    : '<div class="empty-state">Play a game and it will show up here.</div>';

  bindCards($('#recent-grid'));
}


function renderFeatured() {
  const preferred = [
    'geometrydashlite.html',
    'clEaglercraftX188(u29).html',
    'clusterrush.html',
    'clbasketbros.html',
    'clgdsubzero.html'
  ];

  let items = preferred
    .map(file => allGames.find(g => g.file === file))
    .filter(Boolean);

  if (items.length < 5) {
    items = items.concat(
      allGames.filter(g => !items.includes(g)).slice(0, 5 - items.length)
    );
  }

  $('#featured-grid').innerHTML = items
    .slice(0, 5)
    .map(gameCard)
    .join('');

  bindCards($('#featured-grid'));
}


function filteredGames() {
  const q = $('#search').value.trim().toLowerCase();

  return allGames.filter(g =>
    (activeCategory === 'All' || g.category === activeCategory) &&
    (!q || g.search.includes(q))
  );
}


function renderGames() {
  const filtered = filteredGames();
  const visible = filtered.slice(0, visibleCount);

  $('#games-grid').innerHTML = visible.map(gameCard).join('');

  $('#no-results').classList.toggle('hidden', filtered.length !== 0);

  $('#load-more-wrap').classList.toggle(
    'hidden',
    filtered.length <= visibleCount
  );

  $('#load-more').textContent =
    `Load more (${Math.min(visibleCount, filtered.length)} of ${filtered.length})`;

  $('#library-count').textContent = filtered.length.toLocaleString();

  bindCards($('#games-grid'));
}


function renderFilters() {
  const categories = [
    'All',
    ...new Set(allGames.map(g => g.category).sort())
  ];

  $('#filters').innerHTML = categories.map(category => `
    <button
      class="filter-button ${category === activeCategory ? 'active' : ''}"
      data-category="${escapeHtml(category)}">
      ${escapeHtml(category)}
    </button>
  `).join('');

  $$('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      visibleCount = 60;

      $$('.filter-button').forEach(item => {
        item.classList.toggle('active', item === button);
      });

      renderGames();
    });
  });
}


function renderFavorites() {
  const items = allGames.filter(g => favorites.has(g.file));

  $('#favorites-grid').innerHTML = items.map(gameCard).join('');

  $('#favorites-empty').classList.toggle('hidden', items.length > 0);

  bindCards($('#favorites-grid'));
}


function randomGame() {
  const playable = allGames.filter(g => g.playable !== false);

  if (playable.length) {
    openGame(playable[Math.floor(Math.random() * playable.length)]);
  }
}


// LOAD GAMES
async function init() {
  try {
    const response = await fetch('./games.json');

    if (!response.ok) {
      throw new Error('Could not load games.json');
    }

    allGames = await response.json();

    $('#total-games').textContent = allGames.length.toLocaleString();
    $('#library-count').textContent = allGames.length.toLocaleString();

    renderFilters();
    renderGames();
    renderFeatured();
    renderRecent();
    saveFavorites();

  } catch (error) {
    console.error('Game loading error:', error);

    $('#games-grid').innerHTML = `
      <div class="empty-state">
        The game list could not be loaded. Make sure games.json is in the same folder as index.html.
      </div>
    `;
  }
}


// NAVIGATION — EVENT DELEGATION
document.addEventListener('click', event => {
  const pageButton = event.target.closest('[data-page]');

  if (pageButton) {
    event.preventDefault();
    setPage(pageButton.dataset.page);
    return;
  }

  const websiteCard = event.target.closest('[data-site-index]');

  if (websiteCard) {
    event.preventDefault();

    const site = allWebsites[Number(websiteCard.dataset.siteIndex)];

    if (site) openWebsite(site);
  }
});


// OTHER BUTTONS
$('#search').addEventListener('input', () => {
  visibleCount = 60;
  renderGames();
});

$('#load-more').addEventListener('click', () => {
  visibleCount += 60;
  renderGames();
});

$('#close-player').addEventListener('click', closeGame);

$('#reload-game').addEventListener('click', () => {
  const frame = $('#game-frame');
  frame.src = frame.src;
});

$('#fullscreen-game').addEventListener('click', () => {
  const frame = $('#game-frame');
  if (frame.requestFullscreen) frame.requestFullscreen();
});

$('#random-button').addEventListener('click', randomGame);
$('#surprise-button').addEventListener('click', randomGame);

$('#mobile-menu').addEventListener('click', () => {
  $('.main-nav').classList.toggle('open');
});


// KEYBOARD CONTROLS
document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    !$('#player').classList.contains('hidden')
  ) {
    closeGame();
  }

  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === 'k'
  ) {
    event.preventDefault();
    setPage('games');
    $('#search').focus();
  }
});


// STARTUP
init();
loadWebsites();


// ANIMATED BACKGROUND
(function ambient() {
  const canvas = $('#ambient');
  const ctx = canvas.getContext('2d');

  let w = 0;
  let h = 0;
  let particles = [];

  const resize = () => {
    w = canvas.width = innerWidth * devicePixelRatio;
    h = canvas.height = innerHeight * devicePixelRatio;

    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';

    particles = Array.from({
      length: Math.min(105, Math.floor(innerWidth / 12))
    }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.5 + .35) * devicePixelRatio,
      vx: (Math.random() - .5) * .22 * devicePixelRatio,
      vy: (Math.random() - .5) * .18 * devicePixelRatio,
      a: Math.random() * .5 + .12
    }));
  };

  resize();
  addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190,160,255,${p.a})`;
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);

        if (d < 115 * devicePixelRatio) {
          ctx.strokeStyle =
            `rgba(151,119,226,${.065 * (1 - d / (115 * devicePixelRatio))})`;

          ctx.lineWidth = devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
