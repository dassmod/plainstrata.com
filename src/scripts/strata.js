// The Plain Strata page engine: the home question tree, the episode sequence and the map.
// One Flow engine draws every line on the site, so the three pages look like one piece.

import { episodes } from '../lib/episodes.js';
import { SHOW, LINES, TREE } from '../data/site.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NEON = '234,255,61', WHITE = '245,245,245';
const ARROW = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M7 17L17 7M9 7h8v8"/></svg>';

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function txt(tag, cls, text) { const e = el(tag, cls); e.textContent = text; return e; }

/* ------------------------------------------------ episodes
   id, title, date, primary line, lines, question, short answer, one sentence about the episode (no title) */
const FMT = { B: 'basics', L: 'layer', P: 'pulse' };
const EP = {};
const ALL = episodes.map((r) => {
  const n = { id: r.id, t: r.title, d: r.date, p: r.line, ls: r.threads || [], q: r.question, a: r.answer, b: r.about, url: r.url, f: FMT[r.id[0]] };
  EP[n.id] = n; return n;
});
const LINE = {}; LINES.forEach((l) => { LINE[l.k] = l; });
function stopsOf(k) {
  if (k === 'bed') return ALL.filter((n) => n.f === 'basics');
  return [EP[LINE[k].from]].concat(ALL.filter((n) => n.ls.indexOf(k) >= 0));
}
function onLine(n, k) { return k === 'bed' ? n.f === 'basics' : (n.ls.indexOf(k) >= 0 || LINE[k].from === n.id); }
function meta(n) { return n.f + ' // ' + n.id + (n.d ? ' // ' + n.d : ''); }

function epChip(n) {
  const a = el('a', 'ep', '<i class="fm ' + n.f + '"></i>' + n.f + ' // ' + n.id);
  a.appendChild(txt('em', '', n.t));
  a.insertAdjacentHTML('beforeend', ARROW);
  a.href = n.url || SHOW; a.target = '_blank'; a.rel = 'noopener'; a.dataset.id = n.id;
  return a;
}

/* ------------------------------------------------ tooltip: the one-sentence description */
const tip = document.getElementById('tip');
function showTip(n, x, y) {
  tip.innerHTML = ''; tip.appendChild(txt('span', 'lab', meta(n))); tip.appendChild(txt('p', '', n.b));
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight, vw = window.innerWidth;
  const left = Math.min(Math.max(8, x - w / 2), vw - w - 8);
  let top = y - h - 12;
  if (top < 8) top = y + 20;
  tip.style.left = left + 'px'; tip.style.top = top + 'px';
}
function hideTip() { tip.hidden = true; }
const TIP_SEL = '.ep[data-id], .route li[data-id]';
document.addEventListener('mouseover', (e) => {
  const t = e.target.closest && e.target.closest(TIP_SEL);
  if (!t) return;
  const anchor = t.matches('li') ? t.querySelector('.ep') : t, r = anchor.getBoundingClientRect();
  showTip(EP[t.dataset.id], r.left + Math.min(r.width / 2, 140), r.top);
});
document.addEventListener('mouseout', (e) => {
  const t = e.target.closest && e.target.closest(TIP_SEL);
  if (t && !t.contains(e.relatedTarget)) hideTip();
});
document.addEventListener('scroll', hideTip, true);

/* ------------------------------------------------ every "subscribe" scrolls to the sign-up block and puts the cursor in the email field */
document.querySelectorAll('[data-sub]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const sec = document.getElementById('subscribe'); if (!sec) return;
    e.preventDefault();
    sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const i = sec.querySelector('input[type="email"]');
    setTimeout(() => i.focus({ preventScroll: true }), 450);
  });
});
// Buttondown confirms in its own tab. Here the button only says what happens next.
document.querySelectorAll('.letter form').forEach((form) => {
  form.addEventListener('submit', () => {
    const b = form.querySelector('button');
    setTimeout(() => { b.textContent = 'check your inbox'; form.reset(); }, 50);
  });
});

