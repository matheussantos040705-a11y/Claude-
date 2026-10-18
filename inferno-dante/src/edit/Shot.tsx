import { noise2D } from "@remotion/noise";
import React, { useId } from "react";
import {
  Easing,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";

type Tone = "ash" | "fire" | "blood" | "ice";

type ShotProps = {
  /** File name in public/plates, without extension */
  readonly plate: string;
  /** Point of interest, 0..1, kept in frame and used as zoom origin */
  readonly focusX?: number;
  readonly focusY?: number;
  readonly zoomFrom?: number;
  readonly zoomTo?: number;
  /** Camera drift over the whole shot, in px */
  readonly panX?: number;
  readonly panY?: number;
  readonly tone?: Tone;
  /** Extra zoom that snaps back right after the cut */
  readonly punch?: number;
  /** White flash at the cut, 0..1 */
  readonly flash?: number;
  /** Camera shake at the cut, in px */
  readonly shake?: number;
  /** RGB split at the cut, in px */
  readonly split?: number;
  /** Frames shown as a negative at the cut */
  readonly invert?: number;
  /** Frames (relative to the shot) that get a smaller punch, e.g. mid-shot beats */
  readonly pulses?: number[];
  readonly fadeIn?: number;
  readonly fadeOut?: number;
};

const decay = (frame: number, at: number, length: number) =>
  interpolate(frame - at, [0, length], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) * (frame >= at ? 1 : 0);

const toneFilter = (tone: Tone, light: number) => {
  switch (tone) {
    case "fire":
      return `grayscale(1) sepia(1) saturate(2.6) hue-rotate(-22deg) contrast(1.45) brightness(${0.8 * light})`;
    case "blood":
      return `grayscale(1) sepia(1) saturate(4.2) hue-rotate(-42deg) contrast(1.55) brightness(${0.72 * light})`;
    case "ice":
      return `grayscale(1) sepia(0.55) hue-rotate(168deg) saturate(1.7) contrast(1.4) brightness(${0.82 * light})`;
    default:
      return `grayscale(1) contrast(1.45) brightness(${0.84 * light})`;
  }
};

// One engraving on screen: graded, framed on its point of interest, with a
// slow camera move and the hits of an edit (punch, shake, flash, RGB split).
const ShotInner: React.FC<ShotProps> = ({
  plate,
  focusX = 0.5,
  focusY = 0.5,
  zoomFrom = 1.04,
  zoomTo = 1.16,
  panX = 0,
  panY = 0,
  tone = "ash",
  punch = 0,
  flash = 0,
  shake = 0,
  split = 0,
  invert = 0,
  pulses = [],
  fadeIn = 0,
  fadeOut = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const filterId = `split-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hit = decay(frame, 0, 9);
  const pulse = pulses.reduce((sum, p) => sum + decay(frame, p, 7), 0);
  const scale =
    (zoomFrom + (zoomTo - zoomFrom) * progress) * (1 + punch * hit + 0.05 * pulse);
  const shakeAmount = shake * decay(frame, 0, 12) + shake * 0.4 * pulse;
  const shakeX = noise2D(`${plate}-sx`, frame * 0.9, 0) * shakeAmount;
  const shakeY = noise2D(`${plate}-sy`, frame * 0.9, 0) * shakeAmount;

  const flickerSpeed = tone === "fire" || tone === "blood" ? 0.35 : 0.12;
  const flickerDepth = tone === "fire" || tone === "blood" ? 0.14 : 0.05;
  const light = 1 + flickerDepth * noise2D(`${plate}-light`, frame * flickerSpeed, 0);
  const splitAmount = split * decay(frame, 0, 6) + split * 0.5 * pulse;

  const opacity =
    (fadeIn
      ? interpolate(frame, [0, fadeIn], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1) *
    (fadeOut
      ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1);

  const filters = [toneFilter(tone, light)];
  if (frame < invert) {
    filters.push("invert(1)");
  }
  if (splitAmount > 0.5) {
    filters.push(`url(#${filterId})`);
  }

  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={splitAmount} dy={0} result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-splitAmount} dy={0} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
            scale: `${scale}`,
            translate: `${panX * progress + shakeX}px ${panY * progress + shakeY}px`,
          }}
        >
          <Img
            src={staticFile(`plates/${plate}.jpg`)}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${focusX * 100}% ${focusY * 100}%`,
              filter: filters.join(" "),
            }}
          />
        </div>
        {tone === "fire" || tone === "blood" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "screen",
              opacity: 0.55 * light,
              background:
                tone === "fire"
                  ? "radial-gradient(ellipse 90% 45% at 50% 100%, rgba(255, 110, 30, 0.45) 0%, rgba(120, 20, 0, 0) 70%)"
                  : "radial-gradient(ellipse 90% 45% at 50% 100%, rgba(200, 20, 10, 0.4) 0%, rgba(80, 0, 0, 0) 70%)",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ffffff",
            opacity: flash * decay(frame, 0, 5),
          }}
        />
      </div>
    </>
  );
};

const shotSchema = {
  plate: { type: "string", default: "caronte", description: "Gravura" },
  focusX: { type: "number", default: 0.5, min: 0, max: 1, step: 0.01, description: "Foco X", hiddenFromList: false },
  focusY: { type: "number", default: 0.5, min: 0, max: 1, step: 0.01, description: "Foco Y", hiddenFromList: false },
  zoomFrom: { type: "number", default: 1.04, min: 1, max: 3, step: 0.01, description: "Zoom inicial", hiddenFromList: false },
  zoomTo: { type: "number", default: 1.16, min: 1, max: 3, step: 0.01, description: "Zoom final", hiddenFromList: false },
  punch: { type: "number", default: 0, min: 0, max: 1, step: 0.01, description: "Punch no corte", hiddenFromList: false },
  flash: { type: "number", default: 0, min: 0, max: 1, step: 0.05, description: "Flash no corte", hiddenFromList: false },
  shake: { type: "number", default: 0, min: 0, max: 60, step: 1, description: "Tremida", hiddenFromList: false },
  split: { type: "number", default: 0, min: 0, max: 40, step: 1, description: "Separação RGB", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const Shot = Interactive.create({
  Component: ShotInner,
  layout: "absolute-fill",
  schema: shotSchema,
});
