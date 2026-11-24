const CANDLES = CFG.age, GAP = CANDLES > 1 ? Math.min(22, 116 / (CANDLES - 1)) : 0, FIRST = 150 - (CANDLES - 1) * GAP / 2;
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- fit the 300x600 stage to the screen ---------- */
let S = 1, OX = 0, OY = 0;
function fit() {
  const w = innerWidth, h = innerHeight;
  S = Math.min(w / 300, h / 600);
  OX = (w - 300 * S) / 2;
  OY = (h - 600 * S) / 2;
  $('world').style.transform = `translate(${OX}px,${OY}px) scale(${S})`;
  const d = Math.min(2, devicePixelRatio || 1), c = $('fx');
  c.width = w * d;
  c.height = h * d;
}
addEventListener('resize', fit);
fit();
const toWorld = e => [(e.clientX - OX) / S, (e.clientY - OY) / S];

const TINT = { s1: '#e2cdf8', s2: '#fffdf8', s3: '#fffdf8', s4: '#ffe3f1', s5: '#fffdf8' };
let scene = 's1';
function go(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.toggle('on', s.id === id));
  document.body.style.backgroundColor = TINT[id];
  scene = id;
  ENTER[id] && ENTER[id]();
}

/* ---------- sound ---------- */
let ac, out;
function unlock() {
  // Lets the music play on an iPhone whose side switch is on silent
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      out = ac.createGain();
      out.gain.value = .55;
      const squash = ac.createDynamicsCompressor();
      out.connect(squash).connect(ac.destination);
    }
    if (ac.state !== 'running') ac.resume();
  } catch {}
}
addEventListener('pointerdown', unlock, true);
addEventListener('touchend', unlock, true);
const hz = m => 440 * 2 ** ((m - 69) / 12);
let live = [];
function bell(midi, at = 0, len = .9, vol = .4, parts = [[1, 1], [2, .35], [4, .12]]) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .012);
  g.gain.exponentialRampToValueAtTime(.001, t + len);
  g.connect(out);
  for (const [mult, v] of parts) {
    const o = ac.createOscillator(), p = ac.createGain();
    o.type = mult === 1 ? 'triangle' : 'sine';
    o.frequency.value = hz(midi) * mult;
    p.gain.value = v;
    o.connect(p).connect(g);
    o.start(t);
    o.stop(t + len + .05);
    live.push(o);
    o.onended = () => { live = live.filter(x => x !== o); };
  }
}
const hush = () => { live.forEach(o => { try { o.stop(); } catch {} }); live = []; };
const chime = () => [72, 76, 79, 84].forEach((n, i) => bell(n, i * .09, 1, .3));
const tada = () => {
  [65, 69, 72].forEach(n => bell(n, 0, .35, .22));
  [65, 69, 72].forEach(n => bell(n, .18, .35, .22));
  [65, 69, 72, 77, 81].forEach(n => bell(n, .38, 1.8, .22));
};
let popN = 0;
const pop = () => bell([72, 74, 76, 79, 81, 84][popN++ % 6], 0, .5, .3);
function puff() {
  if (!ac) return;
  const n = ac.createBufferSource(), b = ac.createBuffer(1, ac.sampleRate * .25, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 2;
  const f = ac.createBiquadFilter(), g = ac.createGain();
  f.type = 'lowpass';
  f.frequency.value = 900;
  g.gain.value = .6;
  n.buffer = b;
  n.connect(f).connect(g).connect(out);
  n.start();
}

/* ---------- confetti and sparkles ---------- */
const INK = ['#ff6fb1', '#a15fe0', '#ffc93c', '#ff9fcb', '#c79bf2', '#8ed3c5'];
let bits = [], raf = 0;
const heartPath = new Path2D('M0 6C-3-4-14-2-10 7C-8 12-2 15 0 18C2 15 8 12 10 7C14-2 3-4 0 6Z');
const starPath = new Path2D();
for (let i = 0; i < 10; i++) {
  const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 4.5 : 10;
  starPath[i ? 'lineTo' : 'moveTo'](q * Math.cos(a), q * Math.sin(a));
}
starPath.closePath();
function tick() {
  const c = $('fx'), x = c.getContext('2d'), d = c.width / innerWidth;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, c.width, c.height);
  bits = bits.filter(b => b.life > 0 && b.y < innerHeight + 40);
  for (const b of bits) {
    b.x += b.vx; b.y += b.vy; b.vy += b.g; b.vx *= .985; b.r += b.vr; b.life -= 1;
    x.setTransform(d, 0, 0, d, 0, 0);
    x.translate(b.x, b.y);
    x.rotate(b.r);
    x.scale(b.s, b.s);
    x.globalAlpha = Math.min(1, b.life / 25);
    x.fillStyle = b.c;
    if (b.k === 0) x.fill(heartPath);
    else if (b.k === 1) x.fill(starPath);
    else x.fillRect(-6, -3, 12, 6);
  }
  x.globalAlpha = 1;
  raf = bits.length ? requestAnimationFrame(tick) : 0;
}
const rnd = (a, b) => a + Math.random() * (b - a);
function add(b) {
  bits.push({ c: INK[Math.random() * INK.length | 0], k: Math.random() * 3 | 0, r: rnd(0, 6), vr: rnd(-.15, .15), ...b });
  if (!raf) raf = requestAnimationFrame(tick);
}
function burst(wx, wy, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.3), v = rnd(1, 6);
    add({ x: OX + wx * S, y: OY + wy * S, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: .12, s: rnd(.5, 1.1) * S, life: rnd(35, 65), k: Math.random() * 2 | 0 });
  }
}
function confetti(n) {
  if (calm) n = n / 5 | 0;
  for (let i = 0; i < n; i++) add({ x: rnd(0, innerWidth), y: rnd(-innerHeight * .7, -10), vx: rnd(-1, 1), vy: rnd(2, 5), g: .02, s: rnd(.6, 1.2) * S, life: 400 });
}

