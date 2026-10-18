import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import {
  Easing,
  Interactive,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Fog } from "../components/Fog";
import { RevealWords } from "../components/RevealWords";
import { cinzel, cinzelDecorative, cormorant } from "../fonts";

const HORIZON_Y = 1640;

// The rocky mouth of the "natural burella", the passage out of Hell.
const CAVE_MOUTH =
  "M -200 -200 L 1280 -200 L 1280 2120 L -200 2120 Z " +
  "M 540 520 C 640 515 760 560 820 650 C 880 740 900 860 890 990 " +
  "C 880 1120 900 1260 860 1400 C 830 1500 760 1560 700 1600 " +
  "C 620 1650 460 1655 380 1610 C 300 1565 230 1480 210 1380 " +
  "C 185 1250 205 1120 195 990 C 185 860 205 740 265 650 C 325 570 440 525 540 520 Z";

// Mount Purgatory: steep, ragged flanks broken into terraces, with a small
// plateau on top for the Earthly Paradise.
const buildPurgatory = () => {
  const summitY = 1270;
  const points: string[] = [`M 0 ${HORIZON_Y}`, `L 200 ${HORIZON_Y}`];
  for (let x = 200; x <= 880; x += 6) {
    const t = x < 540 ? (x - 200) / 330 : (880 - x) / 330;
    const rise = Math.min(1, Math.max(0, t)) ** 1.7;
    let y = HORIZON_Y - (HORIZON_Y - summitY) * rise;
    // Terraces: let the profile settle on ledges every ~52px of height.
    const ledge = Math.round(y / 52) * 52;
    y = y * 0.72 + ledge * 0.28;
    y += noise2D("purgatorio", x * 0.03, 0) * 7 * (1 - rise * 0.5);
    points.push(`L ${x} ${Math.max(summitY, y)}`);
  }
  points.push(`L 1080 ${HORIZON_Y}`, "L 1080 1700", "L 0 1700", "Z");
  return points.join(" ");
};

const Stars: React.FC<{ readonly reveal: number }> = ({ reveal }) => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      new Array(300).fill(true).map((_, i) => ({
        x: random(`star-x-${i}`) * 1080,
        y: random(`star-y-${i}`) * (HORIZON_Y - 40),
        size: 1 + random(`star-s-${i}`) ** 3 * 3.5,
        threshold: random(`star-t-${i}`),
      })),
    [],
  );

  return (
    <>
      {stars.map((st, i) => {
        const appear = interpolate(reveal, [st.threshold * 0.8, st.threshold * 0.8 + 0.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const twinkle = 0.55 + 0.45 * noise2D("twinkle", i, frame * 0.08);
        // Fainter toward the horizon haze.
        const haze = interpolate(st.y, [HORIZON_Y - 500, HORIZON_Y], [1, 0.25], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: st.x - st.size / 2,
              top: st.y - st.size / 2,
              width: st.size,
              height: st.size,
              borderRadius: "50%",
              background: st.size > 3 ? "#fff6e6" : "#dfe8ff",
              boxShadow: st.size > 2.5 ? `0 0 ${st.size * 3}px rgba(220, 230, 255, 0.8)` : undefined,
              opacity: appear * twinkle * haze,
            }}
          />
        );
      })}
    </>
  );
};

type GlintProps = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly color: string;
  readonly appearAt: number;
};

