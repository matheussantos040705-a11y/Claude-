import { noise2D } from "@remotion/noise";
import React from "react";
import { Interactive, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { cinzel, cormorant, logoFonts } from "../fonts";

const SETTLE = 30;
const SMEARS = [8, 9, 21, 22, 47];

// The closing card: a white flash, then the title flickers through a handful
// of typefaces, smears sideways, and settles glowing inside a lens vignette.
const EndLogoInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const font =
    frame < SETTLE ? logoFonts[Math.floor(frame / 2) % logoFonts.length] : logoFonts[0];
  const smear = SMEARS.includes(frame);
  const flicker =
    frame < SETTLE
      ? 0.75 + 0.25 * random(`logo-${frame}`)
      : 0.9 + 0.1 * noise2D("logo-hold", frame * 0.3, 0);
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const jitter = frame < SETTLE ? (random(`logo-j-${frame}`) - 0.5) * 18 : 0;
  const burst = interpolate(frame, [44, 46, 52], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <Interactive.Div
        name="Inferno"
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: 960 - 120,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
          fontFamily: font,
          fontSize: font === logoFonts[0] ? 230 : 190,
          lineHeight: 1,
          color: "#ffffff",
          opacity: flicker * out,
          scale: smear ? "2.6 0.55" : `${interpolate(frame, [0, durationInFrames], [1.08, 1.0])}`,
          translate: `${jitter}px 0px`,
          filter: `blur(${smear ? 6 : frame < 4 ? 4 : 0.6}px) drop-shadow(0 0 12px rgba(255,255,255,0.9)) drop-shadow(0 0 40px rgba(255,255,255,0.55))`,
        }}
      >
        {font === logoFonts[0] ? "Inferno" : "INFERNO"}
      </Interactive.Div>
      <Interactive.Div
        name="Dante Alighieri"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1110,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: "0.6em",
          color: "#d9d4cc",
          opacity:
            interpolate(frame, [SETTLE + 4, SETTLE + 18], [0, 0.85], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * out,
        }}
      >
        DANTE ALIGHIERI
      </Interactive.Div>
      {/* Lens: dark edges and the faint rim of the glass */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 62% 40% at 50% 50%, rgba(0,0,0,0) 72%, rgba(255,255,255,0.12) 74%, rgba(0,0,0,0.85) 80%, #000 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0) 70%)",
          opacity: burst,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
          opacity: interpolate(frame, [0, 3], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <Interactive.Div
        name="Créditos"
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 1700,
          textAlign: "center",
          fontFamily: cormorant,
          fontStyle: "italic",
          fontSize: 28,
          lineHeight: 1.45,
          color: "#6f6a62",
          opacity:
            interpolate(frame, [SETTLE + 10, SETTLE + 24], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * out,
        }}
      >
        Doré · Carpeaux · Rodin · Permoser · Van Eyck · Van Cleve · Brueghel
        <br />
        Música: “Chess Type Phonk Beat”, K0i, Jesus Mus1c &amp; Joyful (CC BY 4.0)
      </Interactive.Div>
    </>
  );
};

export const EndLogo = Interactive.create({
  Component: EndLogoInner,
  layout: "absolute-fill",
});