/* ---------- 1. envelope ---------- */
$('open').onclick = async () => {
  if ($('s1').classList.contains('opening')) return;
  $('s1').classList.add('opening');
  const e = $('env').classList;
  unlock();
  chime();
  burst(150, 306, 26);
  e.add('o1'); await wait(350);
  e.add('o2'); await wait(450);
  e.add('o3'); await wait(400);
  e.add('o4'); bell(79, 0, .8, .25); await wait(1000);
  e.add('o5'); await wait(650);
  go('s2');
};

/* ---------- 2. rub to color ---------- */
const CELL = 10, PAPER = [255, 253, 248];
let cells = [], LEFT = new Set();
// Find the spots that hold color, so the blank sky doesn't count as coloring left to do
async function findCells() {
  const load = async (src, x, y, w, h) => { const i = new Image(); i.src = src; await i.decode(); g.drawImage(i, x, y, w, h); };
  const c = document.createElement('canvas');
  c.width = 300;
  c.height = 600;
  const g = c.getContext('2d', { willReadFrequently: true });
  await load('img/scenebg.webp', -300, -50, 900, 700);
  await load('img/uni.webp', -4, 394, 188, 178);
  await load('img/prin.webp', 164, 384, 126, 184);
  const d = g.getImageData(0, 0, 300, 600).data;
  cells = [];
  for (let x = 0; x < 300; x += CELL) for (let y = 0; y < 600; y += CELL) {
    let n = 0;
    for (let i = 0; i < CELL; i++) for (let j = 0; j < CELL; j++) {
      const p = ((y + j) * 300 + x + i) * 4;
      if (Math.abs(d[p] - PAPER[0]) + Math.abs(d[p + 1] - PAPER[1]) + Math.abs(d[p + 2] - PAPER[2]) > 30) n++;
    }
    if (n > CELL * CELL * .3) cells.push([x + CELL / 2, y + CELL / 2]);
  }
  LEFT = new Set(cells);
}
const colored = () => cells.length ? 1 - LEFT.size / cells.length : 0;
const art = new Image();
art.src = 'img/lines.webp';
let rubK = 1, rubbing = false, last = null, rubDone = true, pause;
async function freshPage() {
  const c = $('page'), x = c.getContext('2d');
  rubK = Math.min(2, Math.max(1, S * (devicePixelRatio || 1)));
  c.width = 900 * rubK;
  c.height = 700 * rubK;
  try { await art.decode(); } catch {}
  x.setTransform(rubK, 0, 0, rubK, 0, 0);
  x.drawImage(art, 0, 0, 900, 700);
  x.globalCompositeOperation = 'destination-out';
  x.lineCap = x.lineJoin = 'round';
  x.lineWidth = 64;
}
freshPage();
findCells();
function crayonAt(x, y) { $('crayon').style.transform = `translate(${x - 12}px,${y - 4}px) rotate(28deg)`; }
function rubTo([x, y]) {
  const c = $('page').getContext('2d'), p = last || [x, y];
  c.beginPath();
  c.moveTo(p[0] + 300, p[1] + 50);
  c.lineTo(x + 300.01, y + 50);
  c.stroke();
  const steps = Math.max(1, Math.hypot(x - p[0], y - p[1]) / 8 | 0);
  for (let i = 0; i <= steps; i++) {
    const px = p[0] + (x - p[0]) * i / steps, py = p[1] + (y - p[1]) * i / steps;
    for (const c of LEFT) if (Math.hypot(c[0] - px, c[1] - py) < 32) LEFT.delete(c);
  }
  last = [x, y];
  crayonAt(x, y);
  if (Math.random() < .3) add({ x: OX + x * S, y: OY + y * S, vx: rnd(-1.5, 1.5), vy: rnd(-2, 0), g: .05, s: rnd(.3, .6) * S, life: 35, k: 1 });
  if (colored() > .4) $('n2').classList.add('show');
  clearTimeout(pause);
  if (colored() >= .995) finishPage();
  else if (colored() > .985) pause = setTimeout(finishPage, 700);
}
function finishPage() {
  if (rubDone) return;
  rubDone = true;
  rubbing = false;
  clearTimeout(pause);
  $('n2').classList.remove('show');
  $('s2').classList.add('done');
  tada();
  confetti(110);
  setTimeout(() => { if (scene === 's2' && rubDone) { chime(); go('s3'); } }, 6000);
}
$('s2').addEventListener('pointerdown', e => {
  if (rubDone || e.target.id === 'n2') return;
  crayonGhost && crayonGhost.cancel();
  crayonGhost = null;
  rubbing = true;
  last = null;
  $('rubhint').style.opacity = 0;
  rubTo(toWorld(e));
});
addEventListener('pointermove', e => {
  if (!rubbing) return;
  for (const m of (e.getCoalescedEvents && e.getCoalescedEvents().length ? e.getCoalescedEvents() : [e])) if (rubbing) rubTo(toWorld(m));
});
for (const t of ['pointerup', 'pointercancel']) addEventListener(t, () => {
  const was = rubbing;
  rubbing = false;
  if (was && colored() > .985) finishPage();
});
$('n2').onclick = finishPage;
let crayonGhost;

