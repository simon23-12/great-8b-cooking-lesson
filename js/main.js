import { Kitchen } from './kitchen.js';
import { INGREDIENTS, BOX_ORDER, SORT_WORDS, TABLE_EXAMPLES, CATS, makeThumbs } from './ingredients.js';
import { RECIPES } from './recipes.js';
import { Sound } from './audio.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const SPEEDS = [1, 10, 60, 300];
const store = {
  get(k, d) { try { const v = localStorage.getItem('cook8b.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('cook8b.' + k, JSON.stringify(v)); } catch { } },
};

const S = {
  mode: 'home', speed: store.get('speed', 1), sim: 17 * 60 + 30, recipe: null, step: -1,
  picked: [], stepAdded: new Set(), used: new Set(), mistakes: 0, busy: false,
  waitLeft: 0, waitTotal: 0, chopCount: 0, chopNeed: 0, stirCount: 0, startSim: 0,
  showWords: store.get('words', true), readAloud: store.get('read', true), soundOn: store.get('sound', true),
};

const kitchen = new Kitchen($('#c'));
const sound = new Sound(); sound.enabled = S.soundOn;
let thumbs = {};

// ---------- speech ----------
let voices = [];
const VOICE_ENABLED = false; // set to true to bring back the read-aloud voice
const hasSpeech = VOICE_ENABLED && 'speechSynthesis' in window;
if (!VOICE_ENABLED) document.documentElement.classList.add('novoice');
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch { } }
if (hasSpeech) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, force = false) {
  if ((!S.readAloud && !force) || !hasSpeech) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    const v = voices.find(v => v.lang === 'en-GB' && /Daniel|Kate|Serena|Google UK|Arthur|Martha/i.test(v.name)) || voices.find(v => v.lang === 'en-GB') || voices.find(v => /^en/i.test(v.lang));
    if (v) u.voice = v; u.rate = 0.9; speechSynthesis.speak(u);
  } catch { }
}

