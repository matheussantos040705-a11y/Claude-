# Technical, Conceptual & Explainer Animations

Code animation isn't limited to character cartoons. It is a potent medium for technical explainers, algorithmic visualizations, system architecture diagrams, and scientific concepts. Hand-painted boiling ink and watercolor make technical ideas approachable, engaging, and memorable.

---

## 1. The Core Metaphor Principle

In technical animation, **the physical object is the explanation**:
- Do not draw lifeless boxes connected by thin arrows.
- Turn abstract data into physical, tangible mechanisms:
  - A caching layer: A sliding drawer that only opens when a new key is fetched.
  - A queue / buffer: A conveyor belt of numbered ink parcels dropping into bins.
  - A neural network: Flowing watercolor currents lighting up nodes with `glow()`.
  - Binary search: A pair of wooden dividers slicing an array in half on each beat.

---

## 2. Animating Common Technical Patterns

### 1. Nodes & Graph Networks
```javascript
function drawNetworkNode(x, y, r, label, activeProgress) {
  boilSeed('node_' + label);
  const pulseR = r * (1 + 0.15 * Math.sin(activeProgress * Math.PI));
  
  // Ambient glow when active
  if (activeProgress > 0) {
    glow(x, y, pulseR * 2.5, PAL.teal, activeProgress * 0.8);
  }
  
  // Node body: watercolor disc with organic ink ring
  paint(ellPts(x, y, pulseR, pulseR, 20, 1.2), {
    wash: mixCol(PAL.cream, PAL.teal, activeProgress),
    fill: PAL.teal,
    fillOp: 40 + 100 * activeProgress,
    ink: PAL.ink,
    sw: 1.2
  });

  // Flowing data packet along connection
  // ...
}
```

### 2. Pipelines & Data Packets
Use `ribbon()` to paint organic conduit pipes:
```javascript
// A curved pipeline conduit
const conduitPath = through([[100, 300], [400, 320], [700, 260], [1000, 280]]);
paint(ribbon(conduitPath, 30, 30), {
  wash: PAL.night,
  fillOp: 50,
  ink: PAL.ink,
  sw: 1.5
});

// A traveling data packet along the path
const packetPos = arcPt(p0, p1, h, seg(t, tStart, tEnd));
paint(starPts(packetPos[0], packetPos[1], 16, 0.4, 4), {
  wash: PAL.ochre,
  ink: PAL.ink,
  sw: 1
});
```

### 3. Comparing Algorithms & Step-by-Step State Changes
- Always synchronize state transitions to musical beats or rhythmic pulses (`pulse(t)`).
- Highlight modified elements with `glow()` and squashing (`take()`).
- Avoid instant teleports: show items lifting, shifting, and landing with an eased arc.

---

## 3. Seamless Visual Loops for Backgrounds & Headers

To make a 4-second seamless loop for a website or video header:
```javascript
LOOPS.data_loop = (t) => {
  const loopT = t % 4.0;
  // Compute all positions using sin / cos with frequency = (2 * PI / 4.0)
  // Guarantees frame at 0.0s matches frame at 4.0s identically.
};
LOOPS.data_loop.len = 4.0;
```
Render directly:
```bash
node render.mjs --loop=data_loop --clip --out=out/loop.mp4
```
