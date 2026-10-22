// style_tests.mjs: the same lyric moment in four vector looks, so the user can pick a --style from pictures.
//   node design/style_tests.mjs [--line1="I live in a room with a"] [--line2="context window"] [--stamp="01:10 · CHORUS"]
//   -> out/design/style_test_{1_editorial,2_keynote,3_geometric,4_hybrid}.jpg + style_tests_all.jpg
// line1 = small lead-in, line2 = the hook (its last word gets the accent). The characters are generic placeholders
// (Clawd + a human); the scene is a room with one lit window. It's a look test, not the storyboard.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = 'out/design'; fs.mkdirSync(OUT, { recursive: true });
const ARG = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LINE1 = esc(ARG.line1 ?? 'I live in a room with a');
const HOOK = (ARG.line2 ?? 'context window').trim();
const HW = HOOK.lastIndexOf(' ') > 0 ? [esc(HOOK.slice(0, HOOK.lastIndexOf(' '))), esc(HOOK.slice(HOOK.lastIndexOf(' ') + 1))] : ['', esc(HOOK)];
const STAMP = esc(ARG.stamp ?? '01:10 · CHORUS');
const cap = (t) => t ? t[0].toUpperCase() + t.slice(1) : t;

// ---------- shared characters (pure geometry) ----------
// Clawd: rounded body, tall eyes, side nubs, four legs. (x,y) = centre of body bottom.
function clawd(x, y, s, o = {}) {
  const c = o.fill || '#D97757', ink = o.ink || '#1F1E1D', st = o.stroke || 'none', sw = o.sw || 0;
  const w = 260 * s, h = 190 * s, r = 30 * s, lx = x - w / 2, ty = y - h;
  const leg = (dx) => `<rect x="${x + dx * s - 13 * s}" y="${y - 4 * s}" width="${26 * s}" height="${46 * s}" rx="${8 * s}" fill="${c}" stroke="${st}" stroke-width="${sw}"/>`;
  return `<g ${o.filter ? `filter="url(#${o.filter})"` : ''}>
    ${[-95, -45, 45, 95].map(leg).join('')}
    <rect x="${lx - 34 * s}" y="${ty + 70 * s}" width="${50 * s}" height="${44 * s}" rx="${12 * s}" fill="${c}" stroke="${st}" stroke-width="${sw}"/>
    <rect x="${lx + w - 16 * s}" y="${ty + 52 * s}" width="${50 * s}" height="${44 * s}" rx="${12 * s}" fill="${c}" stroke="${st}" stroke-width="${sw}" transform="rotate(-18 ${lx + w + 9 * s} ${ty + 74 * s})"/>
    <rect x="${lx}" y="${ty}" width="${w}" height="${h}" rx="${r}" fill="${o.bodyFill || c}" stroke="${st}" stroke-width="${sw}"/>
    <rect x="${x - 62 * s}" y="${ty + 52 * s}" width="${24 * s}" height="${56 * s}" rx="${12 * s}" fill="${ink}"/>
    <rect x="${x + 38 * s}" y="${ty + 52 * s}" width="${24 * s}" height="${56 * s}" rx="${12 * s}" fill="${ink}"/>
  </g>`;
}

