import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

type FogProps = {
  readonly id: string;
  readonly seed: number;
  /** RGB channels 0..1 */
  readonly rgb: readonly [number, number, number];
  readonly density?: number;
  readonly scale?: number;
  /** Pixels per frame */
  readonly speedX?: number;
  readonly speedY?: number;
  readonly top?: number;
  readonly height?: number;
  readonly opacity?: number;
  readonly blendMode?: React.CSSProperties["mixBlendMode"];
  /** CSS mask, to fade the fog vertically */
  readonly mask?: string;
};

// A static turbulence texture that slides over time. Moving it with `translate`
// keeps the expensive noise from being recomputed with new parameters.
export const Fog: React.FC<FogProps> = ({
  id,
  seed,
  rgb,
  density = 1,
  scale = 1,
  speedX = 0.6,
  speedY = 0,
  top = 0,
  height,
  opacity = 1,
  blendMode = "screen",
  mask,
}) => {
  const frame = useCurrentFrame();
  const { width, height: videoHeight } = useVideoConfig();
  const h = height ?? videoHeight;
  const margin = 600;
  const freq = 0.0028 / scale;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width,
        height: h,
        overflow: "hidden",
        pointerEvents: "none",
        opacity,
        mixBlendMode: blendMode,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <svg
        width={width + margin * 2}
        height={h + margin}
        style={{
          position: "absolute",
          left: -margin,
          top: -margin / 2,
          translate: `${frame * speedX}px ${frame * speedY}px`,
        }}
      >
        <filter id={id} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${freq} ${freq * 1.8}`}
            numOctaves="4"
            seed={seed}
          />
          <feColorMatrix
            type="matrix"
            values={`0 0 0 0 ${rgb[0]}  0 0 0 0 ${rgb[1]}  0 0 0 0 ${rgb[2]}  ${1.6 * density} 0 0 0 ${-0.55 * density}`}
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </div>
  );
};
