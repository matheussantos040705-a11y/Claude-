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
import { Fog } from "../components/Fog";

type Tone =
  | "paint" // oil paintings: natural colour, matte blacks
  | "statue" // marble and bronze: cool, a little desaturated
  | "ash" // Doré engravings on warm paper
  | "fire"
  | "ice"
  | "haze" // dark silhouettes in a blown-out white fog
  | "red" // red monochrome
  | "threshold"; // 1-bit black and white

type ShotProps = {
  /** Image path inside public/ */
  readonly src: string;
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
  /** Frames (relative to the shot) that get a smaller punch */
  readonly pulses?: number[];
  readonly fadeIn?: number;
  readonly fadeOut?: number;
  /** Frames to slide up into frame from below, leaving black behind */
  readonly slideIn?: number;
  /** Frames to slide up out of frame at the end */
  readonly slideOut?: number;
};

const decay = (frame: number, at: number, length: number) =>
  interpolate(frame - at, [0, length], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) * (frame >= at ? 1 : 0);

const toneFilter = (tone: Tone, light: number) => {
  switch (tone) {
    case "paint":
      return `contrast(1.08) saturate(0.9) brightness(${1.2 * light})`;
    case "statue":
      return `saturate(0.55) contrast(1.18) brightness(${1.0 * light})`;
    case "fire":
      return `grayscale(1) sepia(0.9) saturate(1.7) hue-rotate(-14deg) contrast(1.3) brightness(${0.9 * light})`;
    case "ice":
      return `grayscale(1) sepia(0.45) hue-rotate(168deg) saturate(1.5) contrast(1.3) brightness(${0.88 * light})`;
    case "haze":
      // Maps the grey backdrop to white and the bronze to near black.
      return "grayscale(1) brightness(1.23) contrast(2.4) blur(3.5px)";
    case "red":
      return "grayscale(1) contrast(1.6) brightness(1.2)";
    case "threshold":
      return "grayscale(1) contrast(30) brightness(1.05)";
    default:
      return `grayscale(1) sepia(0.28) contrast(1.28) brightness(${0.94 * light})`;
  }
};

// One image on screen: graded, framed on its point of interest, with a slow
// push-in and, where the edit asks for it, the hits at the cut.
const ShotInner: React.FC<ShotProps> = ({
  src,
  focusX = 0.5,
  focusY = 0.5,
  zoomFrom = 1.03,
  zoomTo = 1.1,
  panX = 0,
  panY = 0,
  tone = "paint",
  punch = 0,
  flash = 0,
  shake = 0,
  split = 0,
  invert = 0,
  pulses = [],
  fadeIn = 0,
  fadeOut = 0,
  slideIn = 0,
  slideOut = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `split-${id}`;

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hit = decay(frame, 0, 9);
  const pulse = pulses.reduce((sum, p) => sum + decay(frame, p, 7), 0);
  const scale =
    (zoomFrom + (zoomTo - zoomFrom) * progress) * (1 + punch * hit + 0.04 * pulse);
  const shakeAmount = shake * decay(frame, 0, 12) + shake * 0.4 * pulse;
  const shakeX = noise2D(`${src}-sx`, frame * 0.9, 0) * shakeAmount;
  const shakeY = noise2D(`${src}-sy`, frame * 0.9, 0) * shakeAmount;

  const flickers = tone === "fire";
  const light =
    1 + (flickers ? 0.1 : 0.03) * noise2D(`${src}-light`, frame * (flickers ? 0.35 : 0.1), 0);
  const splitAmount = split * decay(frame, 0, 6) + split * 0.5 * pulse;

  // Slide transitions: the image travels a full frame height in a few frames.
  const slide =
    (slideIn
      ? interpolate(frame, [0, slideIn], [100, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.2, 0.8, 0.3, 1),
        })
      : 0) +
    (slideOut
      ? interpolate(frame, [durationInFrames - slideOut, durationInFrames], [0, -100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.7, 0, 0.8, 0.2),
        })
      : 0);

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          opacity,
          translate: `0px ${slide}%`,
        }}
      >
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
            src={staticFile(src)}
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

        {tone === "paint" || tone === "ash" || tone === "statue" ? (
          // Matte blacks: nothing gets darker than a deep, slightly green grey.
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#131614", mixBlendMode: "lighten" }} />
        ) : null}
        {tone === "fire" ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "screen",
              opacity: 0.45 * light,
              background:
                "radial-gradient(ellipse 90% 45% at 50% 100%, rgba(255, 110, 30, 0.4) 0%, rgba(120, 20, 0, 0) 70%)",
            }}
          />
        ) : null}
        {tone === "haze" ? (
          <>
            <Fog id={`haze-${id}`} seed={5} rgb={[1, 1, 1]} density={1.3} speedX={1.2} speedY={-0.4} opacity={0.75} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                mixBlendMode: "screen",
                background:
                  "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%)",
              }}
            />
          </>
        ) : null}
        {tone === "red" ? (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#ff1208", mixBlendMode: "multiply" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                mixBlendMode: "screen",
                background:
                  "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(255, 210, 210, 0.45) 0%, rgba(255, 60, 60, 0) 70%)",
              }}
            />
          </>
        ) : null}
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
  src: { type: "string", default: "shots/ugolino-rosto.jpg", description: "Imagem" },
  focusX: { type: "number", default: 0.5, min: 0, max: 1, step: 0.01, description: "Foco X", hiddenFromList: false },
  focusY: { type: "number", default: 0.5, min: 0, max: 1, step: 0.01, description: "Foco Y", hiddenFromList: false },
  zoomFrom: { type: "number", default: 1.03, min: 1, max: 3, step: 0.01, description: "Zoom inicial", hiddenFromList: false },
  zoomTo: { type: "number", default: 1.1, min: 1, max: 3, step: 0.01, description: "Zoom final", hiddenFromList: false },
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