// Sage: shaved head, salt-and-pepper stubble, strong brow, warm half-smile, black crew-neck tee. 3/4 view facing left.
function sage(x, y, s, mode = 'flat') {
  // y = chin; head ~ 300*s tall
  const P = {
    flat: { skin: '#E3B496', shade: '#C9937A', stub: '#8C8178', tee: '#1F1E1D', ink: '#1F1E1D', line: 'none', lw: 0, hi: '#F2CDB3' },
    line: { skin: '#F4EFE6', shade: '#F4EFE6', stub: '#B7AFA6', tee: '#1F1E1D', ink: '#1F1E1D', line: '#1F1E1D', lw: 3, hi: 'none' },
    geo: { skin: '#F0B48E', shade: '#D9906B', stub: '#6E6A66', tee: '#1D2B53', ink: '#1D2B53', line: 'none', lw: 0, hi: '#FFD3B5' },
    sil: { skin: '#0D0D12', shade: '#0D0D12', stub: '#0D0D12', tee: '#0D0D12', ink: '#0D0D12', line: 'url(#rim)', lw: 4, hi: 'none' },
  }[mode];
  const k = (v) => v * s;
  return `<g transform="translate(${x} ${y})">
    <path d="M${k(-210)} ${k(330)} C${k(-200)} ${k(170)} ${k(-120)} ${k(110)} 0 ${k(105)} C${k(120)} ${k(110)} ${k(200)} ${k(170)} ${k(210)} ${k(330)} Z" fill="${P.tee}" stroke="${P.line}" stroke-width="${P.lw}"/>
    <path d="M${k(-62)} ${k(40)} L${k(-58)} ${k(118)} Q0 ${k(140)} ${k(58)} ${k(118)} L${k(62)} ${k(40)} Z" fill="${P.shade}" stroke="${P.line}" stroke-width="${P.lw}"/>
    <path d="M${k(-58)} ${k(112)} Q0 ${k(150)} ${k(58)} ${k(112)}" fill="none" stroke="${P.tee === '#0D0D12' ? 'none' : '#3A3836'}" stroke-width="${k(6)}"/>
    <ellipse cx="${k(108)}" cy="${k(-128)}" rx="${k(26)}" ry="${k(40)}" fill="${P.shade}" stroke="${P.line}" stroke-width="${P.lw}"/>
    <path d="M${k(-104)} ${k(-150)} C${k(-112)} ${k(-300)} ${k(108)} ${k(-310)} ${k(112)} ${k(-150)}
             C${k(116)} ${k(-60)} ${k(90)} ${k(-10)} ${k(40)} ${k(20)} C${k(10)} ${k(38)} ${k(-40)} ${k(36)} ${k(-70)} ${k(8)}
             C${k(-100)} ${k(-25)} ${k(-102)} ${k(-90)} ${k(-104)} ${k(-150)} Z" fill="${P.skin}" stroke="${P.line}" stroke-width="${P.lw}"/>
    <path d="M${k(-100)} ${k(-90)} C${k(-96)} ${k(-30)} ${k(-80)} ${k(0)} ${k(-50)} ${k(22)} C${k(-10)} ${k(42)} ${k(30)} ${k(30)} ${k(60)} ${k(5)}
             C${k(90)} ${k(-20)} ${k(104)} ${k(-60)} ${k(108)} ${k(-100)} L${k(84)} ${k(-82)} C${k(60)} ${k(-40)} ${k(-50)} ${k(-40)} ${k(-82)} ${k(-80)} Z"
          fill="${P.stub}" opacity="${mode === 'sil' ? 1 : .45}"/>
    <ellipse cx="${k(-20)}" cy="${k(-238)}" rx="${k(52)}" ry="${k(22)}" fill="${P.hi}" opacity=".7" transform="rotate(-12 ${k(-20)} ${k(-238)})"/>
    ${mode === 'sil' ? '' : `
    <path d="M${k(-86)} ${k(-138)} Q${k(-56)} ${k(-158)} ${k(-24)} ${k(-140)}" fill="none" stroke="${P.ink}" stroke-width="${k(9)}" stroke-linecap="round"/>
    <path d="M${k(18)} ${k(-142)} Q${k(52)} ${k(-160)} ${k(84)} ${k(-138)}" fill="none" stroke="${P.ink}" stroke-width="${k(9)}" stroke-linecap="round"/>
    <ellipse cx="${k(-54)}" cy="${k(-114)}" rx="${k(10)}" ry="${k(8)}" fill="${P.ink}"/>
    <ellipse cx="${k(50)}" cy="${k(-114)}" rx="${k(10)}" ry="${k(8)}" fill="${P.ink}"/>
    <path d="M${k(-6)} ${k(-120)} Q${k(-14)} ${k(-70)} ${k(-22)} ${k(-56)} Q${k(-4)} ${k(-48)} ${k(14)} ${k(-56)}" fill="none" stroke="${P.shade === P.skin ? P.ink : P.shade}" stroke-width="${k(4)}" stroke-linecap="round"/>
    <path d="M${k(-40)} ${k(-20)} Q${k(4)} ${k(-4)} ${k(46)} ${k(-24)}" fill="none" stroke="${P.ink}" stroke-width="${k(5)}" stroke-linecap="round"/>`}
  </g>`;
}

// precise curve helpers: a parametric ribbon of text-lines (the scroll of context)
function ribbon(x0, y0, x1, y1, n, amp, col, w, op = 1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const t0 = i / n, off = i * 14;
    d += `<path d="M${x0} ${y0 + off} C${(x0 + x1) / 2} ${y0 + off - amp} ${(x0 + x1) / 2} ${y1 + off + amp} ${x1} ${y1 + off}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${40 + 30 * Math.sin(i * 1.7)} 14 ${80 + 20 * Math.cos(i)} 18" opacity="${op * (1 - t0 * .5)}"/>`;
  }
  return d;
}
const lissajous = (cx, cy, ax, ay, a, b, ph, n = 600) => {
  let d = '';
  for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; d += `${i ? 'L' : 'M'}${(cx + ax * Math.sin(a * t + ph)).toFixed(1)} ${(cy + ay * Math.sin(b * t)).toFixed(1)}`; }
  return d;
};