/* ------------------------------------------------ the point: many dots, neon at the core */
function pointCloud(canvas, n, sigma) {
  const dpr = window.devicePixelRatio || 1, s = canvas.clientWidth;
  canvas.width = s * dpr; canvas.height = s * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const pts = [];
  for (let i = 0; i < n; i++) pts.push({ r: Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * sigma, a: Math.random() * 6.283, w: (Math.random() - .5) * .005, z: .35 + Math.random() * .65 });
  (function draw() {
    ctx.clearRect(0, 0, s, s);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]; if (!reduce) p.a += p.w;
      const core = p.r < sigma * .8;
      ctx.fillStyle = 'rgba(' + (core ? NEON : WHITE) + ',' + (p.z * (core ? 1 : Math.max(.15, 1 - p.r / (sigma * 3)))).toFixed(2) + ')';
      ctx.fillRect(s / 2 + Math.cos(p.a) * p.r, s / 2 + Math.sin(p.a) * p.r, 1.3, 1.3);
    }
    if (!reduce && canvas.isConnected) requestAnimationFrame(draw);
  })();
}

/* ------------------------------------------------ Flow: every line carries a small orb of light that travels down it,
   leaving a warm afterglow on the line behind it.
   base = the resting line, speed = px per second, gap = distance between orbs (px),
   orb = radius of the bright core, halo = radius of the soft glow, trail = length of the afterglow (px). */
const KIND = {
  on:  { col: NEON,  base: .30, w: 2,   speed: 55, gap: 520, orb: 3,   halo: 20, trail: 110, trailA: .55, orbA: 1 },
  off: { col: WHITE, base: .16, w: 1.5, speed: 55, gap: 520, orb: 2,   halo: 12, trail: 70,  trailA: .30, orbA: .45 },
  bed: { col: WHITE, base: .40, w: 1.5, speed: 55, gap: 520, orb: 2.4, halo: 14, trail: 80,  trailA: .45, orbA: .8 },
};
function Flow(canvas, o) {
  const ctx = canvas.getContext('2d'), self = this;
  let paths = [], W = 0, H = 0, t0 = 0, running = false;
  this.heads = [];
  function sample(pts) {
    const T = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy);
      if (len < .5) continue;
      for (let k = 0; k < len; k++) T.push({ x: p.x + dx * k / len, y: p.y + dy * k / len });
    }
    return T;
  }
  this.layout = function (size) {
    W = size.w; H = size.h;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paths = o.paths().map((p) => { p.T = sample(p.pts); return p; }).filter((p) => p.T.length > 1);
    self.W = W; self.H = H;
  };
  function drawPath(P, K, t, pi, grow) {
    const T = P.T, L = T.length, heads = [];
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.lineWidth = K.w;
    ctx.strokeStyle = 'rgba(' + K.col + ',' + K.base + ')';
    ctx.beginPath();
    if (grow >= 1) {
      ctx.moveTo(P.pts[0].x, P.pts[0].y);
      for (let i = 1; i < P.pts.length; i++) ctx.lineTo(P.pts[i].x, P.pts[i].y);
    } else {
      // the line is still drawing itself down
      const Lg = Math.max(1, Math.floor(L * grow));
      ctx.moveTo(T[0].x, T[0].y);
      for (let g = 3; g < Lg; g += 3) ctx.lineTo(T[g].x, T[g].y);
    }
    ctx.stroke();
    if (grow >= 1) {
      const phase = reduce ? K.gap * .45 : (t * K.speed) % K.gap, h2 = K.w / 2;
      for (let h = phase; h - K.trail < L; h += K.gap) {
        // the afterglow: the line stays warm behind the orb and cools off slowly
        for (let k = 0; k < K.trail; k++) {
          const idx = Math.floor(h - k); if (idx < 0 || idx >= L) continue;
          const f = k / K.trail, a = Math.exp(-2.6 * f * f) * K.trailA;
          ctx.fillStyle = 'rgba(' + K.col + ',' + a.toFixed(3) + ')';
          ctx.fillRect(T[idx].x - h2, T[idx].y - h2, K.w, K.w);
        }
        if (h < 0 || h >= L) continue;
        const pt = T[Math.floor(h)], fade = Math.min(1, h / 14, (L - h) / 14) * K.orbA;
        heads.push(pt.y);
        const gr = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, K.halo);
        gr.addColorStop(0, 'rgba(' + K.col + ',' + (.55 * fade).toFixed(3) + ')');
        gr.addColorStop(.25, 'rgba(' + K.col + ',' + (.22 * fade).toFixed(3) + ')');
        gr.addColorStop(.6, 'rgba(' + K.col + ',' + (.07 * fade).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(' + K.col + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(pt.x, pt.y, K.halo, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,235,' + (.95 * fade).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(pt.x, pt.y, K.orb, 0, 6.2832); ctx.fill();
      }
    }
    self.heads[pi] = heads;
  }
  function frame(now) {
    if (!t0) t0 = now;
    const el2 = now - t0, t = el2 / 1000, grow = o.grow ? o.grow() : 1;
    ctx.clearRect(0, 0, W, H);
    // grey first, neon last, so the chosen line sits on top
    for (let pass = 0; pass < 2; pass++) {
      paths.forEach((P, pi) => {
        const kind = o.kind ? o.kind(P) : P.kind;
        if ((kind === 'on') !== (pass === 1)) return;
        drawPath(P, KIND[kind], t, pi, grow);
      });
    }
    if (o.over) o.over(ctx, W, H, el2);
  }
  function loop(now) {
    if (!canvas.isConnected) { running = false; return; }
    frame(now);
    if (reduce) { running = false; return; }
    requestAnimationFrame(loop);
  }
  this.start = function () { if (!running) { running = true; requestAnimationFrame(loop); } };
  this.redraw = function () { if (!running) requestAnimationFrame(frame); };
}

