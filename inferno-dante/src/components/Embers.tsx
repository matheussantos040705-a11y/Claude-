import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";

type EmbersProps = {
  readonly seed: string;
  readonly count: number;
  readonly color: string;
  readonly coreColor: string;
  readonly minSize?: number;
  readonly maxSize?: number;
  /** Pixels per frame. Negative values make particles fall. */
  readonly speed?: number;
  readonly drift?: number;
  /** Vertical stretch, for speed streaks. */
  readonly stretch?: number;
  /** Horizontal wind in pixels per frame. */
  readonly wind?: number;
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
};

export const Embers: React.FC<EmbersProps> = ({
  seed,
  count,
  color,
  coreColor,
  minSize = 3,
  maxSize = 9,
  speed = 2.2,
  drift = 60,
  stretch = 1,
  wind = 0,
  opacity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo(
    () =>
      new Array(count).fill(true).map((_, i) => ({
        x: random(`${seed}-x-${i}`) * width,
        y: random(`${seed}-y-${i}`) * (height + 200),
        size: minSize + random(`${seed}-s-${i}`) ** 2 * (maxSize - minSize),
        speed: 0.45 + random(`${seed}-v-${i}`) * 0.9,
        phase: random(`${seed}-p-${i}`) * 100,
      })),
    [count, seed, width, height, minSize, maxSize],
  );

  const span = height + 200;
  const spanX = width + 200;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity,
        ...style,
      }}
    >
      {particles.map((p, i) => {
        const travelled = frame * speed * p.speed;
        const y = ((((p.y - travelled) % span) + span) % span) - 100;
        const sway = noise2D(seed, i * 0.37, (frame + p.phase) * 0.012) * drift;
        const x =
          ((((p.x + sway + frame * wind * p.speed) % spanX) + spanX) % spanX) -
          100;
        const flicker =
          0.55 + 0.45 * noise2D(`${seed}-f`, i, (frame + p.phase) * 0.18);
        // Fade toward the edges of the travel span so particles never pop.
        const edge = Math.min(1, (y + 100) / 260, (height + 100 - y) / 260);
        const h = p.size * stretch;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - p.size / 2,
              top: y - h / 2,
              width: p.size,
              height: h,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${coreColor} 0%, ${color} 45%, transparent 75%)`,
              boxShadow: `0 0 ${p.size * 2.5}px ${p.size * 0.6}px ${color}`,
              opacity: Math.max(0, flicker * edge),
            }}
          />
        );
      })}
    </div>
  );
};
