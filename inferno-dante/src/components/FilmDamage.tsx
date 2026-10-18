import { noise2D } from "@remotion/noise";
import React from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";

// Old-print damage: projector flicker, vertical scratches and dust that
// change every frame.
export const FilmDamage: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const scratches = new Array(2).fill(true).flatMap((_, i) =>
    random(`scratch-on-${frame}-${i}`) < 0.35
      ? [
          {
            x: random(`scratch-x-${Math.floor(frame / 3)}-${i}`) * width,
            w: 1 + random(`scratch-w-${frame}-${i}`) * 2,
            o: 0.06 + random(`scratch-o-${frame}-${i}`) * 0.12,
          },
        ]
      : [],
  );
  const dust = new Array(9).fill(true).flatMap((_, i) =>
    random(`dust-on-${frame}-${i}`) < 0.5
      ? [
          {
            x: random(`dust-x-${frame}-${i}`) * width,
            y: random(`dust-y-${frame}-${i}`) * height,
            r: 1.5 + random(`dust-r-${frame}-${i}`) * 4,
            light: random(`dust-l-${frame}-${i}`) < 0.5,
          },
        ]
      : [],
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000000",
          opacity: 0.06 + 0.06 * noise2D("projector", frame * 0.6, 0),
        }}
      />
      {scratches.map((s, i) => (
        <div
          key={`s${i}`}
          style={{
            position: "absolute",
            left: s.x,
            top: 0,
            width: s.w,
            height,
            backgroundColor: "#e8e0d0",
            opacity: s.o,
          }}
        />
      ))}
      {dust.map((d, i) => (
        <div
          key={`d${i}`}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: d.r,
            height: d.r * (0.6 + (i % 3) * 0.3),
            borderRadius: "50%",
            backgroundColor: d.light ? "#f0e8da" : "#000000",
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
};
