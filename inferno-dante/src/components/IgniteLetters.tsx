import { noise2D } from "@remotion/noise";
import React from "react";
import {
  Interactive,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";

type IgniteLettersProps = {
  readonly text: string;
  readonly delay?: number;
  /** Frames between consecutive letters */
  readonly stagger?: number;
  readonly style?: React.CSSProperties;
};

// Each letter is branded into the dark: it flares white-hot, then cools to a
// smouldering ember that keeps breathing.
const IgniteLettersInner: React.FC<IgniteLettersProps> = ({
  text,
  delay = 0,
  stagger = 3,
  style,
}) => {
  const frame = useCurrentFrame();
  let visible = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        textAlign: "center",
        whiteSpace: "pre",
        ...style,
      }}
    >
      {text.split("").map((char, i) => {
        if (char === " ") {
          return <span key={i}> </span>;
        }
        const start = delay + visible++ * stagger;
        const local = frame - start;
        const heat = interpolate(local, [0, 4, 30], [0, 1, 0.55], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const breathe = 0.85 + 0.15 * noise2D("ignite", i * 0.3, frame * 0.06);
        const glow = heat * breathe;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: interpolate(local, [0, 3], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              color: interpolateColors(
                glow,
                [0, 0.55, 0.8, 1],
                ["#3a0a04", "#ff6a1f", "#ffc46b", "#fff6dc"],
              ),
              textShadow: `0 0 ${10 + glow * 30}px rgba(255, 110, 30, ${glow}), 0 0 ${40 + glow * 60}px rgba(255, 40, 0, ${glow * 0.6})`,
              scale: interpolate(local, [0, 5, 18], [1.25, 0.97, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

const igniteLettersSchema = {
  ...Interactive.textSchema,
  text: { type: "string", default: "", description: "Inscrição" },
} as const satisfies InteractivitySchema;

export const IgniteLetters = Interactive.create({
  Component: IgniteLettersInner,
  layout: "none",
  schema: igniteLettersSchema,
});
