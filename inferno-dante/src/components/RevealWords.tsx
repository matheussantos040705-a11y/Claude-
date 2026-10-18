import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  type InteractivitySchema,
} from "remotion";

type RevealWordsProps = {
  /** Use "\n" to break lines. */
  readonly text: string;
  readonly delay?: number;
  /** Frames between consecutive words */
  readonly stagger?: number;
  /** Frames each word takes to resolve */
  readonly duration?: number;
  readonly glowColor?: string;
  readonly style?: React.CSSProperties;
};

// Words surface out of the dark one by one: blurred, low, then sharp.
const RevealWordsInner: React.FC<RevealWordsProps> = ({
  text,
  delay = 0,
  stagger = 5,
  duration = 22,
  glowColor = "rgba(255, 96, 32, 0.55)",
  style,
}) => {
  const frame = useCurrentFrame();
  let wordIndex = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        textAlign: "center",
        color: "#f1e6d2",
        textShadow: `0 0 28px ${glowColor}, 0 2px 6px rgba(0,0,0,0.9)`,
        ...style,
      }}
    >
      {text.split("\n").map((line, lineIndex) => (
        <div key={lineIndex}>
          {line.split(" ").map((word, i) => {
            const start = delay + wordIndex++ * stagger;
            const t = interpolate(frame, [start, start + duration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  opacity: t,
                  filter: `blur(${(1 - t) * 14}px)`,
                  translate: `0px ${(1 - t) * 28}px`,
                }}
              >
                {word}
                {i < line.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const revealWordsSchema = {
  ...Interactive.textSchema,
  text: { type: "string", default: "", description: "Texto" },
  glowColor: {
    type: "color",
    default: "rgba(255, 96, 32, 0.55)",
    description: "Brilho",
  },
} as const satisfies InteractivitySchema;

export const RevealWords = Interactive.create({
  Component: RevealWordsInner,
  layout: "none",
  schema: revealWordsSchema,
});
