import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

type FilmGrainProps = {
  readonly id: string;
  readonly opacity?: number;
};

// Rendered at half resolution and scaled up, for a coarser, filmic grain.
export const FilmGrain: React.FC<FilmGrainProps> = ({ id, opacity = 0.12 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <svg
      width={width / 2}
      height={height / 2}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          seed={frame % 24}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};