/* ---------- 3. color the unicorn ---------- */
const CRAY = ['#ff4f9e', '#a15fe0', '#ffc93c', '#58c7b3', '#6aa5f5', '#ff8a4c'];
const HEART = 'M78 144.600C74.700 133.600 62.600 135.800 67 145.700C69.200 151.200 75.800 154.500 78 157.800C80.200 154.500 86.800 151.200 89 145.700C93.400 135.800 81.300 133.600 78 144.600Z';
const PARTS = [
  ['tail', 'M56 138C12 112-6 168 18 188C4 200 14 226 36 216C62 204 46 178 64 162Z'],
  ['tail2', 'M54 146C28 138 18 164 34 182C26 192 30 204 40 200C54 192 44 176 60 160Z'],
  ['leg1', 'M92 168h20v46a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z'],
  ['leg2', 'M138 164h20v50a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6Z'],
  ['body', 'M46 150C46 112 88 104 112 110C118 92 128 78 144 74L180 116C168 130 166 146 164 158C162 190 130 196 104 194C70 194 46 182 46 150Z'],
  ['leg3', 'M66 176h23v42a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z'],
  ['leg4', 'M116 178h23v40a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z'],
  ['hoof1', 'M66 208h23v10a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z'],
  ['hoof2', 'M116 208h23v10a8 8 0 0 1-8 8h-7a8 8 0 0 1-8-8Z'],
  ['heart', HEART],
  ['mane', 'M122 150C94 146 92 120 108 112C94 100 102 78 120 78C118 56 140 42 154 52C160 70 150 76 146 88C142 104 148 112 138 122C140 136 134 148 122 150Z'],
  ['horn', 'M166 54L194 4L190 58Z'],
  ['ear', 'M140 64L136 32Q156 38 162 56Z'],
  ['head', 'M126 92C124 62 148 50 170 52C194 54 206 68 208 84C226 88 232 102 226 114C220 128 200 130 184 126C154 134 128 120 126 92Z'],
  ['muzzle', 'M206 86C225 89 231 102 225 113C219 125 202 128 189 125C186 108 192 92 206 86Z'],
  ['cheek', 'M154 106a9 6 0 1 0 18 0a9 6 0 1 0-18 0Z'],
  ['bangs', 'M152 40C136 46 136 66 148 74C150 82 158 80 160 72C172 70 176 56 168 48C164 40 158 38 152 40Z']
];
const FACE = '<g pointer-events="none"><path fill="none" stroke="#4b3a5c" stroke-width="2" d="M173 42L191 48M180 29L192 34"/><circle cx="215" cy="100" r="2.6" fill="#4b3a5c"/><path fill="none" stroke="#4b3a5c" stroke-width="2.6" d="M196 115Q206 121 215 114"/><ellipse cx="180" cy="86" rx="7" ry="9.500" fill="#4b3a5c"/><circle cx="182.500" cy="82" r="3" fill="#fff"/><path fill="none" stroke="#4b3a5c" stroke-width="2.400" d="M172 80L164 76M173 76L167 69M178 74L175 67"/></g>';
const thin = { heart: 2, cheek: 2, muzzle: 2 };
let paintC = 0, painted = {};
function uniSvg(tag) {
  return `<defs>${CRAY.map((c, i) => `<pattern id="${tag}${i}" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="${c}"/><image href="img/fleck.webp" width="100" height="100" opacity=".75"/></pattern>`).join('')}</defs>` +
    `<g class="k">${PARTS.map(([n, d]) => `<path data-p="${n}" d="${d}" fill="${n in painted ? `url(#${tag}${painted[n]})` : '#fff'}" stroke="#4b3a5c" stroke-width="${thin[n] || 3}"/>`).join('')}${FACE}</g>`;
}
function drawPaint() {
  $('paint').innerHTML = `<g transform="translate(14 6) scale(1.16)">${uniSvg('a')}</g>`;
  $('paint').querySelectorAll('[data-p]').forEach(p => {
    p.onpointerdown = e => {
      e.preventDefault();
      painted[p.dataset.p] = paintC;
      p.setAttribute('fill', `url(#a${paintC})`);
      pop();
      burst(...toWorld(e), 7);
      if (Object.keys(painted).length >= 3) $('n3').classList.add('show');
    };
  });
}
function drawCrayons() {
  $('crayons').innerHTML = CRAY.map((c, i) => `<g data-c="${i}" role="button" aria-label="Crayon ${i + 1}" style="transform:translate(${18 + i * 45}px,${i === paintC ? 18 : 42}px)"><path d="M0 22L19-14L38 22V240H0Z" fill="${c}" stroke="#4b3a5c" stroke-width="2.500" stroke-linejoin="round"/><path d="M0 40H38M0 48H38" stroke="#4b3a5c" stroke-width="2.500"/></g>`).join('');
  $('crayons').querySelectorAll('g').forEach(g => {
    g.onpointerdown = () => {
      paintC = +g.dataset.c;
      bell(60 + paintC * 2, 0, .4, .25);
      $('crayons').querySelectorAll('g').forEach((h, n) => { h.style.transform = `translate(${18 + n * 45}px,${n === paintC ? 18 : 42}px)`; });
    };
  });
}
$('n3').onclick = () => { chime(); go('s4'); };

