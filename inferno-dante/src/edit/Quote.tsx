import React from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { cinzel } from "../fonts";

type QuoteProps = {
  readonly text: string;
  readonly color?: string;
};

// A single quiet line over the fog, the only words inside the edit.
const QuoteInner: React.FC<QuoteProps> = ({ text, color = "#0d0d0d" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const visible = interpolate(frame, [0, 10, durationInFrames - 6, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 250,
        textAlign: "center",
        fontFamily: cinzel,
        fontWeight: 700,
        fontSize: 50,
        lineHeight: 1.35,
        letterSpacing: `${interpolate(frame, [0, durationInFrames], [0.42, 0.3])}em`,
        color,
        opacity: visible,
        filter: `blur(${(1 - visible) * 8}px)`,
      }}
    >
      {text}
    </div>
  );
};

const quoteSchema = {
  text: { type: "string", default: "", description: "Texto" },
  color: { type: "color", default: "#0d0d0d", description: "Cor" },
} as const satisfies InteractivitySchema;

export const Quote = Interactive.create({
  Component: QuoteInner,
  layout: "absolute-fill",
  schema: quoteSchema,
});