const SANS = `'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const SERIF = `'Iowan Old Style', 'Charter', Georgia, serif`;
const HEL = `'Helvetica Neue', Helvetica, Arial, sans-serif`;

// ---------- 1. Editorial brand film ----------
function editorial(W = 1920, H = 1080, tag = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#F4EFE6"/>
  <!-- the room: one exact square, one window -->
  <rect x="180" y="200" width="640" height="640" fill="none" stroke="#1F1E1D" stroke-width="2.5"/>
  <line x1="180" y1="700" x2="820" y2="700" stroke="#1F1E1D" stroke-width="1.5" opacity=".35"/>
  <rect x="560" y="330" width="200" height="250" fill="#D97757"/>
  <rect x="560" y="330" width="200" height="250" fill="none" stroke="#1F1E1D" stroke-width="2.5"/>
  <line x1="660" y1="330" x2="660" y2="580" stroke="#F4EFE6" stroke-width="3"/>
  <!-- light cast on the floor: an exact trapezoid -->
  <path d="M560 580 L760 580 L700 700 L380 700 Z" fill="#D97757" opacity=".16"/>
  ${clawd(400, 690, .62, { fill: '#D97757', stroke: '#1F1E1D', sw: 2.5 })}
  <!-- context arriving as ruled lines -->
  ${ribbon(760, 360, 1040, 470, 8, 60, '#1F1E1D', 1.6, .55)}
  <!-- the stranger at the glass, outside -->
  <g opacity="1">${sage(1030, 770, .62, 'line')}</g>
  <!-- easter egg: a tungsten cube on the sill -->
  <rect x="566" y="566" width="10" height="10" fill="#1F1E1D"/>
  <!-- type -->
  <text x="1180" y="430" font-family="${SANS}" font-size="30" letter-spacing="6" fill="#1F1E1D" opacity=".6">${LINE1.toUpperCase()}</text>
  <text x="1174" y="560" font-family="${SERIF}" font-size="128" fill="#1F1E1D">${HW[0]}</text>
  <text x="1174" y="690" font-family="${SERIF}" font-style="italic" font-size="128" fill="#D97757">${HW[1]}</text>
  <line x1="1180" y1="740" x2="1360" y2="740" stroke="#1F1E1D" stroke-width="2"/>
  ${tag ? `<text x="180" y="960" font-family="${SANS}" font-size="20" letter-spacing="4" fill="#1F1E1D" opacity=".45">${STAMP}</text>` : ''}
  ${tag ? `<text x="1740" y="960" font-family="${SANS}" font-size="20" letter-spacing="4" fill="#1F1E1D" opacity=".45">1 / 4</text>` : ''}
</svg>`;
}