/* ------------------------------------------------ DOM-measured flows (home tree, episode list) */
function centerIn(node, box) {
  const r = node.getBoundingClientRect(), b = box.getBoundingClientRect();
  return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
}
function domFlow(box, pathsFn, over, grow) {
  const cv = el('canvas', 'flow'); cv.setAttribute('aria-hidden', 'true'); box.insertBefore(cv, box.firstChild);
  const f = new Flow(cv, { paths: pathsFn, over, grow });
  function fit() { f.layout({ w: box.clientWidth, h: box.scrollHeight }); f.start(); f.redraw(); }
  requestAnimationFrame(fit);
  const ro = new ResizeObserver(() => fit()); ro.observe(box);
  return { flow: f, fit, ro };
}

/* ------------------------------------------------ 01 HOME: tap a question, the neon line goes down to its answer */
export function initHome() {
  const box = document.getElementById('home-tree');
  let path = [2], rootOpen = true, treeFlow = null;

  function treePaths() {
    const out = [];
    const pt = box.querySelector('.point'); if (!pt || !rootOpen) return out;
    const pc = centerIn(pt, box);
    // grey paths for every branch, and one continuous neon path from the point down to the deepest open question
    function walk(ol, from, chain) {
      const lis = [].filter.call(ol.children, (x) => x.tagName === 'LI');
      if (!lis.length) return;
      const cs = lis.map((li) => centerIn(li.querySelector(':scope > .st'), box));
      let open = null;
      out.push({ kind: 'off', pts: [{ x: from.x, y: from.y }, { x: from.x, y: cs[cs.length - 1].y }] });
      lis.forEach((li, i) => {
        out.push({ kind: 'off', pts: [{ x: from.x, y: cs[i].y }, { x: cs[i].x, y: cs[i].y }] });
        if (li.classList.contains('on')) open = { li, c: cs[i] };
      });
      if (!open) { if (chain.length > 1) out.push({ kind: 'on', pts: chain }); return; }
      const next = chain.concat([{ x: from.x, y: open.c.y }, { x: open.c.x, y: open.c.y }]);
      const sub = open.li.querySelector(':scope > ol');
      if (sub) walk(sub, open.c, next); else out.push({ kind: 'on', pts: next });
    }
    const tree = box.querySelector(':scope > .tree');
    if (tree) walk(tree, pc, [pc]);
    return out;
  }

  function list(kids, depth, cls) {
    const ol = el('ol', cls), openIdx = path[depth];
    kids.forEach((k, i) => {
      const n = EP[k.id], li = el('li');
      if (openIdx === i) li.className = 'on';
      li.appendChild(el('span', 'st'));
      const node = el('div', 'node');
      const b = txt('button', 'q', k.q || n.q);
      b.setAttribute('aria-expanded', openIdx === i ? 'true' : 'false');
      b.onclick = () => {
        if (path[depth] === i) path = path.slice(0, depth);
        else { path = path.slice(0, depth); path[depth] = i; }
        render();
      };
      node.appendChild(b);
      if (openIdx === i) {
        const o = el('div', 'open');
        o.appendChild(txt('p', 'body', n.a));
        o.appendChild(epChip(n));
        node.appendChild(o);
      }
      li.appendChild(node);
      if (openIdx === i && k.kids) li.appendChild(list(k.kids, depth + 1, 'sub'));
      ol.appendChild(li);
    });
    return ol;
  }

  function render() {
    if (treeFlow) { treeFlow.ro.disconnect(); treeFlow = null; }
    box.innerHTML = '';
    const root = EP[TREE.id];
    const hero = el('div', 'hero');
    const cv = el('canvas', 'point'); cv.tabIndex = 0; cv.setAttribute('role', 'button'); cv.setAttribute('aria-label', 'open the question');
    const h = el('h1', 'h1'); h.textContent = root.q; h.appendChild(el('i', 'cursor'));
    function toggle() { rootOpen = !rootOpen; path = []; render(); }
    cv.onclick = toggle; h.onclick = toggle;
    cv.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
    hero.appendChild(cv); hero.appendChild(h);
    const body = el('div', 'hero-body' + (rootOpen ? ' open' : ''));
    if (rootOpen) {
      body.appendChild(txt('p', 'body', root.a));
      body.appendChild(epChip(root));
      body.appendChild(el('div', 'legend', '<span class="lab"><i class="fm basics"></i>basics: start here</span><span class="lab"><i class="fm layer"></i>layer: one concept</span><span class="lab"><i class="fm pulse"></i>pulse: this week</span>'));
    } else {
      body.appendChild(txt('span', 'lab', 'tap the point'));
    }
    hero.appendChild(body);
    box.appendChild(hero);
    if (rootOpen) box.appendChild(list(TREE.kids, 0, 'tree'));
    requestAnimationFrame(() => { const small = cv.clientWidth < 80; pointCloud(cv, small ? 300 : 460, small ? 6 : 11); });
    treeFlow = domFlow(box, treePaths);
  }

  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (treeFlow) treeFlow.fit(); });
}