/* ---------- 4. song and candles ---------- */
const BEAT = .56;
// The name gets three beats: one note per syllable, the last one held
const SYL = CFG.syllables;
const NAME_NOTES = SYL.map((s, i) => i === SYL.length - 1 ? [s, 62, SYL.length > 1 ? 2 : 3] : [s, 64, 1 / (SYL.length - 1)]);
const LINES = [
  [['Hap', 60, .75], ['py ', 60, .25], ['birth', 62, 1], ['day', 60, 1], ['to ', 65, 1], ['you', 64, 2]],
  [['Hap', 60, .75], ['py ', 60, .25], ['birth', 62, 1], ['day', 60, 1], ['to ', 67, 1], ['you', 65, 2]],
  [['Hap', 60, .75], ['py ', 60, .25], ['birth', 72, 1], ['day', 69, 1], ['dear ', 65, 1], ...NAME_NOTES],
  [['Hap', 70, .75], ['py ', 70, .25], ['birth', 69, 1], ['day', 65, 1], ['to ', 67, 1], ['you', 65, 3]]
];
const CHORDS = [[1, 41, 57, 60], [4, 36, 55, 60], [7, 36, 55, 60], [10, 41, 57, 60], [13, 41, 57, 60], [16, 34, 53, 58], [19, 41, 57, 60], [21, 36, 55, 58], [22, 41, 57, 60]];
let songTimers = [], lit = CANDLES;
function stopSong() { songTimers.forEach(clearTimeout); songTimers = []; hush(); }
function showLine(n) {
  $('lyric').innerHTML = LINES[n].map(([t], i) => (i === 4 ? '<br>' : '') + `<span>${t.trim()}</span>` + (t.endsWith(' ') ? ' ' : '')).join('');
}
let starAt = null;
function starTo(sp, dur) {
  const x = sp.offsetLeft + sp.offsetWidth / 2, y = $('lyric').offsetTop + sp.offsetTop + 2;
  const b = $('bstar'), from = starAt || [x, y - 30];
  b.style.opacity = 1;
  b.animate([
    { transform: `translate(${from[0]}px,${from[1]}px)` },
    { transform: `translate(${(from[0] + x) / 2}px,${Math.min(from[1], y) - 20}px)` },
    { transform: `translate(${x}px,${y}px)` }
  ], { duration: calm ? 1 : Math.min(280, dur * 800), fill: 'forwards', easing: 'ease-out' });
  starAt = [x, y];
}
function sing() {
  stopSong();
  $('s4').classList.remove('ready');
  starAt = null;
  let t = .5;
  const at = (s, f) => songTimers.push(setTimeout(f, s * 1000));
  LINES.forEach((notes, n) => {
    at(Math.max(0, t - .28), () => showLine(n));
    notes.forEach(([, m, len], i) => {
      bell(m + 12, t, Math.max(.7, len * BEAT * 1.6), .34);
      at(t, () => {
        const sp = $('lyric').querySelectorAll('span');
        sp.forEach((q, j) => q.classList.toggle('on', j === i));
        if (sp[i]) starTo(sp[i], len * BEAT);
      });
      t += len * BEAT;
    });
  });
  for (const [b, ...ns] of CHORDS) ns.forEach((m, i) => bell(m + 12, .5 + b * BEAT, 1.2, i ? .1 : .18, [[1, 1], [2, .2]]));
  at(t, () => { $('bstar').style.opacity = 0; $('s4').classList.add('ready'); });
}
function drawCandles() {
  lit = CANDLES;
  $('candles').innerHTML = [...Array(CANDLES)].map((_, i) => `<g data-i="${i}" transform="translate(${FIRST + i * GAP} 70)"><rect x="-4" width="8" height="52" fill="${i % 2 ? '#a15fe0' : '#e8509c'}" stroke="#5a2f83" stroke-width="2"/><path class="smoke" d="M0-4q-6-8 0-14q6-7 0-14" fill="none" stroke="#b9a9c6" stroke-width="3" stroke-linecap="round"/><path class="fl" d="M0-28C9-14 9-4 0-3C-9-4-9-14 0-28Z" fill="#ffb52e" stroke="#e0710e" stroke-width="1.500"/></g>`).join('');
}
let swipe = false;
function blowAt(e) {
  const [x, y] = toWorld(e);
  if (y < 205 || y > 345 || x < 60 || x > 240) return;
  let best = null;
  $('candles').querySelectorAll('g:not(.out)').forEach(g => {
    const d = Math.abs(FIRST + g.dataset.i * GAP - x);
    if (d < 20 && (!best || d < best[0])) best = [d, g];
  });
  if (!best) return;
  if (!$('s4').classList.contains('ready')) return 'early';
  best[1].classList.add('out');
  puff();
  burst(FIRST + best[1].dataset.i * GAP, 255, 6);
  if (--lit === 0) allOut();
}
async function allOut() {
  $('blow').style.opacity = 0;
  stopSong();
  puff();
  await wait(250);
  tada();
  confetti(160);
  await wait(2600);
  go('s5');
}
$('s4').addEventListener('pointerdown', e => {
  if (e.target.id === 'again') return;
  swipe = true;
  if (blowAt(e) === 'early') pop();
});
$('s4').addEventListener('pointermove', e => { if (swipe) blowAt(e); });
for (const t of ['pointerup', 'pointercancel']) addEventListener(t, () => { swipe = false; });
$('again').onclick = sing;

