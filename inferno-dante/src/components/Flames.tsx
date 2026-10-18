import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";

type FlamesProps = {
  readonly id: string;
  readonly seed: string;
  readonly width: number;
  /** Baseline of the flames, in px from the top of the box */
  readonly baseY: number;
  readonly count: number;
  readonly maxHeight: number;
  readonly intensity?: number;
  readonly style?: React.CSSProperties;
};

type Tongue = {
  x: number;
  w: number;
  h: number;
  phase: number;
};

const tonguePath = (
  x: number,
  baseY: number,
  w: number,
  h: number,
  sway: number,
  wobble: number,
) => {
  const tipX = x + sway;
  const tipY = baseY - h;
  return [
    `M ${x - w / 2} ${baseY}`,
    `C ${x - w / 2} ${baseY - h * 0.35}, ${tipX - w * 0.32 + wobble} ${baseY - h * 0.62}, ${tipX} ${tipY}`,
    `C ${tipX + w * 0.32 + wobble} ${baseY - h * 0.62}, ${x + w / 2} ${baseY - h * 0.35}, ${x + w / 2} ${baseY}`,
    "Z",
  ].join(" ");
};

const LAYERS = [
  { key: "outer", widthMul: 1.25, heightMul: 1, gradient: "outer", blur: 14 },
  { key: "mid", widthMul: 0.85, heightMul: 0.72, gradient: "mid", blur: 7 },
  { key: "core", widthMul: 0.45, heightMul: 0.42, gradient: "core", blur: 4 },
] as const;

// A wall of flame tongues. Every tongue's height, sway and wobble come from
// smooth noise, so the fire licks and breathes rather than jitters.
export const Flames: React.FC<FlamesProps> = ({
  id,
  seed,
  width,
  baseY,
  count,
  maxHeight,
  intensity = 1,
  style,
}) => {
  const frame = useCurrentFrame();

  const tongues = useMemo<Tongue[]>(
    () =>
      new Array(count).fill(true).map((_, i) => ({
        x:
          ((i + 0.5) / count) * width +
          (random(`${seed}-jx-${i}`) - 0.5) * (width / count),
        w: (width / count) * (1.4 + random(`${seed}-w-${i}`) * 1.2),
        h: maxHeight * (0.45 + random(`${seed}-h-${i}`) * 0.55),
        phase: random(`${seed}-ph-${i}`) * 50,
      })),
    [count, seed, width, maxHeight],
  );

  return (
    <svg
      width={width}
      height={baseY + 20}
      style={{ position: "absolute", overflow: "visible", ...style }}
    >
      <defs>
        <linearGradient id={`${id}-outer`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff5a1a" stopOpacity={0.95} />
          <stop offset="45%" stopColor="#c21807" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#3a0402" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-mid`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffd27a" stopOpacity={1} />
          <stop offset="40%" stopColor="#ff8a1f" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#ff3d0a" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity={1} />
          <stop offset="50%" stopColor="#ffe08a" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#ffb347" stopOpacity={0} />
        </linearGradient>
        {LAYERS.map((layer) => (
          <filter
            key={layer.key}
            id={`${id}-blur-${layer.key}`}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation={layer.blur} />
          </filter>
        ))}
      </defs>
      {LAYERS.map((layer) => (
        <g
          key={layer.key}
          filter={`url(#${id}-blur-${layer.key})`}
          style={{ mixBlendMode: "screen" }}
        >
          {tongues.map((t, i) => {
            const n = noise2D(seed, i * 0.61, (frame + t.phase) * 0.045);
            const n2 = noise2D(`${seed}-b`, i * 0.43, (frame + t.phase) * 0.07);
            const h =
              t.h * layer.heightMul * intensity * (0.62 + 0.38 * (n * 0.5 + 0.5));
            return (
              <path
                key={i}
                d={tonguePath(
                  t.x,
                  baseY,
                  t.w * layer.widthMul,
                  h,
                  n2 * t.w * 0.55,
                  n * t.w * 0.25,
                )}
                fill={`url(#${id}-${layer.gradient})`}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
};