// ---------- small UI helpers ----------
let toastT;
function toast(html, kind = 'info', ms = 2800) {
  const t = $('#toast'); t.innerHTML = html; t.className = 'toast show ' + kind;
  clearTimeout(toastT); toastT = setTimeout(() => { t.className = 'toast ' + kind; }, ms);
}
const tileEl = key => $(`.tile[data-key="${key}"]`);
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
const ingName = k => INGREDIENTS[k].name;
const fmtClock = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
const fmtTimer = m => { const s = Math.max(0, Math.ceil(m * 60)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const wordHTML = k => `${INGREDIENTS[k].isNew ? '<b class="plus">+</b>' : ''}${ingName(k)}`;
const listJoin = arr => arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const wait = ms => new Promise(r => setTimeout(r, ms));

function speedHTML() {
  return SPEEDS.map(s => `<button class="speed-btn ${s === S.speed ? 'on' : ''}" data-speed="${s}">${s}×</button>`).join('');
}
function setSpeed(s) {
  S.speed = s; store.set('speed', s);
  $$('.speed-btn').forEach(b => b.classList.toggle('on', +b.dataset.speed === s));
}

// ---------- tiles ----------
function buildTiles() {
  const wrap = $('#tiles'); wrap.innerHTML = '';
  for (const key of BOX_ORDER) {
    const ing = INGREDIENTS[key];
    const b = document.createElement('button');
    b.className = 'tile'; b.dataset.key = key; b.setAttribute('aria-label', ing.name);
    b.innerHTML = `<span class="tile-img">${thumbs[key] ? `<img src="${thumbs[key]}" alt="" draggable="false">` : `<span class="emo">${ing.emoji}</span>`}</span><span class="tile-name">${wordHTML(key)}</span><span class="tick">✓</span>`;
    b.addEventListener('click', () => { if (drag.suppressClick) return; onTile(key); });
    wrap.appendChild(b);
  }
}
function resetTiles() { $$('.tile').forEach(t => t.classList.remove('picked', 'used', 'off', 'hint', 'shake')); }
function applyWords() { document.body.classList.toggle('nowords', !S.showWords); $('#wordsToggle').checked = S.showWords; }

// ---------- overlay screens ----------
function overlay(html, cls = '') {
  const o = $('#overlay'); $('#overlayCard').className = 'ov-card ' + cls; $('#overlayCard').innerHTML = html;
  o.classList.remove('hidden'); $('#overlayCard').scrollTop = 0;
}
function closeOverlay() { $('#overlay').classList.add('hidden'); }

function showHome() {
  S.mode = 'home'; S.recipe = null; S.busy = false;
  kitchen.reset(); resetTiles(); hideCards();
  overlay(`
    <div class="home">
      <div class="home-badge">Unit · Good food</div>
      <h1 class="home-title">Mr Fuhs' great cooking lesson for <span>8b</span></h1>
      <p class="home-sub">Learn the food words. Then cook a meal in our 3D kitchen!</p>
      <div class="home-btns">
        <button class="btn big teal" data-go="sort"><span class="b-ico">🗂️</span><span><b>a) Sort the words</b><small>Make the table: vegetables, meat, dairy products, other</small></span></button>
        <button class="btn big orange" data-go="cook"><span class="b-ico">👩‍🍳</span><span><b>b) Cook a meal</b><small>Find the ingredients and follow the recipe</small></span></button>
      </div>
      <div class="home-settings">
        <label class="chip-toggle"><input type="checkbox" data-set="words" ${S.showWords ? 'checked' : ''}><span>🔤 Show words on the ingredients</span></label>
        <label class="chip-toggle"><input type="checkbox" data-set="read" ${S.readAloud ? 'checked' : ''}><span>🗣️ Read words aloud</span></label>
        <label class="chip-toggle"><input type="checkbox" data-set="sound" ${S.soundOn ? 'checked' : ''}><span>🔊 Kitchen sounds</span></label>
      </div>
      <p class="home-tip">Tip: Turn off “Show words” for a harder challenge – then you only see the pictures!</p>
    </div>`, 'wide');
}

function showPicker() {
  S.mode = 'picker'; kitchen.reset(); resetTiles(); hideCards();
  overlay(`
    <div class="picker">
      <h2>What do you want to cook?</h2>
      <p class="muted">Partner A and Partner B: choose your meal from exercise b). Or try another one!</p>
      <div class="recipe-grid">
        ${RECIPES.map(r => `
          <button class="recipe-btn" data-recipe="${r.id}">
            ${r.partner ? `<span class="partner p${r.partner}">Partner ${r.partner}</span>` : ''}
            <span class="r-emoji">${r.emoji}</span>
            <span class="r-title">${r.title}</span>
            <span class="r-meta">${r.ingredients.length} ingredients · ${r.steps.length} steps · ${r.steps.filter(s => s.t === 'wait').reduce((a, s) => a + s.min, 0)} min</span>
          </button>`).join('')}
      </div>
      <button class="btn ghost" data-go="home">← Back</button>
    </div>`, 'wide');
}

// ---------- recipe & step cards ----------
function hideCards() { $('#recipeCard').classList.add('hidden'); $('#stepCard').classList.add('hidden'); }
function renderRecipeCard() {
  const r = S.recipe, rc = $('#recipeCard');
  rc.classList.remove('hidden');
  rc.innerHTML = `
    <button class="rc-head" data-act="toggleRecipe">
      <span class="rc-emoji">${r.emoji}</span>
      <span class="rc-titles"><span class="rc-kicker">${r.partner ? `Partner ${r.partner}` : 'Recipe'}</span><span class="rc-title">${r.title}</span></span>
      <span class="rc-caret">▾</span>
    </button>
    <ul class="rc-list">${r.ingredients.map(k => `<li data-key="${k}"><span class="chk"></span><span>${r.amounts[k]}</span></li>`).join('')}</ul>`;
  updateRecipeCard();
}
function updateRecipeCard() {
  $$('#recipeCard li').forEach(li => {
    const k = li.dataset.key;
    li.classList.toggle('got', S.picked.includes(k));
    li.classList.toggle('used', S.used.has(k));
  });
}
function stepCard({ label, text, body = '', progress = 0, sayText }) {
  const c = $('#stepCard'); c.classList.remove('hidden');
  c.innerHTML = `
    <div class="sc-top"><span class="sc-label">${label}</span><button class="icon-btn small" data-act="say" aria-label="Read aloud">🔊</button></div>
    <p class="sc-text">${text}</p>
    <div class="sc-body">${body}</div>
    <div class="bar"><i style="width:${Math.round(progress * 100)}%"></i></div>`;
  c.dataset.say = sayText ?? text.replace(/<[^>]+>/g, '');
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
}
function boldItems(text, items) {
  let out = text;
  for (const k of items || []) {
    const base = ingName(k).replace(/s$/, '');
    out = out.replace(new RegExp(`\\b(${base}s?)\\b`, 'i'), '<b>$1</b>');
  }
  return out;
}

// ---------- cooking flow ----------
function startRecipe(id) {
  sound.init();
  S.recipe = RECIPES.find(r => r.id === id); S.mode = 'shop'; S.step = -1;
  S.picked = []; S.used = new Set(); S.mistakes = 0; S.busy = false; S.startSim = S.sim;
  closeOverlay(); kitchen.reset(); resetTiles(); renderRecipeCard(); renderShop();
  speak(`Let's make ${S.recipe.name}! Find the ingredients.`);
}
function renderShop() {
  const r = S.recipe, n = S.picked.length, total = r.ingredients.length;
  stepCard({
    label: '🛒 Get the ingredients',
    text: `Find the ingredients for <b>${r.name}</b> in the box and tap them.`,
    body: `<span class="counter">${n} / ${total}</span><button class="btn ghost" data-act="hint">💡 Hint</button>`,
    progress: n / total,
  });
}
async function onTile(key) {
  sound.init();
  const el = tileEl(key), ing = INGREDIENTS[key];
  speak(ing.name);
  if (S.mode === 'shop') {
    const r = S.recipe;
    if (S.picked.includes(key)) { toast(`You already have the ${ing.name}. 👍`); return; }
    if (!r.ingredients.includes(key)) {
      S.mistakes++; sound.wrong(); shake(el);
      toast(`We don't need <b>${ing.name}</b> for ${r.name}.`, 'bad'); return;
    }
    S.picked.push(key); el.classList.add('picked'); sound.pop(); updateRecipeCard(); renderShop();
    const slot = S.picked.length - 1;
    const done = S.picked.length === r.ingredients.length;
    await kitchen.spawnItem(key, slot);
    if (done && S.mode === 'shop') {
      S.mode = 'ready';
      sound.good(); toast('Great! You have everything. Let\'s cook! 👩‍🍳', 'good');
      await wait(1100); startCooking();
    }
    return;
  }
  if (S.mode === 'cook') { tryAdd(key, null); return; }
  // in other modes: just a little bounce for vocabulary practice
  el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');
}
// Put an ingredient into the pot/pan. vn = vessel it was dropped on (null when tapped).
// Returns true when the ingredient really went in.
function tryAdd(key, vn) {
  const el = tileEl(key), ing = INGREDIENTS[key], st = curStep();
  if (!S.picked.includes(key)) { sound.wrong(); shake(el); toast(`You don't need <b>${ing.name}</b> for this meal.`, 'bad'); return false; }
  if (S.used.has(key)) { toast(`The ${ing.name} ${ing.name.endsWith('s') ? 'are' : 'is'} already in the ${st.v || 'pan'}.`); return false; }
  if (st.t !== 'add') { sound.wrong(); shake(el); toast(`Not now! First: <i>${st.text}</i>`, 'bad'); return false; }
  if (!st.items.includes(key)) { S.mistakes++; sound.wrong(); shake(el); toast(`Not the ${ing.name}! Read the step again. 🙂`, 'bad'); return false; }
  if (vn && vn !== st.v) { S.mistakes++; sound.wrong(); shake(el); toast(`Not in the ${vn}! Put the ${ing.name} in the <b>${st.v}</b>.`, 'bad'); return false; }
  if (S.stepAdded.has(key) || S.busy) return false;
  S.stepAdded.add(key); S.used.add(key); el.classList.add('used'); el.classList.remove('hint'); updateRecipeCard();
  S.busy = true; sound.whoosh();
  const p = kitchen.addToVessel(key, st.v);
  setTimeout(() => (ing.how === 'pour' ? sound.pour() : sound.plop()), ing.how === 'pour' ? 900 : 700);
  p.then(() => {
    S.busy = false; renderStep();
    if (st.items.every(k => S.stepAdded.has(k))) nextStep();
  });
  return true;
}

// ---------- drag & drop: tile -> pot / pan ----------
const drag = { key: null, active: false, x0: 0, y0: 0, t0: 0, ghost: null, over: null, holdT: 0, suppressClick: false };
const canDrag = key => S.mode === 'cook' && S.picked.includes(key) && !S.used.has(key);
const portrait = () => matchMedia('(orientation: portrait), (max-width: 900px)').matches;
function dragStart(key, x, y) { Object.assign(drag, { key, active: false, x0: x, y0: y, t0: performance.now(), over: null }); }
function dragActivate(x, y) {
  drag.active = true; sound.init();
  const g = drag.ghost = document.createElement('div'); g.className = 'drag-ghost';
  g.innerHTML = thumbs[drag.key] ? `<img src="${thumbs[drag.key]}" alt="">` : `<span class="emo">${INGREDIENTS[drag.key].emoji}</span>`;
  document.body.appendChild(g); tileEl(drag.key)?.classList.add('dragging');
  dragMove(x, y);
}
function dragMove(x, y) {
  if (!drag.active) return;
  drag.ghost.style.transform = `translate(${x}px, ${y}px)`;
  const vn = kitchen.vesselAt(x, y);
  if (vn !== drag.over) { drag.over = vn; kitchen.setDropTarget(vn); drag.ghost.classList.toggle('over', !!vn); }
}
function dragEnd(x, y) {
  clearTimeout(drag.holdT);
  if (!drag.key) return;
  const { key, active } = drag; drag.key = null;
  if (!active) return;
  drag.active = false; drag.suppressClick = true; setTimeout(() => { drag.suppressClick = false; }, 400);
  const vn = kitchen.vesselAt(x, y); kitchen.setDropTarget(null);
  tileEl(key)?.classList.remove('dragging');
  const g = drag.ghost; drag.ghost = null;
  if (vn && tryAdd(key, vn)) { g.classList.add('drop'); setTimeout(() => g.remove(), 250); return; }
  if (!vn && S.mode === 'cook') toast('Drop it on the <b>pot</b> or the <b>pan</b>. 🙂', 'info', 1800);
  const r = tileEl(key)?.getBoundingClientRect();
  g.classList.add('back');
  if (r) g.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) scale(.6)`;
  setTimeout(() => g.remove(), 320);
}
function dragCancel() {
  clearTimeout(drag.holdT); drag.key = null;
  if (drag.active) { drag.active = false; kitchen.setDropTarget(null); $$('.tile.dragging').forEach(t => t.classList.remove('dragging')); drag.ghost?.remove(); drag.ghost = null; }
}
function initDrag() {
  const tiles = $('#tiles');
  const keyOf = e => e.target.closest('.tile')?.dataset.key;
  // touch (iPad): decide on the first move whether this is a drag or a scroll of the ingredient box
  tiles.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return dragCancel();
    const key = keyOf(e); if (!key || !canDrag(key)) return;
    const t = e.touches[0]; dragStart(key, t.clientX, t.clientY);
    drag.holdT = setTimeout(() => { if (drag.key && !drag.active) dragActivate(drag.x0, drag.y0); }, 220); // press & hold also starts a drag
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!drag.key) return;
    const t = e.touches[0], dx = t.clientX - drag.x0, dy = t.clientY - drag.y0;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < 8) return;
      clearTimeout(drag.holdT);
      const towardKitchen = portrait() ? (dy < 0 && -dy > Math.abs(dx) * 0.8) : (Math.abs(dx) > Math.abs(dy) * 0.8);
      if (!towardKitchen) { drag.key = null; return; } // let the box scroll
      dragActivate(t.clientX, t.clientY);
    }
    e.preventDefault(); dragMove(t.clientX, t.clientY);
  }, { passive: false });
  document.addEventListener('touchend', e => { if (!drag.key) return; const t = e.changedTouches[0]; if (drag.active) e.preventDefault(); dragEnd(t.clientX, t.clientY); }, { passive: false });
  document.addEventListener('touchcancel', dragCancel);
  // mouse (laptop / whiteboard)
  tiles.addEventListener('mousedown', e => { const key = keyOf(e); if (e.button === 0 && key && canDrag(key)) dragStart(key, e.clientX, e.clientY); });
  document.addEventListener('mousemove', e => {
    if (!drag.key) return;
    if (!drag.active) { if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return; dragActivate(e.clientX, e.clientY); }
    dragMove(e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', e => { if (drag.key) dragEnd(e.clientX, e.clientY); });
}

function startCooking() {
  S.mode = 'cook'; S.step = 0;
  $('#recipeCard').classList.add('collapsed');
  $$('.tile').forEach(t => { if (!S.picked.includes(t.dataset.key)) t.classList.add('off'); t.classList.remove('picked'); });
  beginStep();
}
const curStep = () => S.recipe.steps[S.step];
async function beginStep() {
  const st = curStep(); S.stepAdded = new Set(); S.chopCount = 0; S.stirCount = 0;
  if (st.t === 'chop') { S.chopNeed = st.items.length * 3; S.busy = true; renderStep(); await kitchen.toBoard(st.items); S.busy = false; }
  if (st.t === 'wait') { S.waitTotal = st.min; S.waitLeft = st.min; }
  renderStep();
  speak(st.text);
}
function renderStep() {
  const r = S.recipe, st = curStep(), i = S.step, n = r.steps.length;
  const icon = { water: '💧', heat: '🔥', add: '🥄', chop: '🔪', stir: '🌀', wait: '⏱️', serve: '🍽️' }[st.t];
  let body = '';
  switch (st.t) {
    case 'water': body = `<button class="btn act" data-act="water">💧 Fill with water</button>`; break;
    case 'heat': body = `<button class="btn act" data-act="heat">🔥 Turn on the cooker</button><span class="muted small">or tap the knob</span>`; break;
    case 'chop': body = `<button class="btn act" data-act="chop" ${S.busy ? 'disabled' : ''}>🔪 Chop! <span class="cnt">${S.chopCount}/${S.chopNeed}</span></button><span class="muted small">or tap the board</span>`; break;
    case 'stir': body = `<button class="btn act" data-act="stir">🥄 Stir <span class="cnt">${S.stirCount}/4</span></button>`; break;
    case 'add': body = `<span class="muted">👉 Tap or drag the right ingredients into the <b>${st.v}</b>.</span><span class="counter">${S.stepAdded.size}/${st.items.length}</span><button class="btn ghost" data-act="hint">💡 Hint</button>`; break;
    case 'wait': body = `<div class="timer"><span class="t-big" id="timerTxt">${fmtTimer(S.waitLeft)}</span><span class="t-sub">left</span></div>
      <div class="speed inline"><span class="speed-label">⏩ Faster:</span>${speedHTML()}</div>`; break;
    case 'serve': body = `<button class="btn act orange" data-act="serve">🍽️ Serve the meal</button>`; break;
  }
  stepCard({ label: `${icon} Step ${i + 1} of ${n}`, text: boldItems(st.text, st.items), body, progress: i / n, sayText: st.text });
  $$('.tile.hint').forEach(t => t.classList.remove('hint'));
}
function nextStep() {
  sound.good();
  kitchen.hideSpoon();
  S.step++;
  if (S.step >= S.recipe.steps.length) return;
  beginStep();
}
async function act(a) {
  sound.init();
  if (a === 'say') { speak($('#stepCard').dataset.say, true); return; }
  if (a === 'hint') return hint();
  if (a === 'toggleRecipe') { $('#recipeCard').classList.toggle('collapsed'); return; }
  if (S.mode !== 'cook' || S.busy) return;
  const st = curStep();
  if (st.t === 'water' && a === 'water') { S.busy = true; sound.water(); await kitchen.pourWater(st.v); S.busy = false; nextStep(); }
  else if (st.t === 'heat' && a === 'heat') { S.busy = true; sound.click(); kitchen.setHeat(st.v, true); await wait(800); S.busy = false; nextStep(); }
  else if (st.t === 'chop' && a === 'chop') chopTap();
  else if (st.t === 'stir' && a === 'stir') {
    S.busy = true; S.stirCount++; sound.whoosh(); await kitchen.stir(st.v); S.busy = false;
    if (S.stirCount >= 4) nextStep(); else renderStep();
  }
  else if (st.t === 'serve' && a === 'serve') serve();
}
function chopTap() {
  const st = curStep(); if (S.chopCount >= S.chopNeed) return;
  S.chopCount++;
  const idx = Math.min(st.items.length - 1, Math.floor((S.chopCount - 1) / 3));
  kitchen.chop(st.items[idx]); sound.chop();
  if (S.chopCount % 3 === 0) kitchen.toPieces(st.items[idx]);
  const c = $('#stepCard .cnt'); if (c) c.textContent = `${S.chopCount}/${S.chopNeed}`;
  if (S.chopCount >= S.chopNeed) {
    S.busy = true;
    setTimeout(async () => { await Promise.all([kitchen.knifeRest(), kitchen.parkPieces(st.items)]); S.busy = false; nextStep(); }, 350);
  }
}
function hint() {
  sound.init();
  let keys = [];
  if (S.mode === 'shop') keys = S.recipe.ingredients.filter(k => !S.picked.includes(k)).slice(0, 1);
  else if (S.mode === 'cook' && curStep().t === 'add') keys = curStep().items.filter(k => !S.stepAdded.has(k));
  else { const b = $('#stepCard .act'); if (b) { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); } return; }
  keys.forEach(k => { const t = tileEl(k); t.classList.add('hint'); t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); setTimeout(() => t.classList.remove('hint'), 2500); });
}
async function serve() {
  S.busy = true; sound.whoosh();
  await kitchen.serve(S.recipe.dish);
  sound.fanfare(); S.mode = 'done'; S.busy = false;
  stepCard({ label: '🎉 Finished!', text: `Your <b>${S.recipe.name}</b> is ready. Enjoy your meal!`, progress: 1 });
  await wait(1500);
  showResult();
}
function showResult() {
  const r = S.recipe;
  const stars = S.mistakes <= 1 ? 3 : S.mistakes <= 4 ? 2 : 1;
  const minutes = Math.round(S.sim - S.startSim);
  const need = `To make ${r.name}, I need ${listJoin(r.ingredients.map(k => r.amounts[k]))}.`;
  const conn = ['First', 'Then', 'Next', 'After that'];
  const stepsTxt = r.steps.map((s, i) => {
    const w = i === 0 ? 'First' : i === r.steps.length - 1 ? 'Finally' : conn[1 + ((i - 1) % 3)];
    return `${w}, ${s.text.charAt(0).toLowerCase()}${s.text.slice(1)}`;
  });
  S.lastTexts = { need, how: stepsTxt.join(' ') };
  overlay(`
    <div class="result">
      <div class="stars">${'⭐'.repeat(stars)}${'<span class="dim">⭐</span>'.repeat(3 - stars)}</div>
      <h2>Well done! Your ${r.name} is ready.</h2>
      <p class="muted">Mistakes: ${S.mistakes} · Kitchen time: ${minutes} minutes</p>
      <div class="speak-box">
        <div class="sb-head"><span>🗣️ Tell your partner your ingredients</span><button class="icon-btn small" data-say="need">🔊</button></div>
        <p class="sb-text">${need}</p>
      </div>
      <details class="speak-box">
        <summary class="sb-head"><span>📝 Tell your partner how to make it</span><button class="icon-btn small" data-say="how">🔊</button></summary>
        <ol class="sb-steps">${stepsTxt.map(s => `<li>${s}</li>`).join('')}</ol>
      </details>
      <div class="res-btns">
        <button class="btn orange" data-recipe="${r.id}">🔁 Cook it again</button>
        <button class="btn teal" data-go="cook">🍳 Cook another meal</button>
        <button class="btn ghost" data-go="home">🏠 Home</button>
      </div>
    </div>`, 'wide');
}

// ---------- exercise a) sorting ----------
const sortState = { order: [], idx: 0, placed: {}, mistakes: 0, own: {} };
function startSort() {
  S.mode = 'sort'; kitchen.reset(); resetTiles(); hideCards(); sound.init();
  sortState.order = [...SORT_WORDS].sort(() => Math.random() - 0.5);
  sortState.idx = 0; sortState.mistakes = 0;
  sortState.placed = { veg: [], meat: [], dairy: [], other: [] };
  sortState.own = store.get('own', { veg: [], meat: [], dairy: [], other: [] });
  renderSort();
}
function renderSort() {
  const done = sortState.idx >= sortState.order.length;
  const key = sortState.order[sortState.idx];
  const cur = done ? '' : `
    <div class="sort-card" id="sortCard">
      ${thumbs[key] ? `<img src="${thumbs[key]}" alt="">` : `<span class="emo">${INGREDIENTS[key].emoji}</span>`}
      <span class="sort-word">${wordHTML(key)}</span>
      <button class="icon-btn small" data-sayword="${key}">🔊</button>
    </div>
    <p class="muted center">Where does it go? Tap the right column. (${sortState.idx + 1} / ${sortState.order.length})</p>`;
  const col = c => `
    <div class="col" data-cat="${c.id}">
      <button class="col-head" data-cat="${c.id}">${c.isNew ? '<b class="plus">+</b>' : ''}${c.label}</button>
      <div class="col-words">
        <span class="hw ex">${INGREDIENTS[TABLE_EXAMPLES[c.id]].name}</span>
        ${sortState.placed[c.id].map(k => `<span class="hw">${INGREDIENTS[k].name}</span>`).join('')}
        ${(sortState.own[c.id] || []).map((w, i) => `<span class="hw own">${escapeHTML(w)}<button class="x" data-del="${c.id}:${i}" aria-label="remove">×</button></span>`).join('')}
      </div>
    </div>`;
  overlay(`
    <div class="sort">
      <div class="sort-top"><h2>a) Make a table and add the words</h2><button class="btn ghost" data-go="home">← Back</button></div>
      ${cur}
      ${done ? `<div class="sort-done"><b>🎉 Super! All words are in the table.</b> Mistakes: ${sortState.mistakes}<br>Now add other food words that you know:</div>
        <form class="own-form" id="ownForm">
          <input id="ownWord" type="text" placeholder="e.g. potatoes" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24">
          <select id="ownCat">${CATS.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}</select>
          <button class="btn teal" type="submit">➕ Add</button>
        </form>` : ''}
      <div class="table ${done ? '' : 'active'}">${CATS.map(col).join('')}</div>
      ${done ? `<div class="res-btns"><button class="btn ghost" data-go="sort">🔁 Sort again</button><button class="btn orange" data-go="cook">👩‍🍳 Now cook a meal!</button></div>` : ''}
      <div id="sortToast" class="sort-toast"></div>
    </div>`, 'wide sortcard');
  if (!done) speak(INGREDIENTS[key].name);
}
function escapeHTML(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function sortPick(cat) {
  if (sortState.idx >= sortState.order.length) return;
  const key = sortState.order[sortState.idx], ing = INGREDIENTS[key];
  if (ing.cats.includes(cat)) {
    sound.good(); sortState.placed[cat].push(key); sortState.idx++; renderSort();
  } else {
    sound.wrong(); sortState.mistakes++;
    shake($('#sortCard')); shake($(`.col[data-cat="${cat}"]`));
    const label = CATS.find(c => c.id === cat).label;
    toastSort(`Hmm… are <b>${ing.name}</b> really ${label === 'other' ? '“other”' : label}? Try again!`);
  }
}
function toastSort(html) {
  let t = $('#sortToast'); if (!t) return;
  t.innerHTML = html; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const sp = e.target.closest('.speed-btn'); if (sp) { sound.init(); sound.click(); setSpeed(+sp.dataset.speed); return; }
  const go = e.target.closest('[data-go]');
  if (go) { sound.init(); const g = go.dataset.go; if (g === 'home') showHome(); else if (g === 'cook') showPicker(); else if (g === 'sort') startSort(); return; }
  const rb = e.target.closest('[data-recipe]'); if (rb) { startRecipe(rb.dataset.recipe); return; }
  const a = e.target.closest('[data-act]'); if (a) { e.preventDefault(); act(a.dataset.act); return; }
  const say = e.target.closest('[data-say]'); if (say && say.dataset.say in (S.lastTexts || {})) { e.preventDefault(); e.stopPropagation(); speak(S.lastTexts[say.dataset.say], true); return; }
  const sw = e.target.closest('[data-sayword]'); if (sw) { speak(INGREDIENTS[sw.dataset.sayword].name, true); return; }
  const del = e.target.closest('[data-del]');
  if (del) { const [c, i] = del.dataset.del.split(':'); sortState.own[c].splice(+i, 1); store.set('own', sortState.own); renderSort(); return; }
  const cat = e.target.closest('.table.active [data-cat]'); if (cat) { sound.init(); sortPick(cat.dataset.cat); return; }
});
document.addEventListener('change', (e) => {
  const s = e.target.dataset.set; if (!s) return;
  if (s === 'words') { S.showWords = e.target.checked; store.set('words', S.showWords); applyWords(); }
  if (s === 'read') { S.readAloud = e.target.checked; store.set('read', S.readAloud); updateTopIcons(); }
  if (s === 'sound') { S.soundOn = e.target.checked; store.set('sound', S.soundOn); sound.init(); sound.setEnabled(S.soundOn); updateTopIcons(); }
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'ownForm') return; e.preventDefault();
  const w = $('#ownWord').value.trim(); if (!w) return;
  const c = $('#ownCat').value; sortState.own[c] = sortState.own[c] || []; sortState.own[c].push(w); store.set('own', sortState.own);
  sound.good(); renderSort(); setTimeout(() => $('#ownWord')?.focus(), 50);
});
$('#wordsToggle').addEventListener('change', e => { S.showWords = e.target.checked; store.set('words', S.showWords); applyWords(); });
$('#homeBtn').addEventListener('click', () => { sound.init(); showHome(); });
$('#soundBtn').addEventListener('click', () => { sound.init(); S.soundOn = !S.soundOn; store.set('sound', S.soundOn); sound.setEnabled(S.soundOn); updateTopIcons(); });
$('#readBtn').addEventListener('click', () => { S.readAloud = !S.readAloud; store.set('read', S.readAloud); updateTopIcons(); if (S.readAloud) speak('Read aloud is on.'); else if (hasSpeech) speechSynthesis.cancel(); });
function updateTopIcons() {
  $('#soundBtn').textContent = S.soundOn ? '🔊' : '🔇'; $('#soundBtn').classList.toggle('off', !S.soundOn);
  $('#readBtn').classList.toggle('off', !S.readAloud);
}

// taps in the 3D scene
let down = null;
const canvas = $('#c');
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return; down = null;
  sound.init();
  const tap = kitchen.pick(e.clientX, e.clientY); if (!tap || S.mode !== 'cook') return;
  const st = curStep();
  if (tap.ing) { if (S.picked.includes(tap.ing)) onTile(tap.ing); }
  else if (tap.action === 'board' && st.t === 'chop' && !S.busy) chopTap();
  else if (tap.knob && st.t === 'heat' && tap.knob === st.v) act('heat');
  else if (tap.vessel && st.t === 'stir' && tap.vessel === st.v) act('stir');
  else if (tap.vessel && st.t === 'water' && tap.vessel === st.v) act('water');
});
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

// ---------- resize + loop ----------
const stage = $('#stage');
function updateSafe() {
  const rc = $('#recipeCard'), sc = $('#stepCard');
  let l = 6, t = 6, r = 6, b = 6;
  if (!sc.classList.contains('hidden')) b = sc.offsetHeight + 22;
  if (!rc.classList.contains('hidden')) {
    if (rc.classList.contains('collapsed')) t = rc.offsetTop + rc.offsetHeight + 4;
    else l = rc.offsetLeft + rc.offsetWidth + 6;
  }
  kitchen.setSafe({ l, t, r, b });
}
function resize() { const r = stage.getBoundingClientRect(); kitchen.resize(Math.max(1, r.width), Math.max(1, r.height)); updateSafe(); }
const ro = new ResizeObserver(resize);
ro.observe(stage); ro.observe($('#stepCard')); ro.observe($('#recipeCard'));
new MutationObserver(updateSafe).observe($('#recipeCard'), { attributes: true, attributeFilter: ['class'] });
new MutationObserver(updateSafe).observe($('#stepCard'), { attributes: true, attributeFilter: ['class'] });
resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const simDt = dt * S.speed / 60; // minutes
  S.sim += simDt;
  $('#clockTxt').textContent = fmtClock(S.sim);
  if (S.mode === 'cook' && curStep()?.t === 'wait' && !S.busy) {
    S.waitLeft -= simDt;
    const tt = $('#timerTxt'); if (tt) tt.textContent = fmtTimer(S.waitLeft);
    const bar = $('#stepCard .bar i'); if (bar) { const n = S.recipe.steps.length; bar.style.width = `${((S.step + 1 - Math.max(0, S.waitLeft) / S.waitTotal) / n) * 100}%`; }
    if (S.waitLeft <= 0) { sound.ding(); toast('⏰ Time is up!', 'good', 1500); nextStep(); }
  }
  kitchen.update(dt);
  const pan = kitchen.vessels.pan, pot = kitchen.vessels.pot;
  sound.setLoops(pan.boiling ? 1 : 0, pot.boiling ? 1 : 0);
  requestAnimationFrame(frame);
}

// ---------- start ----------
(async function init() {
  $('#topSpeed').innerHTML = `<span class="speed-label">⏩ Time</span>${speedHTML()}`;
  applyWords(); updateTopIcons();
  try { thumbs = makeThumbs(BOX_ORDER); } catch (e) { console.warn('thumbnails failed', e); thumbs = {}; }
  buildTiles(); initDrag();
  $('#loading').remove();
  showHome();
  requestAnimationFrame(frame);
})();
