import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { cinzel, cormorant } from "../fonts";

type InscriptionProps = {
  /** Dante's verse; "\n" breaks the line */
  readonly verse: string;
  /** Portuguese translation */
  readonly translation: string;
};

// A line of the inscription over the gate of Hell, surfacing out of the dark.
const InscriptionInner: React.FC<InscriptionProps> = ({
  verse,
  translation,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const visible = interpolate(
    frame,
    [0, 16, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1300,
        height: 520,
        opacity: visible,
        background:
          "radial-gradient(ellipse 75% 50% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 75%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 130,
          textAlign: "center",
          filter: `blur(${(1 - visible) * 10}px)`,
        }}
      >
        <div
          style={{
            fontFamily: cinzel,
            fontWeight: 600,
            fontSize: 54,
            lineHeight: 1.32,
            whiteSpace: "pre-line",
            color: "#efe6d6",
            letterSpacing:
              interpolate(frame, [0, durationInFrames], [0.24, 0.16], {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }) + "em",
            textShadow: "0 0 24px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9)",
          }}
        >
          {verse}
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: cormorant,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 44,
            color: "#a69c8c",
            textShadow: "0 0 16px rgba(0,0,0,0.95)",
          }}
        >
          {translation}
        </div>
      </div>
    </div>
  );
};

const inscriptionSchema = {
  verse: { type: "string", default: "", description: "Verso" },
  translation: { type: "string", default: "", description: "Tradução" },
} as const satisfies InteractivitySchema;

export const Inscription = Interactive.create({
  Component: InscriptionInner,
  layout: "absolute-fill",
  schema: inscriptionSchema,
});