/* ---------- 5. message ---------- */
const ENTER = {
  s2() {
    rubDone = false;
    crayonAt(150, 470);
    if (!calm) crayonGhost = $('crayon').animate([[70, 480], [190, 440], [90, 520], [210, 490], [70, 480]].map(([x, y]) => ({ transform: `translate(${x}px,${y}px) rotate(28deg)` })), { duration: 3200, iterations: Infinity });
  },
  s3() {
    drawPaint();
    drawCrayons();
    setTimeout(() => $('n3').classList.add('show'), 20000);
  },
  s4() {
    $('bstar').innerHTML = '<path d="M0-15L4.400-4.600L15-4.600L6.600 2.200L9.600 13L0 6.800L-9.600 13L-6.600 2.200L-15-4.600L-4.400-4.600Z" fill="#ffc93c" stroke="#d98a00" stroke-width="2" stroke-linejoin="round"/>';
    $('lyric').innerHTML = '';
    drawCandles();
    $('blow').style.opacity = '';
    sing();
  },
  s5() {
    $('myuni').innerHTML = Object.keys(painted).length
      ? `<svg width="180" height="172" viewBox="0 0 240 230">${uniSvg('b')}</svg>`
      : '<img src="img/uni.webp" alt="A unicorn" style="left:-2px;top:-4px;width:188px;height:178px">';
    [...$('msg').children].forEach((el, i) => { el.classList.remove('in'); setTimeout(() => el.classList.add('in'), 500 + i * (calm ? 0 : 450)); });
    setTimeout(() => confetti(50), 4200);
  }
};
$('replay').onclick = () => {
  painted = {};
  LEFT = new Set(cells);
  $('env').className = '';
  $('s1').classList.remove('opening');
  $('s2').classList.remove('done');
  $('rubhint').style.opacity = '';
  for (const n of ['n2', 'n3']) $(n).classList.remove('show');
  freshPage();
  go('s1');
};

const jump = new URLSearchParams(location.search).get('go');
if (jump) go('s' + jump);
