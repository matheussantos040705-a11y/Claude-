import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import { random } from "remotion";

type TreeSpec = {
  readonly x: number;
  readonly height: number;
  readonly thickness: number;
};

type ForestLayerProps = {
  readonly seed: string;
  readonly trees: readonly TreeSpec[];
  readonly groundY: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly blur?: number;
  readonly style?: React.CSSProperties;
};

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

const quad = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w0: number,
  w1: number,
) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return `M ${x0 + (nx * w0) / 2} ${y0 + (ny * w0) / 2} L ${x1 + (nx * w1) / 2} ${y1 + (ny * w1) / 2} L ${x1 - (nx * w1) / 2} ${y1 - (ny * w1) / 2} L ${x0 - (nx * w0) / 2} ${y0 - (ny * w0) / 2} Z`;
};

// Grows a dead, crooked tree from tapered segments joined by
// round knuckles, forking into thinner and thinner twigs.
const growTree = (seed: string, tree: TreeSpec, groundY: number) => {
  // Separate paths per primitive kind, so opposite windings never punch holes.
  const segments: string[] = [];
  const knuckles: string[] = [];
  const roots: string[] = [];
  let n = 0;
  const rnd = () => random(`${seed}-${n++}`);

  const grow = (
    x: number,
    y: number,
    angle: number,
    length: number,
    w: number,
    depth: number,
  ) => {
    if (depth <= 0 || w < 0.9 || length < 4) {
      return;
    }
    const bend = (rnd() - 0.5) * 0.55;
    const a = angle + bend;
    const x1 = x + Math.cos(a) * length;
    const y1 = y + Math.sin(a) * length;
    const w1 = w * 0.8;
    segments.push(quad(x, y, x1, y1, w, w1));
    knuckles.push(circle(x1, y1, w1 / 2));

    // The leader keeps climbing, slightly drawn back toward vertical.
    const pull = (-Math.PI / 2 - a) * 0.18;
    grow(x1, y1, a + pull, length * 0.9, w1, depth - 1);

    // Side branches reach out and up, gnarled.
    if (rnd() < 0.62) {
      const side = rnd() < 0.5 ? -1 : 1;
      grow(
        x1,
        y1,
        a + side * (0.55 + rnd() * 0.7),
        length * (0.55 + rnd() * 0.3),
        w1 * (0.45 + rnd() * 0.2),
        depth - 2,
      );
    }
  };

  // Flared roots.
  roots.push(
    `M ${tree.x - tree.thickness * 1.6} ${groundY + 4} Q ${tree.x - tree.thickness * 0.5} ${groundY - tree.thickness * 0.6} ${tree.x - tree.thickness * 0.5} ${groundY - tree.thickness * 2} L ${tree.x + tree.thickness * 0.5} ${groundY - tree.thickness * 2} Q ${tree.x + tree.thickness * 0.5} ${groundY - tree.thickness * 0.6} ${tree.x + tree.thickness * 1.6} ${groundY + 4} Z`,
  );
  grow(
    tree.x,
    groundY,
    -Math.PI / 2 + (rnd() - 0.5) * 0.25,
    tree.height / 7.5,
    tree.thickness,
    12,
  );
  return [segments.join(" "), knuckles.join(" "), roots.join(" ")];
};

export const ForestLayer: React.FC<ForestLayerProps> = ({
  seed,
  trees,
  groundY,
  width,
  height,
  color,
  blur = 0,
  style,
}) => {
  const paths = useMemo(() => {
    const grown = trees.map((t, i) => growTree(`${seed}-${i}`, t, groundY));
    const layers = [0, 1, 2].map((k) => grown.map((g) => g[k]).join(" "));
    // Uneven, rolling ground instead of a ruler-straight horizon.
    const ground = [`M -400 ${height}`];
    for (let x = -400; x <= width + 400; x += 40) {
      ground.push(`L ${x} ${groundY + noise2D(`${seed}-ground`, x * 0.004, 0) * 22}`);
    }
    ground.push(`L ${width + 400} ${height} Z`);
    return [...layers, ground.join(" ")];
  }, [trees, seed, groundY, width, height]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "visible",
        filter: blur ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
};
