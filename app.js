function renderWebsites(){
  const grid = $('#website-grid');
  if(!grid) return;

  // Create the in-arcade website viewer once.
  let viewer = $('#website-viewer');

  if(!viewer){
    grid.insertAdjacentHTML('afterend', `
      <section id="website-viewer" class="website-viewer hidden">
        <div class="website-viewer-bar">
          <button id="website-back" class="secondary-button">← Back to websites</button>
          <strong id="website-viewer-title">Website</strong>
          <div class="website-viewer-controls">
            <button id="website-reload" title="Reload website">↻</button>
            <button id="website-fullscreen" title="Fullscreen">⛶</button>
          </div>
        </div>
        <iframe
          id="website-frame"
          title="Website viewer"
          allow="autoplay; fullscreen; clipboard-read; clipboard-write"
          allowfullscreen>
        </iframe>
      </section>
    `);

    viewer = $('#website-viewer');

    $('#website-back').addEventListener('click', closeWebsite);
    $('#website-reload').addEventListener('click', () => {
      const frame = $('#website-frame');
      if(frame.src) frame.src = frame.src;
    });
    $('#website-fullscreen').addEventListener('click', () => {
      const frame = $('#website-frame');
      if(frame.requestFullscreen) frame.requestFullscreen();
    });
  }

  grid.innerHTML = allWebsites.map((site, index) => `
    <a class="website-card"
       href="${escapeHtml(site.url)}"
       data-site-index="${index}"
       aria-label="Open ${escapeHtml(site.name)} inside Penguin's Arcade">
      <div class="website-image-wrap">
        <img
          class="website-image"
          src="${escapeHtml(site.image)}"
          data-fallback="${escapeHtml(site.fallback || 'assets/sites/'+site.key+'.svg')}"
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

  // Handle website clicks without leaving the arcade.
  if(!grid.dataset.viewerBound){
    grid.dataset.viewerBound = 'true';

    grid.addEventListener('click', event => {
      const card = event.target.closest('[data-site-index]');
      if(!card) return;

      event.preventDefault();

      const site = allWebsites[Number(card.dataset.siteIndex)];
      if(site) openWebsite(site);
    });
  }

  // Handle missing website icons.
  grid.querySelectorAll('img[data-fallback]').forEach(img => {
    img.addEventListener('error', () => {
      if(img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = 'true';
      img.src = img.dataset.fallback;
    }, {once:true});
  });
}

function openWebsite(site){
  const url = new URL(site.url);

  if(url.protocol !== 'https:' && url.protocol !== 'http:'){
    alert('That website address is not supported.');
    return;
  }

  $('#website-viewer-title').textContent = site.name;
  $('#website-frame').src = url.href;

  $('#website-grid').classList.add('hidden');
  $('#website-viewer').classList.remove('hidden');

  window.scrollTo({top:0, behavior:'smooth'});
}

function closeWebsite(){
  $('#website-frame').src = 'about:blank';
  $('#website-viewer').classList.add('hidden');
  $('#website-grid').classList.remove('hidden');

  window.scrollTo({top:0, behavior:'smooth'});
}

async function loadWebsites(){
  try{
    const r = await fetch('./websites.json');
    if(!r.ok) throw new Error('Could not load websites.json');

    allWebsites = await r.json();

    if(!Array.isArray(allWebsites)){
      throw new Error('websites.json must contain a JSON array');
    }

    if(activePage === 'websites') renderWebsites();
  }catch(e){
    const grid = $('#website-grid');
    if(grid){
      grid.innerHTML = '<div class="empty-state">The website list could not be loaded. Check websites.json.</div>';
    }
  }
}
