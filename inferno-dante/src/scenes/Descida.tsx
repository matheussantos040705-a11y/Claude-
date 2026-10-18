import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import {
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  random,
  Track,
  useCurrentFrame,
  useVideoConfig,
  type InteractivitySchema,
} from "remotion";
import { Embers } from "../components/Embers";
import { Fog } from "../components/Fog";
import { cinzel, cormorant } from "../fonts";

type Circle = {
  readonly rim: string;
  readonly floor: string;
  readonly ambient: string;
};

// Palette of each circle, from the grey of Limbo to the ice of Cocytus.
const CIRCLES: readonly Circle[] = [
  { rim: "#9fb3c8", floor: "#1d242b", ambient: "#10161c" }, // I    Limbo
  { rim: "#ff3d7a", floor: "#2e0a18", ambient: "#260612" }, // II   Luxúria
  { rim: "#b8c84a", floor: "#1e210a", ambient: "#151806" }, // III  Gula
  { rim: "#ffc23d", floor: "#2e2006", ambient: "#241703" }, // IV   Avareza
  { rim: "#5fc38a", floor: "#0b1d14", ambient: "#06140d" }, // V    Ira
  { rim: "#ff7a1f", floor: "#331004", ambient: "#2a0b02" }, // VI   Heresia
  { rim: "#ff2433", floor: "#430208", ambient: "#360204" }, // VII  Violência
  { rim: "#b65cff", floor: "#1f0b31", ambient: "#170626" }, // VIII Fraude
  { rim: "#a8e6ff", floor: "#16384f", ambient: "#0a2436" }, // IX   Traição
];

// Each circle owns a 60-frame window: 24 frames of plunge, then a held beat.
const WINDOW = 60;
const PLUNGE = 24;
const CAM_INPUT: number[] = [0];
const CAM_OUTPUT: number[] = [-1.7];
CIRCLES.forEach((_, k) => {
  CAM_INPUT.push(k * WINDOW + PLUNGE);
  CAM_OUTPUT.push(k);
  CAM_INPUT.push((k + 1) * WINDOW);
  CAM_OUTPUT.push(k === CIRCLES.length - 1 ? k + 0.55 : k + 0.08);
});

const cameraAt = (frame: number) =>
  interpolate(frame, CAM_INPUT, CAM_OUTPUT, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.7, 0, 0.3, 1),
  });

// Perspective of the funnel.
const FOCAL = 640;
const NEAR_DEPTH = 1.35;
const VANISH_Y = 1110;
const CENTER_X = 540;

const ringGeometry = (i: number, cam: number) => {
  const d = i - cam + NEAR_DEPTH;
  const radius = 1 - 0.045 * i;
  const rx = (radius * FOCAL) / d;
  return {
    d,
    rx,
    ry: rx * 0.48,
    cy: VANISH_Y + 230 / d,
    opacity:
      interpolate(d, [0.1, 0.3], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }) *
      interpolate(d, [4.5, 7.5], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
  };
};

const FIRES_PER_RING = 40;

