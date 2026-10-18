import { noise2D } from "@remotion/noise";
import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Embers } from "../components/Embers";
import { Flames } from "../components/Flames";
import { Fog } from "../components/Fog";
import { IgniteLetters } from "../components/IgniteLetters";
import { RevealWords } from "../components/RevealWords";
import { cinzel, cormorant } from "../fonts";

const OUTER_ARCH =
  "M90 1920 L90 1260 C90 1060 300 940 540 880 C780 940 990 1060 990 1260 L990 1920 Z";
const INNER_ARCH =
  "M300 1920 L300 1360 C300 1220 420 1120 540 1080 C660 1120 780 1220 780 1360 L780 1920 Z";

// Robed silhouettes, feet at (0, 0). Dante wears his hooded cappuccio,
// Virgil is a little taller and leans on a staff.
const DANTE =
  "M -15 -168 C -28 -150 -31 -110 -33 -62 C -35 -32 -39 -12 -42 0 L 42 0 C 38 -12 34 -32 32 -62 C 30 -110 27 -150 15 -168 Z " +
  "M -16 -170 C -20 -196 -6 -208 3 -208 C 16 -208 22 -194 18 -172 C 22 -166 30 -150 34 -132 C 26 -150 18 -160 12 -164 C 2 -160 -12 -162 -16 -170 Z";
const VIRGIL =
  "M -16 -178 C -30 -160 -33 -118 -35 -66 C -37 -34 -41 -12 -44 0 L 44 0 C 40 -12 36 -34 34 -66 C 32 -118 29 -160 16 -178 Z " +
  "M -13 -182 C -16 -204 -6 -214 2 -214 C 12 -214 18 -204 14 -182 C 8 -176 -8 -176 -13 -182 Z";

// Wedge-shaped voussoirs fanning around the pointed arch.
const VOUSSOIR_ANGLES = [-80, -62, -45, -30, -15, 0, 15, 30, 45, 62, 80];
const COURSES = [1440, 1530, 1620, 1710, 1800];

const GateStone: React.FC<{ readonly glow: number }> = ({ glow }) => {
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <defs>
        <linearGradient id="porta-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1f1c" />
          <stop offset="55%" stopColor="#170f0d" />
          <stop offset="100%" stopColor="#0b0706" />
        </linearGradient>
        <radialGradient id="porta-warm" cx="540" cy="1500" r="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff6a1f" stopOpacity={0.55} />
          <stop offset="60%" stopColor="#8a1c08" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <clipPath id="porta-stone-clip">
          <path d={`${OUTER_ARCH} ${INNER_ARCH}`} clipRule="evenodd" />
        </clipPath>
        <filter id="porta-texture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="5" seed="4" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0 0.02  0 0 0 1.4 -0.45"
          />
        </filter>
        <filter id="porta-rim-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      <path d={`${OUTER_ARCH} ${INNER_ARCH}`} fillRule="evenodd" fill="url(#porta-stone)" />
      <g clipPath="url(#porta-stone-clip)">
        <rect width="1080" height="1920" filter="url(#porta-texture)" />
        <rect width="1080" height="1920" fill="url(#porta-warm)" opacity={glow} />
        {VOUSSOIR_ANGLES.map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={540 + Math.cos(a) * 250}
              y1={1360 + Math.sin(a) * 250}
              x2={540 + Math.cos(a) * 560}
              y2={1360 + Math.sin(a) * 560}
              stroke="#050302"
              strokeWidth={4}
            />
          );
        })}
        {COURSES.map((y, i) => (
          <g key={y}>
            <line x1={0} y1={y} x2={1080} y2={y} stroke="#050302" strokeWidth={4} />
            <line
              x1={i % 2 ? 195 : 160}
              y1={y}
              x2={i % 2 ? 195 : 160}
              y2={y + 90}
              stroke="#050302"
              strokeWidth={4}
            />
            <line
              x1={i % 2 ? 885 : 920}
              y1={y}
              x2={i % 2 ? 885 : 920}
              y2={y + 90}
              stroke="#050302"
              strokeWidth={4}
            />
          </g>
        ))}
      </g>

      {/* Capitals and keystone */}
      <rect x={66} y={1252} width={258} height={30} fill="#1d1513" />
      <rect x={756} y={1252} width={258} height={30} fill="#1d1513" />
      <rect x={66} y={1252} width={258} height={3} fill="#4a2a1c" />
      <rect x={756} y={1252} width={258} height={3} fill="#4a2a1c" />
      <path d="M505 872 L575 872 L565 1086 L515 1086 Z" fill="#1f1714" stroke="#060403" strokeWidth={4} />

      {/* Infernal light catching the inner edge of the arch */}
      <path
        d={INNER_ARCH}
        fill="none"
        stroke="#ff7a2a"
        strokeWidth={22}
        opacity={0.75 * glow}
        filter="url(#porta-rim-glow)"
      />
      <path d={INNER_ARCH} fill="none" stroke="#ffb066" strokeWidth={2.5} opacity={0.8 * glow} />
    </svg>
  );
};

const PortaInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const glow = 0.82 + 0.18 * noise2D("porta-light", 0, frame * 0.09);

  return (
    <>
      <Interactive.Div
        name="Câmera"
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 1520px",
          scale: interpolate(
            frame,
            [0, 200, durationInFrames],
            [1, 1.05, 5.5],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.55, 0, 0.9, 0.4),
              output: "perceptual-scale",
            },
          ),
          translate: interpolate(frame, [0, 200], ["0px 60px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.33, 0, 0.2, 1),
          }),
        }}
      >
        {/* Sky: black above, smouldering red near the gate */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 90% 55% at 50% 72%, #3a0a05 0%, #1a0503 45%, #070202 75%, #030101 100%)",
          }}
        />
        <Fog
          id="porta-smoke"
          seed={13}
          rgb={[0.32, 0.08, 0.04]}
          density={1.2}
          speedX={0.2}
          speedY={-0.9}
          opacity={0.9}
          top={0}
          height={1400}
          mask="linear-gradient(180deg, transparent 0%, black 30%, black 80%, transparent 100%)"
        />

        {/* The doorway: a furnace seen through the arch */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `path("${INNER_ARCH}")`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 420px 620px at 540px 1780px, #fff0c4 0%, #ffb347 14%, #ff5a1a 32%, #a3180a 58%, #3d0603 82%, #140201 100%)",
              opacity: glow,
            }}
          />
          <Fog
            id="porta-inner-smoke"
            seed={3}
            rgb={[0.15, 0.02, 0.01]}
            density={1.3}
            speedY={-1.6}
            speedX={0.3}
            opacity={0.85}
            blendMode="multiply"
          />
          <Flames
            id="porta-flames"
            seed="porta"
            width={width}
            baseY={1930}
            count={14}
            maxHeight={520}
            intensity={glow}
            style={{ left: 0, top: 0 }}
          />
        </div>

        <GateStone glow={glow} />

        {/* Steps worn by the endless procession of the damned */}
        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <defs>
            <linearGradient id="porta-step" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a1a10" />
              <stop offset="100%" stopColor="#080404" />
            </linearGradient>
          </defs>
          <rect x={150} y={1812} width={780} height={40} fill="url(#porta-step)" />
          <rect x={110} y={1852} width={860} height={40} fill="url(#porta-step)" />
          <rect x={70} y={1892} width={940} height={40} fill="url(#porta-step)" />
          <rect x={150} y={1812} width={780} height={3} fill="#ff8a3d" opacity={0.7 * glow} />
          <rect x={110} y={1852} width={860} height={3} fill="#ff7a2a" opacity={0.45 * glow} />
          <rect x={70} y={1892} width={940} height={3} fill="#ff6a1f" opacity={0.3 * glow} />
        </svg>

        {/* Dante and Virgil, backlit, stepping toward the gate */}
        <Interactive.Svg
          name="Dante e Virgílio"
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "540px 1812px",
            scale: interpolate(frame, [0, 230], [1.08, 0.94], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.33, 0, 0.67, 1),
            }),
          }}
        >
          <defs>
            <filter id="porta-figures-rim" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <g filter="url(#porta-figures-rim)" opacity={0.85 * glow}>
            <path d={DANTE} transform="translate(486 1814)" fill="#ff8a3d" />
            <path d={VIRGIL} transform="translate(596 1814)" fill="#ff8a3d" />
          </g>
          <path d={DANTE} transform="translate(486 1814)" fill="#050202" />
          <path d={VIRGIL} transform="translate(596 1814)" fill="#050202" />
          <line x1={634} y1={1606} x2={642} y2={1814} stroke="#050202" strokeWidth={5} strokeLinecap="round" />
        </Interactive.Svg>

        <Embers
          seed="porta"
          count={60}
          color="rgba(255, 110, 30, 0.95)"
          coreColor="#fff1c8"
          minSize={3}
          maxSize={9}
          speed={2.6}
          drift={110}
          wind={0.4}
        />

        {/* The inscription above the gate */}
        <Interactive.Div
          name="Inscrição"
          style={{
            position: "absolute",
            inset: 0,
            opacity: interpolate(frame, [205, 228], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <Interactive.Div
            name="Canto III"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 240,
              textAlign: "center",
              fontFamily: cinzel,
              fontWeight: 600,
              fontSize: 40,
              letterSpacing: "0.5em",
              color: "#b5482a",
              opacity: interpolate(frame, [5, 30], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            CANTO III
          </Interactive.Div>
          <IgniteLetters
            name="Lasciate"
            text="LASCIATE"
            delay={30}
            stagger={4}
            style={{
              top: 318,
              fontFamily: cinzel,
              fontWeight: 700,
              fontSize: 132,
              letterSpacing: "0.06em",
            }}
          />
          <IgniteLetters
            name="Ogne speranza"
            text="OGNE SPERANZA,"
            delay={70}
            stagger={3}
            style={{
              top: 478,
              fontFamily: cinzel,
              fontWeight: 700,
              fontSize: 84,
              letterSpacing: "0.04em",
            }}
          />
          <IgniteLetters
            name="Voi ch'intrate"
            text="VOI CH'INTRATE"
            delay={112}
            stagger={2.5}
            style={{
              top: 596,
              fontFamily: cinzel,
              fontWeight: 600,
              fontSize: 58,
              letterSpacing: "0.22em",
            }}
          />
          <RevealWords
            name="Tradução"
            text="Deixai toda esperança, vós que entrais."
            delay={150}
            stagger={4}
            glowColor="rgba(0, 0, 0, 0.9)"
            style={{
              top: 712,
              fontFamily: cormorant,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 50,
              color: "#d8c7ad",
            }}
          />
        </Interactive.Div>
      </Interactive.Div>

      {/* The furnace swallows the frame as we pass through the gate */}
      <Interactive.Div
        name="Clarão"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 78%, #ffcf8a 0%, #ff6a1f 40%, #7a1206 100%)",
          mixBlendMode: "screen",
          opacity: interpolate(frame, [235, durationInFrames], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.5, 0, 1, 1),
          }),
        }}
      />
    </>
  );
};

export const Porta = Interactive.create({
  Component: PortaInner,
  layout: "absolute-fill",
});