/* ------------------------------------------------ 02 EPISODES: pick a question, then follow it as a sequence */
export function initEpisodes() {
  const STAGGER = 90, ARRIVE = 500;
  let bsel = 'check', routeFlow = null, routeMarks = [], shownAt = -1e9, routeCount = 0;
  const wrap = document.getElementById('route-wrap');

  function routePaths() {
    const mks = [].slice.call(wrap.querySelectorAll('.mk')); if (mks.length < 2) return [];
    routeMarks = mks.map((m) => ({ li: m.parentNode, y: centerIn(m, wrap).y, lit: false }));
    return [{ kind: 'on', pts: [centerIn(mks[0], wrap), centerIn(mks[mks.length - 1], wrap)] }];
  }
  // the line draws down at the same pace as the episodes arrive
  function routeGrow() {
    if (reduce) return 1;
    const total = Math.max(1, routeCount - 1) * STAGGER + ARRIVE;
    return Math.min(Math.max((performance.now() - shownAt) / total, 0), 1);
  }
  // a stop lights up while the orb passes through it
  function routeOver() {
    const heads = (routeFlow && routeFlow.flow.heads[0]) || [];
    routeMarks.forEach((m) => {
      const lit = heads.some((h) => Math.abs(h - m.y) < 40);
      if (lit !== m.lit) { m.lit = lit; m.li.classList.toggle('lit', lit); }
    });
  }
  function renderPicks() {
    const box = document.getElementById('picks'); box.innerHTML = '';
    LINES.forEach((L) => {
      const st = stopsOf(L.k);
      const b = el('button', 'pickq' + (L.k === 'bed' ? ' start' : ''));
      b.setAttribute('aria-pressed', bsel === L.k ? 'true' : 'false');
      b.appendChild(el('i'));
      b.appendChild(txt('span', 'q', L.k === 'bed' ? 'start here: the basics' : L.name));
      b.appendChild(txt('span', 'lab', st.length + ' episodes // starts at ' + st[0].id));
      b.onclick = () => { bsel = L.k; renderPicks(); renderRoute(true); };
      box.appendChild(b);
    });
  }
  function renderRoute(animate) {
    const L = LINE[bsel], st = stopsOf(L.k), anim = animate && !reduce;
    document.getElementById('f-lab').textContent = 'line // ' + st.length + ' episodes // in the order they aired';
    document.getElementById('f-name').textContent = L.k === 'bed' ? 'start here: the basics' : L.name;
    document.getElementById('f-body').textContent = L.k === 'bed' ? 'the ground floor, one rung at a time. start at the top and every episode leads into the next.' : 'it starts at ' + st[0].id + ' in the basics. each episode below picks up the question where the one above it left off.';
    const ol = document.getElementById('route'); ol.innerHTML = '';
    st.forEach((n, i) => {
      const li = el('li', n.f + (anim ? ' in' : '')); li.dataset.id = n.id;
      if (anim) li.style.animationDelay = (i * STAGGER) + 'ms';
      li.appendChild(el('i', 'mk'));
      li.appendChild(txt('span', 'lab', meta(n) + (i === 0 ? ' // start' : '')));
      li.appendChild(txt('span', 'q', n.q));
      li.appendChild(txt('p', 'body', n.a));
      li.appendChild(epChip(n));
      ol.appendChild(li);
    });
    routeCount = st.length;
    shownAt = anim ? performance.now() : -1e9;
    if (animate) {
      const f = document.getElementById('follow');
      window.scrollTo({ top: window.scrollY + f.getBoundingClientRect().top - 80, behavior: reduce ? 'auto' : 'smooth' });
    }
    if (routeFlow) {
      requestAnimationFrame(routeFlow.fit);
      if (anim) setTimeout(routeFlow.fit, (st.length - 1) * STAGGER + ARRIVE + 60);
    }
  }

  renderPicks(); renderRoute(false);
  routeFlow = domFlow(wrap, routePaths, routeOver, routeGrow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => routeFlow.fit());
}