const Funnel: React.FC<{ readonly cam: number; readonly pulse: number }> = ({
  cam,
  pulse,
}) => {
  const frame = useCurrentFrame();

  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      <defs>
        {CIRCLES.map((c, i) => (
          <React.Fragment key={i}>
            <radialGradient id={`descida-floor-${i}`} cx="50%" cy="70%" r="62%">
              <stop offset="0%" stopColor={interpolateColors(0.4, [0, 1], [c.floor, c.rim])} />
              <stop offset="45%" stopColor={interpolateColors(0.12, [0, 1], [c.floor, c.rim])} />
              <stop offset="80%" stopColor={c.floor} />
              <stop offset="100%" stopColor={c.ambient} />
            </radialGradient>
            <linearGradient id={`descida-wall-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020101" />
              <stop offset="45%" stopColor={c.ambient} />
              <stop offset="100%" stopColor={interpolateColors(0.35, [0, 1], [c.ambient, c.rim])} />
            </linearGradient>
            <radialGradient id={`descida-fire-${i}`}>
              <stop offset="0%" stopColor="#fff6e0" />
              <stop offset="30%" stopColor={c.rim} />
              <stop offset="100%" stopColor={c.rim} stopOpacity={0} />
            </radialGradient>
          </React.Fragment>
        ))}
        <radialGradient id="descida-cliff">
          <stop offset="55%" stopColor="#000" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <filter id="descida-rim-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {CIRCLES.map((c, i) => {
        const g = ringGeometry(i, cam);
        if (g.opacity <= 0.001) {
          return null;
        }
        const next = i < CIRCLES.length - 1 ? ringGeometry(i + 1, cam) : null;
        const s = Math.min(3.2, 1 / g.d);
        const flare = 1 + pulse * (Math.abs(i - cam) < 0.5 ? 1 : 0);
        return (
          <g key={i} opacity={g.opacity}>
            {/* Terrace floor */}
            <ellipse cx={CENTER_X} cy={g.cy} rx={g.rx} ry={g.ry} fill={`url(#descida-floor-${i})`} />
            {/* Rock strata ringing the terrace */}
            {[0.94, 0.88, 0.8].map((k) => (
              <ellipse
                key={k}
                cx={CENTER_X}
                cy={g.cy - (1 - k) * g.ry * 0.6}
                rx={g.rx * k}
                ry={g.ry * k}
                fill="none"
                stroke="#000"
                strokeOpacity={0.35}
                strokeWidth={3 * s}
              />
            ))}
            {/* The cliff dropping to the next circle: shadow, then the far wall */}
            {next ? (
              <>
                <ellipse
                  cx={CENTER_X}
                  cy={next.cy}
                  rx={next.rx * 1.3}
                  ry={next.ry * 1.45}
                  fill="url(#descida-cliff)"
                />
                <ellipse
                  cx={CENTER_X}
                  cy={next.cy - next.ry * 0.38}
                  rx={next.rx * 1.06}
                  ry={next.ry * 1.22}
                  fill={`url(#descida-wall-${i})`}
                />
              </>
            ) : (
              <ellipse
                cx={CENTER_X}
                cy={g.cy}
                rx={g.rx * 0.55}
                ry={g.ry * 0.55}
                fill="#e8f8ff"
                opacity={0.25}
                filter="url(#descida-rim-blur)"
              />
            )}
            {/* Glowing lip of the circle */}
            <ellipse
              cx={CENTER_X}
              cy={g.cy}
              rx={g.rx}
              ry={g.ry}
              fill="none"
              stroke={c.rim}
              strokeWidth={10 * s}
              opacity={0.55 * flare}
              filter="url(#descida-rim-blur)"
            />
            <ellipse
              cx={CENTER_X}
              cy={g.cy}
              rx={g.rx}
              ry={g.ry}
              fill="none"
              stroke={c.rim}
              strokeWidth={1.6 * s}
              opacity={0.9}
            />
            {/* A ring of fires burning along the ledge */}
            {new Array(FIRES_PER_RING).fill(true).map((_, j) => {
              const theta =
                (j / FIRES_PER_RING) * Math.PI * 2 +
                random(`fire-${i}-${j}`) * 0.12;
              const front = 0.45 + 0.55 * (Math.sin(theta) * 0.5 + 0.5);
              const n = noise2D(`fire-${i}`, j * 0.8, frame * 0.12) * 0.5 + 0.5;
              const r = (4 + 10 * n) * s * front * flare;
              return (
                <circle
                  key={j}
                  cx={CENTER_X + Math.cos(theta) * g.rx}
                  cy={g.cy + Math.sin(theta) * g.ry}
                  r={r}
                  fill={`url(#descida-fire-${i})`}
                  opacity={0.35 + 0.65 * n}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// Sparks that rush upward past the camera whenever it plunges.
const DescentStreaks: React.FC<{ readonly cam: number; readonly velocity: number }> = ({
  cam,
  velocity,
}) => {
  const { width, height } = useVideoConfig();
  const particles = useMemo(
    () =>
      new Array(70).fill(true).map((_, i) => ({
        x: random(`streak-x-${i}`) * width,
        y: random(`streak-y-${i}`) * height,
        depth: 0.4 + random(`streak-d-${i}`) * 0.9,
        size: 2 + random(`streak-s-${i}`) * 4,
      })),
    [width, height],
  );
  const span = height + 400;

  return (
    <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      {particles.map((p, i) => {
        const y = ((((p.y - cam * 1500 * p.depth) % span) + span) % span) - 200;
        const length = p.size + Math.abs(velocity) * 2600 * p.depth;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: y - length / 2,
              width: p.size,
              height: length,
              borderRadius: p.size,
              background:
                "linear-gradient(180deg, rgba(255,200,140,0) 0%, rgba(255,170,90,0.9) 70%, #fff3dc 100%)",
              opacity: Math.min(1, 0.15 + Math.abs(velocity) * 30) * p.depth,
            }}
          />
        );
      })}
    </div>
  );
};

// The second circle: lovers whirled forever by the infernal storm.
const Whirlwind: React.FC<{ readonly opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "screen" }}>
      {new Array(80).fill(true).map((_, i) => {
        const a = 160 + random(`wind-a-${i}`) * 520;
        const theta = random(`wind-t-${i}`) * Math.PI * 2 + frame * (0.03 + random(`wind-w-${i}`) * 0.04);
        const x = CENTER_X + Math.cos(theta) * a;
        const y = 1230 + Math.sin(theta) * a * 0.48;
        const tangent = Math.atan2(Math.cos(theta) * 0.48, -Math.sin(theta));
        const front = 0.4 + 0.6 * (Math.sin(theta) * 0.5 + 0.5);
        const length = (50 + random(`wind-l-${i}`) * 90) * front;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - length / 2,
              top: y,
              width: length,
              height: 3 * front,
              borderRadius: 3,
              background:
                "linear-gradient(90deg, rgba(255,90,150,0) 0%, rgba(255,120,170,0.85) 100%)",
              rotate: `${tangent}rad`,
              opacity: front,
            }}
          />
        );
      })}
    </div>
  );
};

// The third circle: cold, filthy, eternal rain.
const Rain: React.FC<{ readonly opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {new Array(150).fill(true).map((_, i) => {
        const speed = 38 + random(`rain-v-${i}`) * 26;
        const length = 70 + random(`rain-l-${i}`) * 90;
        const y = ((random(`rain-y-${i}`) * (height + 400) + frame * speed) % (height + 400)) - 200;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`rain-x-${i}`) * 1300 - 110 - y * 0.2,
              top: y,
              width: 2,
              height: length,
              rotate: "11deg",
              background:
                "linear-gradient(180deg, rgba(200,210,160,0) 0%, rgba(200,210,160,0.45) 100%)",
            }}
          />
        );
      })}
    </div>
  );
};