// A bright star with a four-pointed diffraction cross.
const Glint: React.FC<GlintProps> = ({ x, y, size, color, appearAt }) => {
  const frame = useCurrentFrame();
  const shine =
    interpolate(frame, [appearAt, appearAt + 25], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    (0.8 + 0.2 * noise2D("glint", x, frame * 0.07));
  const ray = (rotate: string, length: number) => (
    <div
      style={{
        position: "absolute",
        left: x - length / 2,
        top: y - 1,
        width: length,
        height: 2,
        rotate,
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${color} 50%, rgba(255,255,255,0) 100%)`,
      }}
    />
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: shine }}>
      <div
        style={{
          position: "absolute",
          left: x - size * 3,
          top: y - size * 3,
          width: size * 6,
          height: size * 6,
          borderRadius: "50%",
          background: `radial-gradient(circle, #ffffff 0%, ${color} 14%, rgba(0,0,0,0) 60%)`,
        }}
      />
      {ray("0deg", size * 16)}
      {ray("90deg", size * 16)}
      {ray("45deg", size * 7)}
      {ray("-45deg", size * 7)}
    </div>
  );
};

const EstrelasInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const purgatory = useMemo(buildPurgatory, []);
  const reveal = interpolate(frame, [10, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #010208 0%, #04061a 35%, #0d0d2c 62%, #2a1838 80%, #6a3a3a 85.4%, #120a14 85.5%, #05040a 100%)",
        }}
      />
      {/* Dawn glow behind the mountain */}
      <div
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: 1180,
          height: 700,
          background:
            "radial-gradient(ellipse 50% 40% at 50% 70%, rgba(255, 170, 110, 0.4) 0%, rgba(160, 80, 90, 0.2) 40%, rgba(0,0,0,0) 75%)",
          opacity: interpolate(frame, [60, durationInFrames], [0.3, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: "linear-gradient(180deg, black 0%, black 55%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(180deg, black 0%, black 55%, transparent 80%)",
        }}
      >
        <Fog
          id="estrelas-milky-way"
          seed={77}
          rgb={[0.7, 0.75, 1]}
          density={0.9}
          scale={0.8}
          speedX={0.15}
          opacity={0.28 * reveal}
          mask="linear-gradient(115deg, transparent 20%, black 42%, black 52%, transparent 75%)"
        />
      </div>
      <Stars reveal={reveal} />
      <Glint x={180} y={330} size={4} color="#cfe0ff" appearAt={40} />
      <Glint x={890} y={520} size={3} color="#ffe6c8" appearAt={60} />
      <Glint x={760} y={180} size={3.5} color="#dfe6ff" appearAt={75} />
      <Glint x={300} y={1080} size={3} color="#e8dcff" appearAt={90} />
      {/* Venus, the fair planet that heartens to love, low over the sea */}
      <Glint x={840} y={1390} size={6} color="#ffd9a8" appearAt={50} />

      {/* Purgatory rising from the southern ocean */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <linearGradient id="estrelas-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2232" />
            <stop offset="15%" stopColor="#120c1c" />
            <stop offset="100%" stopColor="#030208" />
          </linearGradient>
        </defs>
        <path d={purgatory} fill="none" stroke="#ffb27a" strokeOpacity={0.3} strokeWidth={3} />
        <path d={purgatory} fill="#08060f" />
        <rect x={0} y={HORIZON_Y} width={1080} height={1920 - HORIZON_Y} fill="url(#estrelas-sea)" />
        {new Array(26).fill(true).map((_, i) => {
          const y = HORIZON_Y + 12 + i * i * 0.45 + i * 6;
          const w = 40 + i * 9;
          return (
            <rect
              key={i}
              x={840 - w / 2 + noise2D("sea", i, frame * 0.05) * 18}
              y={y}
              width={w}
              height={1.5 + i * 0.12}
              fill="#ffd9a8"
              opacity={(0.38 - i * 0.013) * (0.4 + 0.6 * noise2D("sea-o", i, frame * 0.15))}
            />
          );
        })}
      </svg>

      {/* Leaving the cave: its mouth opens around us and slides past */}
      <Interactive.Svg
        name="Boca da caverna"
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "visible",
          transformOrigin: "540px 1080px",
          scale: interpolate(frame, [0, 120], [1, 4.2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.5, 0, 0.75, 0.6),
            output: "perceptual-scale",
          }),
          opacity: interpolate(frame, [95, 120], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <path d={CAVE_MOUTH} fill="#020103" fillRule="evenodd" />
        <path
          d={CAVE_MOUTH.split(" Z ")[1]}
          fill="none"
          stroke="#7a86b8"
          strokeOpacity={0.25}
          strokeWidth={3}
        />
      </Interactive.Svg>

      {/* The last verse of the Inferno */}
      <Interactive.Div
        name="Verso final"
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [168, 188], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: `blur(${interpolate(frame, [168, 188], [0, 10], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
        }}
      >
        <RevealWords
          name="Verso italiano"
          text={"E quindi uscimmo\na riveder le stelle."}
          delay={70}
          stagger={7}
          duration={30}
          glowColor="rgba(190, 200, 255, 0.5)"
          style={{
            top: 620,
            fontFamily: cormorant,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 92,
            lineHeight: 1.12,
            color: "#f4efe6",
          }}
        />
        <RevealWords
          name="Tradução"
          text="E dali saímos a rever as estrelas."
          delay={118}
          stagger={4}
          glowColor="rgba(0, 0, 0, 0)"
          style={{
            top: 860,
            fontFamily: cormorant,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 48,
            color: "#a9a6c4",
          }}
        />
      </Interactive.Div>

      {/* Title card */}
      <Interactive.Div
        name="Título"
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [270, 296], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Interactive.Div
          name="La Divina Commedia"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 690,
            textAlign: "center",
            fontFamily: cinzel,
            fontWeight: 600,
            fontSize: 38,
            letterSpacing: "0.45em",
            color: "#c9a36a",
            opacity: interpolate(frame, [192, 215], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          LA DIVINA COMMEDIA
        </Interactive.Div>
        <Interactive.Div
          name="Inferno"
          style={{
            position: "absolute",
            left: -100,
            right: -100,
            top: 748,
            textAlign: "center",
            whiteSpace: "nowrap",
            fontFamily: cinzelDecorative,
            fontWeight: 900,
            fontSize: 140,
            lineHeight: 1.2,
            background:
              "linear-gradient(180deg, #fff3d6 0%, #f2c46d 38%, #d0782c 70%, #8a2a10 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 22px rgba(255, 130, 40, 0.55)) blur(${interpolate(frame, [188, 214], [16, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
            letterSpacing: interpolate(frame, [188, 240], ["0.45em", "0.1em"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            opacity: interpolate(frame, [188, 210], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          INFERNO
        </Interactive.Div>
        <Interactive.Div
          name="Ornamento"
          style={{
            position: "absolute",
            left: 340,
            right: 340,
            top: 940,
            height: 2,
            background:
              "linear-gradient(90deg, rgba(201,163,106,0) 0%, #c9a36a 50%, rgba(201,163,106,0) 100%)",
            scale: interpolate(frame, [205, 245], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        />
        <Interactive.Div
          name="Dante Alighieri"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 972,
            textAlign: "center",
            fontFamily: cinzel,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: "0.42em",
            color: "#efe2c8",
            opacity: interpolate(frame, [215, 240], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [215, 245], ["0px 16px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          DANTE ALIGHIERI
        </Interactive.Div>
      </Interactive.Div>

      <Interactive.Div
        name="Fade final"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#000000",
          opacity: interpolate(frame, [272, durationInFrames - 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </>
  );
};

export const Estrelas = Interactive.create({
  Component: EstrelasInner,
  layout: "absolute-fill",
});