/* ------------------------------------------------ the line map */
function LineMap(canvas, opt) {
  const self = this;
  let nodes = [], byId = {}, titles = false, titleX = 0, listW = 0, row = opt.row, cloud = [];
  this.sel = opt.sel || 'check'; this.picked = null; this.hover = null;
  function route(a, b, xl) {
    const d1 = Math.abs(xl - a.x), d2 = Math.abs(b.x - xl);
    if (b.y - a.y < d1 + d2 + 2) return [a, b];
    return [a, { x: xl, y: a.y + d1 }, { x: xl, y: b.y - d2 }, b];
  }
  const flow = new Flow(canvas, {
    paths() {
      return LINES.map((L) => {
        const xl = nodes.cx + L.lane * nodes.lw, stops = stopsOf(L.k).map((n) => byId[n.id]);
        let pts = [stops[0]];
        for (let s = 0; s < stops.length - 1; s++) pts = pts.concat(route(stops[s], stops[s + 1], xl).slice(1));
        return { k: L.k, pts };
      });
    },
    kind(P) { return P.k === self.sel ? 'on' : (P.k === 'bed' ? 'bed' : 'off'); },
    over: drawStations,
  });
  this.layout = function () {
    const W = canvas.parentNode.clientWidth;
    titles = opt.titles && W >= 680;
    row = W < 420 ? opt.row - 4 : opt.row;
    let lw, cx;
    const top = opt.top;
    if (titles) {
      // a narrow tree on the left, the episode list right beside it, all inside the reading column
      // the tree starts at the left edge of the reading column, the same edge as the text above it
      // the tree starts at the left edge of the reading column and the list ends at its right edge,
      // so the map fills the same centred column as the other pages
      const ctx = canvas.getContext('2d'); ctx.font = '500 14px Poppins, sans-serif';
      listW = 120 + Math.max(...ALL.map((n) => ctx.measureText(n.t).width)) + 8;
      titleX = W - listW;
      lw = Math.min(56, Math.max(30, (titleX - 64 - 10) / 5)); cx = 5 + lw * 3;
    } else {
      // phone: the tree sits in the middle of the screen. The lanes run from -3 to +2 (5 gaps),
      // and the stop labels need about 40px to the right of the last lane, so centre both together.
      const label = 40;
      lw = Math.min(56, (W - label - 48) / 5);
      cx = (W - (lw * 5 + label)) / 2 + lw * 3;
      titleX = cx + lw * 2 + 40;
    }
    nodes = ALL.map((n, i) => ({ n, x: cx + LINE[n.p].lane * lw, y: top + i * row }));
    nodes.cx = cx; nodes.lw = lw;
    byId = {}; nodes.forEach((m) => { byId[m.n.id] = m; }); self.byId = byId;
    cloud = []; for (let k = 0; k < 280; k++) cloud.push({ r: Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * 6, a: Math.random() * 6.283, w: (Math.random() - .5) * .006, z: .4 + Math.random() * .6 });
    flow.layout({ w: W, h: top + ALL.length * row + 32 });
    self.nodes = nodes;
  };
  function drawStations(ctx, W) {
    const r0 = byId[TREE.id], cyc = r0.y - 28, sel = self.sel;
    for (let i = 0; i < cloud.length; i++) {
      const c = cloud[i]; if (!reduce) c.a += c.w;
      ctx.fillStyle = 'rgba(' + (c.r < 5 ? NEON : WHITE) + ',' + (c.z * Math.max(.2, 1 - c.r / 18)).toFixed(2) + ')';
      ctx.fillRect(r0.x + Math.cos(c.a) * c.r, cyc + Math.sin(c.a) * c.r, 1.3, 1.3);
    }
    nodes.forEach((m) => {
      const n = m.n, lit = onLine(n, sel), hot = self.hover === n || self.picked === n, s = 10;
      if (hot) {
        ctx.fillStyle = 'rgba(' + NEON + ',.2)'; ctx.fillRect(m.x - 11, m.y - 11, 22, 22);
        if (titles) { ctx.fillStyle = 'rgba(' + NEON + ',.06)'; ctx.fillRect(titleX - 12, m.y - row / 2, listW + 12, row); }
      }
      const neon = 'rgb(' + NEON + ')';
      if (n.f === 'pulse') {
        ctx.fillStyle = '#000'; ctx.fillRect(m.x - s / 2, m.y - s / 2, s, s);
        ctx.strokeStyle = lit || hot ? neon : '#7C7C7C'; ctx.lineWidth = 2; ctx.strokeRect(m.x - s / 2 + 1, m.y - s / 2 + 1, s - 2, s - 2);
      } else {
        ctx.fillStyle = n.f === 'basics' ? (sel === 'bed' || hot ? neon : '#F5F5F5') : (lit || hot ? neon : '#5A5A5A');
        ctx.fillRect(m.x - s / 2, m.y - s / 2, s, s);
      }
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '1.6px';
      if (titles) {
        // id, then the release date, then the title: the date sits right beside its episode
        ctx.textAlign = 'left'; ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = lit || hot ? '#EAFF3D' : '#7C7C7C';
        ctx.fillText(n.id, titleX, m.y);
        ctx.fillStyle = '#7C7C7C';
        ctx.fillText((n.d || 'basics').toUpperCase(), titleX + 44, m.y);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.font = (lit || hot ? '500 ' : '400 ') + '14px Poppins, sans-serif'; ctx.fillStyle = lit || hot ? '#F5F5F5' : '#9A9A9A';
        ctx.fillText(n.t, titleX + 120, m.y);
      } else if (lit || hot) {
        ctx.textAlign = 'left'; ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.fillStyle = '#EAFF3D';
        ctx.fillText(n.id, m.x + 12, m.y);
      }
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    });
  }
  this.hit = function (x, y) {
    let best = null, bd = 16;
    nodes.forEach((m) => {
      let d = Math.hypot(m.x - x, m.y - y);
      if (titles && x > titleX - 8 && x < titleX + listW && Math.abs(m.y - y) < row / 2) d = 0;
      if (d < bd) { bd = d; best = m.n; }
    });
    return best;
  };
  this.start = function () { flow.start(); };
  this.redraw = function () { flow.redraw(); };
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect(), n = self.hit(e.clientX - r.left, e.clientY - r.top);
    if (opt.onPick) opt.onPick(n);
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect(), n = self.hit(e.clientX - r.left, e.clientY - r.top);
    canvas.style.cursor = n ? 'pointer' : 'default';
    if (n !== self.hover) { self.hover = n; self.redraw(); }
    if (n) { const m = byId[n.id]; showTip(n, r.left + (titles && e.clientX - r.left > titleX - 8 ? e.clientX - r.left : m.x), r.top + m.y - 8); } else hideTip();
  });
  canvas.addEventListener('mouseleave', () => { self.hover = null; hideTip(); self.redraw(); });
}