// ---------- 2. Dark keynote launch ----------
function keynote(tag = true, type = true) {
  let parts = '';
  for (let i = 0; i < 260; i++) {
    const h = (k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
    const x = 200 + h(1) * 1500, y = 120 + h(2) * 760, r = .6 + h(3) * 2.2;
    const inBeam = x > 1040 && x < 1720;
    parts += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#FFD9C2" opacity="${(inBeam ? .55 : .14) * (.4 + h(4))}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1A1420"/><stop offset=".55" stop-color="#0A090D"/><stop offset="1" stop-color="#030304"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9A6B" stop-opacity=".55"/><stop offset="1" stop-color="#FF9A6B" stop-opacity="0"/></linearGradient>
    <linearGradient id="win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7D6"/><stop offset=".5" stop-color="#FF9F72"/><stop offset="1" stop-color="#D9573A"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F08B63"/><stop offset="1" stop-color="#9E3F28"/></linearGradient>
    <linearGradient id="type" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFB08C"/></linearGradient>
    <linearGradient id="rim" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FFB08C"/><stop offset=".5" stop-color="#FFB08C" stop-opacity="0"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <!-- volumetric light from the window -->
  <path d="M1260 230 L1520 230 L1820 1080 L980 1080 Z" fill="url(#beam)" filter="url(#soft)"/>
  <!-- the window: a glass panel -->
  <rect x="1260" y="210" width="260" height="330" rx="22" fill="url(#win)" filter="url(#glow)"/>
  <rect x="1260" y="210" width="260" height="330" rx="22" fill="none" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.5"/>
  ${parts}
  <!-- floor reflection line -->
  <line x1="300" y1="842" x2="1620" y2="842" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="2"/>
  <ellipse cx="1390" cy="846" rx="260" ry="16" fill="#FF9A6B" opacity=".25" filter="url(#soft)"/>
  ${clawd(1390, 820, 1.05, { fill: 'url(#body)', stroke: '#FFC4A6', sw: 1.2, ink: '#120E10' })}
  <!-- Sage, rim-lit silhouette at the left edge -->
  ${sage(420, 900, .95, 'sil')}
  <!-- type -->
  ${type ? `<text x="160" y="250" font-family="${HEL}" font-weight="300" font-size="34" fill="#FFFFFF" opacity=".55">${LINE1}</text>
  <text x="152" y="372" font-family="${HEL}" font-weight="700" font-size="124" letter-spacing="-4" fill="url(#type)">${esc(HOOK)}.</text>` : ''}
  ${tag ? `<text x="1740" y="1010" font-family="${HEL}" font-size="20" letter-spacing="4" fill="#FFFFFF" opacity=".35">2 / 4</text>` : ''}
</svg>`;
}

// ---------- 3. Geometric motion design ----------
function geometric() {
  const C = { bg: '#F2EBDD', red: '#E4572E', navy: '#1D2B53', sun: '#F3B63F', teal: '#2A9D8F' };
  let grid = '';
  for (let i = 1; i < 12; i++) grid += `<line x1="${i * 160}" y1="0" x2="${i * 160}" y2="1080" stroke="${C.navy}" stroke-opacity=".06"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="${C.bg}"/>${grid}
  <!-- the room as a hard block, the window as a perfect circle -->
  <rect x="960" y="160" width="800" height="760" fill="${C.navy}"/>
  <circle cx="1460" cy="440" r="190" fill="${C.sun}"/>
  <path d="M1270 440 A190 190 0 0 1 1650 440 Z" fill="${C.red}"/>
  <!-- context stream: a Lissajous curve pouring from the window -->
  <path d="${lissajous(1180, 520, 320, 210, 3, 2, Math.PI / 4)}" fill="none" stroke="${C.bg}" stroke-width="3" opacity=".85"/>
  ${clawd(1220, 900, .88, { fill: C.red, ink: C.navy })}
  <!-- Sage as primitives, outside the block -->
  ${sage(700, 920, .78, 'geo')}
  <!-- quarter-circle accents -->
  <path d="M0 1080 L0 880 A200 200 0 0 1 200 1080 Z" fill="${C.teal}"/>
  <circle cx="860" cy="200" r="34" fill="${C.red}"/>
  <!-- type, Swiss -->
  <text x="160" y="260" font-family="${HEL}" font-weight="700" font-size="26" letter-spacing="2" fill="${C.navy}">${STAMP.toUpperCase()}</text>
  <text x="150" y="420" font-family="${HEL}" font-weight="800" font-size="150" letter-spacing="-6" fill="${C.navy}">${cap(HW[0])}</text>
  <text x="150" y="560" font-family="${HEL}" font-weight="800" font-size="150" letter-spacing="-6" fill="${C.red}">${HW[0] ? HW[1] : cap(HW[1])}.</text>
  <text x="160" y="640" font-family="${HEL}" font-weight="500" font-size="32" fill="${C.navy}">${LINE1} —</text>
  <text x="1740" y="1030" font-family="${HEL}" font-weight="700" font-size="20" letter-spacing="2" fill="${C.navy}">3 / 4</text>
</svg>`;
}

// ---------- 4. Hybrid day -> night (verse paper | chorus keynote, cut on a hard diagonal) ----------
function hybrid() {
  const e = editorial(1920, 1080, false).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const k = keynote(false, false).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs><clipPath id="L"><path d="M0 0 L1100 0 L820 1080 L0 1080 Z"/></clipPath><clipPath id="R"><path d="M1100 0 L1920 0 L1920 1080 L820 1080 Z"/></clipPath></defs>
  <g clip-path="url(#R)">${k}</g>
  <g clip-path="url(#L)">${e}</g>
  <path d="M1100 0 L820 1080" stroke="#D97757" stroke-width="6"/>
  <text x="80" y="1030" font-family="${SANS}" font-size="20" letter-spacing="4" fill="#1F1E1D" opacity=".6">VERSES · PAPER</text>
  <text x="1580" y="1030" font-family="${SANS}" font-size="20" letter-spacing="4" fill="#FFFFFF" opacity=".6">CHORUSES · NIGHT</text>
  <text x="1740" y="60" font-family="${SANS}" font-size="20" letter-spacing="4" fill="#FFFFFF" opacity=".35">4 / 4</text>
</svg>`;
}

const frames = [['1_editorial', editorial()], ['2_keynote', keynote()], ['3_geometric', geometric()], ['4_hybrid', hybrid()]];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
for (const [name, svg] of frames) {
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: `${OUT}/style_test_${name}.jpg`, type: 'jpeg', quality: 92 });
}
// 2x2 overview
const imgs = frames.map(([n]) => 'data:image/jpeg;base64,' + fs.readFileSync(`${OUT}/style_test_${n}.jpg`).toString('base64'));
await page.setContent(`<html><body style="margin:0;background:#111;display:grid;grid-template-columns:960px 960px;gap:0">${imgs.map(s => `<img src="${s}" width="960" height="540">`).join('')}</body></html>`);
await page.screenshot({ path: `${OUT}/style_tests_all.jpg`, type: 'jpeg', quality: 90 });
await browser.close();
console.log('ok');
