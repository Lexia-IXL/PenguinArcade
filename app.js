
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let allGames = [];
let activeCategory = 'All';
let activePage = 'home';
let visibleCount = 60;
let favorites = new Set(JSON.parse(localStorage.getItem('arcade-favorites') || '[]'));
let recent = JSON.parse(localStorage.getItem('arcade-recent') || '[]');

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fileUrl = (file) => encodeURI('./' + file);


let allWebsites = [];
document.addEventListener('error', (event) => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.classList.contains('website-image') && img.dataset.fallback && !img.dataset.fallbackApplied) {
    img.dataset.fallbackApplied = 'true';
    img.src = img.dataset.fallback;
  }
}, true);
function renderWebsites(){
  const grid=$('#website-grid');
  if(!grid) return;
  grid.innerHTML=allWebsites.map(site=>`<a class="website-card" href="${escapeHtml(site.url)}" target="_self" rel="noopener noreferrer" aria-label="Open ${escapeHtml(site.name)} in this tab">
    <div class="website-image-wrap"><img class="website-image" src="${escapeHtml(site.image)}" data-fallback="${escapeHtml(site.fallback || 'assets/sites/'+site.key+'.svg')}" alt="${escapeHtml(site.name)} official site icon" loading="lazy"></div>
    <div class="website-info"><h3>${escapeHtml(site.name)}</h3><p>${escapeHtml(site.description)}</p><span class="website-open">OPEN SITE <b>↗</b></span></div>
  </a>`).join('');
}
async function loadWebsites(){
  try{const r=await fetch('./websites.json');allWebsites=await r.json();if(activePage==='websites')renderWebsites();}
  catch(e){const grid=$('#website-grid');if(grid)grid.innerHTML='<div class="empty-state">The website list could not be loaded.</div>'; }
}

