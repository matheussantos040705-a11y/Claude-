import { noise2D } from "@remotion/noise";
import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";
import { cinzel } from "../fonts";

type SlamWordProps = {
  readonly word: string;
  readonly size?: number;
};

// One word per beat, slammed onto the screen like the gate closing.
const SlamWordInner: React.FC<SlamWordProps> = ({ word, size = 170 }) => {
  const frame = useCurrentFrame();
  const shake = interpolate(frame, [0, 10], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: -200,
        right: -200,
        top: 960 - size * 0.62,
        textAlign: "center",
        whiteSpace: "nowrap",
        fontFamily: cinzel,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.08em",
        color: "#f4eee4",
        textShadow: "0 0 40px rgba(190, 20, 0, 0.75), 0 0 110px rgba(140, 10, 0, 0.6)",
        opacity: interpolate(frame, [0, 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        scale: `${interpolate(frame, [0, 5, 24], [1.7, 1, 1.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}`,
        filter: `blur(${interpolate(frame, [0, 4], [16, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px)`,
        translate: `${noise2D(`${word}-x`, frame * 0.9, 0) * shake}px ${noise2D(`${word}-y`, frame * 0.9, 0) * shake}px`,
      }}
    >
      {word}
    </div>
  );
};

const slamWordSchema = {
  word: { type: "string", default: "", description: "Palavra" },
  size: { type: "number", default: 170, min: 40, max: 400, step: 1, description: "Tamanho", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const SlamWord = Interactive.create({
  Component: SlamWordInner,
  layout: "absolute-fill",
  schema: slamWordSchema,
});
