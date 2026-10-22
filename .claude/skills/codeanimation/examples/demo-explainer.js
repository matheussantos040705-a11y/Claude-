// examples/demo-explainer.js: Technical & conceptual animated explainer.
// Demonstrates how to explain an abstract process (data pipeline / network transmission)
// using boiling ink, watercolor bleed, and flowing visual conduits.
(() => {
  function shotPipeline(t, lt, dur) {
    camBegin(W / 2 + 10 * Math.sin(lt * 0.4), H / 2, 1.0);

    // 1. Blueprint paper background
    boilSeed('explainer_bg');
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: PAL.night, ink: null });

    // Decorative grid ticks
    for (let x = 200; x < W; x += 300) {
      inkLine([[x, 100], [x, H - 100]], 0.4, mixCol(PAL.night, PAL.indigo, 0.5), 'inkfine');
    }

    // 2. Three processing nodes: Ingest -> Transform -> Output
    const nodes = [
      { name: 'INGEST', x: 400, y: H / 2, col: PAL.sky },
      { name: 'PROCESS', x: W / 2, y: H / 2 - 80, col: PAL.ochre },
      { name: 'SERVE', x: W - 400, y: H / 2, col: PAL.sap }
    ];

    // Conduits between nodes
    boilSeed('conduits');
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const mid = [(a.x + b.x) / 2, (a.y + b.y) / 2 - 40];
      const pts = through([[a.x, a.y], mid, [b.x, b.y]]);
      paint(ribbon(pts, 18, 18), {
        wash: PAL.indigo,
        fill: PAL.night,
        fillOp: 80,
        ink: PAL.ink,
        sw: 1.2
      });
    }

    // Traveling packet loop (every 2.5 seconds)
    const packetCycle = (lt % 2.5) / 2.5;
    let px, py;
    if (packetCycle < 0.5) {
      const k = packetCycle * 2;
      const pt = arcPt([nodes[0].x, nodes[0].y], [nodes[1].x, nodes[1].y], 40, ease(k));
      px = pt[0]; py = pt[1];
    } else {
      const k = (packetCycle - 0.5) * 2;
      const pt = arcPt([nodes[1].x, nodes[1].y], [nodes[2].x, nodes[2].y], 40, ease(k));
      px = pt[0]; py = pt[1];
    }

    // Packet glow & particle
    glow(px, py, 60, PAL.cream, 0.85);
    paint(starPts(px, py, 18, 0.45, 5, lt * 4), {
      wash: PAL.cream,
      fill: PAL.ochre,
      fillOp: 120,
      ink: PAL.ink,
      sw: 1
    });

    // Draw the nodes
    nodes.forEach((n, idx) => {
      boilSeed('node_' + idx);
      const isHit = (idx === 0 && packetCycle < 0.1) ||
                    (idx === 1 && Math.abs(packetCycle - 0.5) < 0.1) ||
                    (idx === 2 && packetCycle > 0.9);
      const r = 55 + (isHit ? 8 : 0);

      if (isHit) {
        glow(n.x, n.y, r * 2.2, n.col, 0.7);
      }

      paint(ellPts(n.x, n.y, r, r, 24, 1.2), {
        wash: n.col,
        fill: mixCol(n.col, PAL.night, 0.4),
        fillOp: 90,
        bleed: 0.15,
        tex: 0.6,
        ink: PAL.ink,
        sw: 1.5
      });

      // Technical icon/mark inside node
      paint(starPts(n.x, n.y, 16, 0.35, 4, isHit ? lt * 6 : 0), {
        wash: PAL.cream,
        ink: PAL.ink,
        sw: 0.8
      });
    });

    camEnd();

    // Transitions
    if (lt < 0.5) iris(W / 2, H / 2, lerp(0, 1600, easeIn(lt / 0.5)));
    if (lt > dur - 0.4) brushWipe((lt - (dur - 0.4)) / 0.8);
  }

  shots([
    [0, shotPipeline]
  ]);
})();
