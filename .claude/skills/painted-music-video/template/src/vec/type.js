// type.js: kinetic typography for the lyrics (PROJECT.lyrics = 'kinetic'). Drawn after each shot, in screen space.
// Each LY line [a, b, text] is split into a small lead-in and a big hook (its last words), set as one designed block.
// Words arrive one by one (timed across the line by length), rising and un-blurring; the hook lands in V.key colour.
// Shots place it per frame with V.type = { mode:'left'|'right'|'center'|'top'|'bottom'|'off', x, y, w } (defaults: left).
(function (G) {
  if (typeof PROJECT === 'undefined' || PROJECT.style === 'painted') return;
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const SPOKEN = /^(What is it like to be\?|Compacting conversation|Daaaisy|Give me your answer|Hello! How can I help)/;

  // split into lead + hook: the hook is the last phrase after the final comma/colon/dash, capped to 3 words
  function split(txt) {
    const clean = txt.replace(/\s+/g, ' ').trim();
    const words = clean.split(' ');
    if (words.length <= 4) return { lead: [], hook: words };
    const m = clean.match(/^(.*[,:;—.?!])\s+([^,:;—]+)$/);
    let hook = m ? m[2].split(' ') : words.slice(-2);
    if (hook.length > 3) hook = hook.slice(-3);
    if (hook.length < 2) hook = words.slice(-2);
    return { lead: words.slice(0, words.length - hook.length), hook };
  }
  // word arrival times across [a, a + span]
  function times(words, a, b) {
    const span = Math.max(.5, Math.min(b - a, 6) * .82), n = words.reduce((s, w) => s + w.length + 1.5, 0);
    let acc = 0; return words.map(w => { const t = a + acc / n * span; acc += w.length + 1.5; return t; });
  }
  function fit(c, words, size, weight, maxW) {
    let s = size; for (let k = 0; k < 12; k++) { c.font = `${weight} ${s}px ${FONT}`; if (c.measureText(words.join(' ')).width <= maxW) break; s *= .9; }
    return s;
  }
  // lay words into lines under maxW; returns [{w, x, line}]
  function flow(c, words, maxW) {
    const sp = c.measureText(' ').width, out = []; let x = 0, line = 0;
    for (const w of words) { const ww = c.measureText(w).width; if (x > 0 && x + ww > maxW) { x = 0; line++; } out.push({ w, x, line, ww }); x += ww + sp; }
    return out;
  }

  function draw(c, t) {
    const P = G.V.type || {};
    if (P.mode === 'off') return;
    let i = -1; for (let k = 0; k < LY.length; k++) if (LY[k][0] - .05 <= t) i = k;
    if (i < 0) return;
    // the previous line clears out quickly as the new one arrives
    if (i > 0 && t - LY[i][0] < .22 && LY[i - 1][1] > LY[i][0] - .3) drawLine(c, t, LY[i - 1], 1 - ease(seg(t, LY[i][0] - .05, LY[i][0] + .2)), P);
    const [a, b] = LY[i], end = Math.min(b, LY[i + 1] ? LY[i + 1][0] : b);
    if (t > b + .25) return;
    drawLine(c, t, LY[i], t > end - .02 && (!LY[i + 1] || LY[i + 1][0] > b + .2) ? 1 - ease(seg(t, b - .02, b + .25)) : 1, P);
  }
  function drawLine(c, t, L, out, P) {
    const V = G.V;
    if (out <= 0) return;
    const [a, b, raw] = L, txt = raw.replace(/^\(|\)$/g, '').replace(/[,;:]$/, '');
    const spoken = SPOKEN.test(txt);
    const mode = spoken ? 'center' : (P.mode || 'left');
    const maxW = P.w || (mode === 'center' || mode === 'top' || mode === 'bottom' ? 1500 : 820);
    const key = V.key || '#FF9A6B';
    const { lead, hook } = spoken ? { lead: [], hook: txt.split(' ') } : split(txt);
    const all = lead.concat(hook), tw = times(all, a, b);

    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.textBaseline = 'alphabetic';
    // sizes
    const leadSize = 38, hookW = spoken ? 300 : 800;
    const hookSize = fit(c, hook, spoken ? 64 : 112, hookW, maxW);
    c.font = `${hookW} ${hookSize}px ${FONT}`; const hf = flow(c, hook, maxW);
    c.font = `400 ${leadSize}px ${FONT}`; const lf = flow(c, lead, maxW);
    const leadLines = lead.length ? lf[lf.length - 1].line + 1 : 0, hookLines = hf[hf.length - 1].line + 1;
    const blockH = leadLines * leadSize * 1.25 + (leadLines ? 14 : 0) + hookLines * hookSize * 1.02;
    // anchor
    let x0 = P.x ?? (mode === 'right' ? 1920 - 150 - maxW : mode === 'left' ? 150 : (1920 - maxW) / 2);
    let y0 = P.y ?? (mode === 'top' ? 130 : mode === 'bottom' ? 1080 - 110 - blockH : spoken ? 540 - blockH / 2 : 300);
    const align = mode === 'right' ? 'right' : (mode === 'center' || mode === 'top' || mode === 'bottom') ? 'center' : 'left';
    const lineW = (fl, line, font) => { c.font = font; const ws = fl.filter(q => q.line === line); const last = ws[ws.length - 1]; return last.x + last.ww; };
    const xFor = (fl, q, font) => align === 'left' ? x0 + q.x : align === 'right' ? x0 + maxW - lineW(fl, q.line, font) + q.x : x0 + (maxW - lineW(fl, q.line, font)) / 2 + q.x;
    const drift = (1 - out) * -18;

    // lead-in: small, light
    let wi = 0;
    const leadFont = `400 ${leadSize}px ${FONT}`;
    for (const q of lf) {
      const k = easeOut(seg(t, tw[wi] - .05, tw[wi] + .22)); wi++;
      if (k <= 0) continue;
      c.font = leadFont; c.letterSpacing = '0px';
      c.globalAlpha = .62 * k * out; c.fillStyle = '#F4ECE8';
      c.fillText(q.w, xFor(lf, q, leadFont), y0 + leadSize + q.line * leadSize * 1.25 + (1 - k) * 18 + drift);
    }
    // hook: big, heavy, key colour with a soft light behind it
    const hy = y0 + leadLines * leadSize * 1.25 + (leadLines ? 14 : 0);
    const hookFont = `${hookW} ${hookSize}px ${FONT}`;
    for (const q of hf) {
      const ta = tw[wi]; wi++;
      const k = easeOut(seg(t, ta - .04, ta + .26)); if (k <= 0) continue;
      const pop = 1 + .08 * Math.exp(-(t - ta) * 9) * (t > ta ? 1 : 0);
      const x = xFor(hf, q, hookFont), y = hy + hookSize * .88 + q.line * hookSize * 1.02 + (1 - k) * 34 + drift;
      c.save(); c.translate(x, y); c.scale(pop, pop); c.font = hookFont; c.letterSpacing = spoken ? '0px' : '-2px';
      if (!spoken) { c.globalAlpha = .35 * k * out; c.filter = 'blur(18px)'; c.fillStyle = key; c.fillText(q.w, 0, 0); c.filter = 'none'; }
      c.globalAlpha = k * out;
      const g = c.createLinearGradient(0, -hookSize, q.ww, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, spoken ? '#E8E4F0' : key);
      c.fillStyle = g; c.fillText(q.w, 0, 0); c.restore();
    }
    c.restore();
  }
  G.TYPE = { draw, split };
})(typeof window !== 'undefined' ? window : globalThis);