function gameCard(g) {
  const saved = favorites.has(g.file);
  const playable = g.playable !== false;
  return `<article class="game-card" data-file="${escapeHtml(g.file)}" ${playable ? 'tabindex="0"' : 'aria-disabled="true"'} title="${playable ? 'Play ' + escapeHtml(g.title) : 'Legacy Flash file — not supported in modern browsers'}">
    <img class="card-image" src="${escapeHtml(g.image)}" data-fallback="${escapeHtml(g.fallback || g.image)}" alt="${escapeHtml(g.title)} cover" loading="lazy">
    <button class="favorite-toggle ${saved ? 'saved' : ''}" data-favorite="${escapeHtml(g.file)}" aria-label="${saved ? 'Remove from favorites' : 'Add to favorites'}">${saved ? '★' : '☆'}</button>
    <div class="card-info"><h3 class="card-title">${escapeHtml(g.title)}</h3><div class="card-meta"><span>${escapeHtml(g.category)}</span><span class="category-pill">${playable ? 'PLAY' : 'FLASH'}</span></div></div>
  </article>`;
}
function saveFavorites(){localStorage.setItem('arcade-favorites',JSON.stringify([...favorites]));$('#favorite-count').textContent=favorites.size;}
function setPage(page){
  activePage=page;
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===`${page}-page`));
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  if(page==='favorites') renderFavorites();
  if(page==='websites') renderWebsites();
  if(page==='games') renderGames();
  window.scrollTo({top:0,behavior:'smooth'});
  $('.main-nav').classList.remove('open');
}
function openGame(g){
  if(g.playable===false){alert('This is an older Flash file. Modern browsers no longer run Flash games.');return;}
  $('#player-name').textContent=g.title;
  $('#game-frame').src=fileUrl(g.file);
  $('#player').classList.remove('hidden');
  document.body.style.overflow='hidden';
  recent=[g.file,...recent.filter(x=>x!==g.file)].slice(0,12);
  localStorage.setItem('arcade-recent',JSON.stringify(recent));
  renderRecent();
}
function closeGame(){
  $('#player').classList.add('hidden');
  $('#game-frame').src='about:blank';
  document.body.style.overflow='';
}
function bindCards(root){
  root.querySelectorAll('.game-card').forEach(card=>{
    const g=allGames.find(x=>x.file===card.dataset.file);
    card.addEventListener('click',e=>{
      if(e.target.closest('.favorite-toggle'))return;
      if(g)openGame(g);
    });
    card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&g){e.preventDefault();openGame(g);}});
  });
  root.querySelectorAll('.favorite-toggle').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const f=btn.dataset.favorite;
      if(favorites.has(f))favorites.delete(f);else favorites.add(f);
      saveFavorites();
      const saved=favorites.has(f);
      btn.classList.toggle('saved',saved);
      btn.textContent=saved?'★':'☆';
      btn.setAttribute('aria-label',saved?'Remove from favorites':'Add to favorites');
      if(activePage==='favorites')renderFavorites();
    });
  });
  root.querySelectorAll('img[data-fallback]').forEach(img=>{
    img.addEventListener('error',()=>{if(img.src!==new URL(img.dataset.fallback,location.href).href)img.src=img.dataset.fallback;},{once:true});
  });
}
function renderRecent(){
  const items=recent.map(f=>allGames.find(g=>g.file===f)).filter(Boolean).slice(0,4);
  $('#recent-grid').innerHTML=items.length?items.map(gameCard).join(''):'<div class="empty-state">Play a game and it will show up here.</div>';
  bindCards($('#recent-grid'));
}
function renderFeatured(){
  const preferred=['geometrydashlite.html','clEaglercraftX188(u29).html','clusterrush.html','clbasketbros.html','clgdsubzero.html'];
  let items=preferred.map(f=>allGames.find(g=>g.file===f)).filter(Boolean);
  if(items.length<5)items=items.concat(allGames.filter(g=>!items.includes(g)).slice(0,5-items.length));
  $('#featured-grid').innerHTML=items.slice(0,5).map(gameCard).join('');
  bindCards($('#featured-grid'));
}
function filteredGames(){
  const q=$('#search').value.trim().toLowerCase();
  return allGames.filter(g=>(activeCategory==='All'||g.category===activeCategory)&&(!q||g.search.includes(q)));
}
function renderGames(){
  const filtered=filteredGames();
  const visible=filtered.slice(0,visibleCount);
  $('#games-grid').innerHTML=visible.map(gameCard).join('');
  $('#no-results').classList.toggle('hidden',filtered.length!==0);
  $('#load-more-wrap').classList.toggle('hidden',filtered.length<=visibleCount);
  $('#load-more').textContent=`Load more (${Math.min(visibleCount,filtered.length)} of ${filtered.length})`;
  $('#library-count').textContent=filtered.length.toLocaleString();
  bindCards($('#games-grid'));
}
function renderFilters(){
  const cats=['All',...new Set(allGames.map(g=>g.category).sort())];
  $('#filters').innerHTML=cats.map(c=>`<button class="filter-button ${c===activeCategory?'active':''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  $$('.filter-button').forEach(b=>b.addEventListener('click',()=>{
    activeCategory=b.dataset.category;visibleCount=60;
    $$('.filter-button').forEach(x=>x.classList.toggle('active',x===b));
    renderGames();
  }));
}
function renderFavorites(){
  const items=allGames.filter(g=>favorites.has(g.file));
  $('#favorites-grid').innerHTML=items.map(gameCard).join('');
  $('#favorites-empty').classList.toggle('hidden',items.length>0);
  bindCards($('#favorites-grid'));
}
function randomGame(){
  const playable=allGames.filter(g=>g.playable!==false);
  if(playable.length)openGame(playable[Math.floor(Math.random()*playable.length)]);
}
async function init(){
  try{
    const r=await fetch('./games.json');
    allGames=await r.json();
    $('#total-games').textContent=allGames.length.toLocaleString();
    $('#library-count').textContent=allGames.length.toLocaleString();
    renderFilters();renderGames();renderFeatured();renderRecent();saveFavorites();
  }catch(e){
    $('#games-grid').innerHTML='<div class="empty-state">The game list could not be loaded. Make sure games.json is in the same folder as index.html.</div>';
  }
}
$$('[data-page]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
$('#search').addEventListener('input',()=>{visibleCount=60;renderGames();});
$('#load-more').addEventListener('click',()=>{visibleCount+=60;renderGames();});
$('#close-player').addEventListener('click',closeGame);
$('#reload-game').addEventListener('click',()=>{const f=$('#game-frame');f.src=f.src;});
$('#fullscreen-game').addEventListener('click',()=>{const f=$('#game-frame');if(f.requestFullscreen)f.requestFullscreen();});
$('#random-button').addEventListener('click',randomGame);
$('#surprise-button').addEventListener('click',randomGame);
$('#mobile-menu').addEventListener('click',()=>$('.main-nav').classList.toggle('open'));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#player').classList.contains('hidden'))closeGame();
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPage('games');$('#search').focus();}
});
init();
loadWebsites();

// Original ambient particle field inspired by the soft, animated arcade backdrop.
(function ambient(){
  const canvas=$('#ambient'),ctx=canvas.getContext('2d');
  let w=0,h=0,particles=[];
  const resize=()=>{w=canvas.width=innerWidth*devicePixelRatio;h=canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';particles=Array.from({length:Math.min(105,Math.floor(innerWidth/12))},()=>({x:Math.random()*w,y:Math.random()*h,r:(Math.random()*1.5+.35)*devicePixelRatio,vx:(Math.random()-.5)*.22*devicePixelRatio,vy:(Math.random()-.5)*.18*devicePixelRatio,a:Math.random()*.5+.12}));};
  resize();addEventListener('resize',resize);
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(190,160,255,${p.a})`;ctx.fill();
    }
    for(let i=0;i<particles.length;i+=1){
      for(let j=i+1;j<particles.length;j+=1){
        const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
        if(d<115*devicePixelRatio){ctx.strokeStyle=`rgba(151,119,226,${.065*(1-d/(115*devicePixelRatio))})`;ctx.lineWidth=devicePixelRatio;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