type CircleLabelProps = {
  readonly numeral: string;
  readonly title: string;
  readonly description: string;
  readonly color: string;
};

const CircleLabelInner: React.FC<CircleLabelProps> = ({
  numeral,
  title,
  description,
  color,
}) => {
  const frame = useCurrentFrame();

  return (
    <>
      <Interactive.Div
        name="Numeral"
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: 140,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 900,
          fontSize: 380,
          lineHeight: 1,
          color,
          opacity: interpolate(frame, [8, 26, 48, 60], [0, 0.16, 0.16, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [8, 60], [1.15, 0.98], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        {numeral}
      </Interactive.Div>
      <Interactive.Div
        name="Círculo"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 232,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: "0.5em",
          color,
          textShadow: `0 0 18px ${color}`,
          opacity: interpolate(frame, [10, 22, 50, 58], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {`CÍRCULO ${numeral}`}
      </Interactive.Div>
      <Interactive.Div
        name="Nome"
        style={{
          position: "absolute",
          left: -100,
          right: -100,
          top: 300,
          textAlign: "center",
          whiteSpace: "nowrap",
          fontFamily: cinzel,
          fontWeight: 700,
          fontSize: 106,
          color: "#f6ead6",
          textShadow: `0 0 30px ${color}, 0 0 80px ${color}`,
          letterSpacing: interpolate(frame, [12, 40], ["0.3em", "0.1em"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          filter: `blur(${interpolate(frame, [12, 26, 50, 60], [14, 0, 0, 10], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          opacity: interpolate(frame, [12, 26, 50, 60], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="Descrição"
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 446,
          textAlign: "center",
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 54,
          color: "#e2d3bc",
          textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          opacity: interpolate(frame, [20, 32, 50, 58], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [20, 36], ["0px 18px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        {description}
      </Interactive.Div>
    </>
  );
};

const circleLabelSchema = {
  numeral: { type: "string", default: "I", description: "Numeral" },
  title: { type: "string", default: "", description: "Nome" },
  description: { type: "string", default: "", description: "Descrição" },
  color: { type: "color", default: "#ff7a1f", description: "Cor" },
} as const satisfies InteractivitySchema;

export const CircleLabel = Interactive.create({
  Component: CircleLabelInner,
  layout: "absolute-fill",
  schema: circleLabelSchema,
});

// Opacity envelope for effects that belong to circle k.
const windowEnvelope = (frame: number, k: number) =>
  interpolate(
    frame,
    [k * WINDOW + 6, k * WINDOW + PLUNGE, (k + 1) * WINDOW - 2, (k + 1) * WINDOW + 10],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

const DescidaInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame);
  const velocity = cameraAt(frame + 0.5) - cameraAt(frame - 0.5);
  const focus = Math.max(0, Math.min(CIRCLES.length - 1, cam));

  // Every landing on a new circle shakes the camera and flares the fires.
  let shake = 0;
  CIRCLES.forEach((_, k) => {
    shake += interpolate(frame - (k * WINDOW + PLUNGE), [-2, 2, 22], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });
  const shakeX = noise2D("shake-x", frame * 0.6, 0) * 16 * shake;
  const shakeY = noise2D("shake-y", frame * 0.6, 0) * 12 * shake;

  const ambient = interpolateColors(
    focus,
    CIRCLES.map((_, i) => i),
    CIRCLES.map((c) => c.ambient),
  );
  const rim = interpolateColors(
    focus,
    CIRCLES.map((_, i) => i),
    CIRCLES.map((c) => c.rim),
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 80% 55% at 50% 58%, ${ambient} 0%, #050203 70%, #020101 100%)`,
        }}
      />
      <Fog
        id="descida-smoke"
        seed={31}
        rgb={[0.2, 0.08, 0.06]}
        density={1.1}
        speedY={-3}
        speedX={0.4}
        opacity={0.7}
        top={0}
        height={1100}
        mask="linear-gradient(180deg, black 0%, black 55%, transparent 100%)"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          translate: `${shakeX}px ${shakeY}px`,
        }}
      >
        <Funnel cam={cam} pulse={shake * 0.6} />
        {/* The pit glows with the colour of the circle we are in */}
        <div
          style={{
            position: "absolute",
            left: 140,
            right: 140,
            top: 930,
            height: 420,
            background: `radial-gradient(ellipse at 50% 55%, ${rim} 0%, rgba(0,0,0,0) 65%)`,
            mixBlendMode: "screen",
            opacity: 0.22 + 0.1 * noise2D("pit", 0, frame * 0.1),
          }}
        />
      </div>

      <DescentStreaks cam={cam} velocity={velocity} />

      {/* Weather of the circles */}
      <Whirlwind opacity={windowEnvelope(frame, 1)} />
      <Rain opacity={windowEnvelope(frame, 2)} />
      <Embers
        seed="heresia"
        count={70}
        color="rgba(255, 120, 30, 0.95)"
        coreColor="#fff1c8"
        minSize={3}
        maxSize={10}
        speed={5}
        drift={90}
        opacity={windowEnvelope(frame, 5)}
      />
      <Embers
        seed="chuva-de-fogo"
        count={60}
        color="rgba(255, 70, 20, 0.95)"
        coreColor="#ffe2a8"
        minSize={5}
        maxSize={12}
        speed={-7}
        drift={40}
        stretch={2.6}
        wind={-1.2}
        opacity={windowEnvelope(frame, 6)}
      />
      <Embers
        seed="neve"
        count={110}
        color="rgba(200, 235, 255, 0.9)"
        coreColor="#ffffff"
        minSize={3}
        maxSize={8}
        speed={-3}
        drift={140}
        wind={4}
        opacity={windowEnvelope(frame, 8)}
      />

      {/* Top shade, so the labels always sit on darkness */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 820,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Depth gauge */}
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 1290,
          width: 2,
          height: 480,
          background: "rgba(255,255,255,0.14)",
        }}
      />
      {CIRCLES.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 66,
            top: 1290 + i * 60 - 1,
            width: 18,
            height: 2,
            background: i <= focus + 0.01 ? c.rim : "rgba(255,255,255,0.25)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 63,
          top: 1290 + focus * 60 - 12,
          width: 24,
          height: 24,
          borderRadius: 12,
          background: rim,
          boxShadow: `0 0 24px 6px ${rim}`,
        }}
      />

      <Track name="Círculos">
        <CircleLabel
          name="I · Limbo"
          durationInFrames={2 * fps}
          numeral="I"
          title="LIMBO"
          description="os que não conheceram a fé"
          color="#9fb3c8"
        />
        <CircleLabel
          name="II · Luxúria"
          from={2 * fps}
          durationInFrames={2 * fps}
          numeral="II"
          title="LUXÚRIA"
          description="arrastados pela tempestade eterna"
          color="#ff3d7a"
        />
        <CircleLabel
          name="III · Gula"
          from={4 * fps}
          durationInFrames={2 * fps}
          numeral="III"
          title="GULA"
          description="sob a chuva fria e imunda"
          color="#b8c84a"
        />
        <CircleLabel
          name="IV · Avareza"
          from={6 * fps}
          durationInFrames={2 * fps}
          numeral="IV"
          title="AVAREZA"
          description="empurrando pesos sem fim"
          color="#ffc23d"
        />
        <CircleLabel
          name="V · Ira"
          from={8 * fps}
          durationInFrames={2 * fps}
          numeral="V"
          title="IRA"
          description="afogados no pântano do Estige"
          color="#5fc38a"
        />
        <CircleLabel
          name="VI · Heresia"
          from={10 * fps}
          durationInFrames={2 * fps}
          numeral="VI"
          title="HERESIA"
          description="ardendo em sepulcros de fogo"
          color="#ff7a1f"
        />
        <CircleLabel
          name="VII · Violência"
          from={12 * fps}
          durationInFrames={2 * fps}
          numeral="VII"
          title="VIOLÊNCIA"
          description="no rio de sangue fervente"
          color="#ff2433"
        />
        <CircleLabel
          name="VIII · Fraude"
          from={14 * fps}
          durationInFrames={2 * fps}
          numeral="VIII"
          title="FRAUDE"
          description="nas dez valas de Malebolge"
          color="#b65cff"
        />
        <CircleLabel
          name="IX · Traição"
          from={16 * fps}
          durationInFrames={2 * fps}
          numeral="IX"
          title="TRAIÇÃO"
          description="presos no gelo do Cocito"
          color="#a8e6ff"
        />
      </Track>
    </>
  );
};

export const Descida = Interactive.create({
  Component: DescidaInner,
  layout: "absolute-fill",
});