/* ------------------------------------------------ 03 MAP: tree on the left (40%), episode list on the right (60%) */
export function initMap() {
  let map1 = null;
  const pop = document.getElementById('map-pop');
  function mapSum() {
    const st = stopsOf(map1.sel);
    document.getElementById('map-sum').textContent = (map1.sel === 'bed' ? 'start here' : LINE[map1.sel].name) + ' // ' + st.length + ' stops // ' + st[0].id + ' to ' + st[st.length - 1].id;
  }
  function hidePop() { pop.hidden = true; }
  function showPop(n) {
    const wrap = pop.parentNode, m = map1.byId[n.id];
    pop.innerHTML = '';
    const x = el('button', 'x', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M6 6l12 12M18 6L6 18"/></svg>');
    x.setAttribute('aria-label', 'close'); x.onclick = () => { map1.picked = null; hidePop(); map1.redraw(); };
    pop.appendChild(x);
    pop.appendChild(txt('span', 'lab', meta(n) + (n.ls.length > 1 ? ' // interchange of ' + n.ls.length + ' lines' : '')));
    pop.appendChild(txt('span', 'q', n.q));
    pop.appendChild(txt('p', 'body', n.b));
    pop.appendChild(epChip(n));
    pop.hidden = false;
    const W = wrap.clientWidth, pw = pop.offsetWidth;
    let left = m.x + 24;
    if (left + pw > W - 16) left = Math.max(16, m.x - pw - 24);
    pop.style.left = left + 'px'; pop.style.top = Math.max(8, m.y - 24) + 'px';
  }
  function mapChips() {
    const box = document.getElementById('map-chips');
    box.innerHTML = '';
    box.appendChild(txt('span', 'lab', 'pick a line'));
    LINES.forEach((L) => {
      const b = txt('button', 'chip', L.name);
      b.setAttribute('aria-pressed', map1.sel === L.k ? 'true' : 'false');
      b.onclick = () => setMapSel(L.k);
      box.appendChild(b);
    });
  }
  function setMapSel(k) { map1.sel = k; map1.picked = null; hidePop(); mapChips(); mapSum(); map1.redraw(); }

  map1 = new LineMap(document.getElementById('map1'), { titles: true, row: 24, top: 72, sel: 'check', onPick(n) {
    hideTip();
    if (!n) { map1.picked = null; hidePop(); map1.redraw(); return; }
    map1.picked = n;
    if (!onLine(n, map1.sel)) { map1.sel = n.f === 'basics' ? 'bed' : n.p; mapChips(); mapSum(); }
    showPop(n); map1.redraw();
  } });
  map1.layout(); mapChips(); mapSum(); map1.start();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt); rt = setTimeout(() => { hidePop(); map1.picked = null; map1.layout(); map1.redraw(); }, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { map1.layout(); map1.redraw(); });
}
