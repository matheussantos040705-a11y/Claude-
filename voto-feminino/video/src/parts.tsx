import React, { useMemo } from "react";
import rough from "roughjs";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { color } from "./theme";
import { InkBurst } from "./fx";

const gen = rough.generator();

// Papel com grão: ruído SVG que muda a cada 2 quadros, como filme.
export const Paper: React.FC<{ tint?: string }> = ({ tint = color.paper }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 7;
  return (
    <AbsoluteFill style={{ backgroundColor: tint }}>
      <svg width="100%" height="100%" style={{ position: "absolute", mixBlendMode: "multiply", opacity: 0.35 }}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Raios de sol construtivistas, girando devagar.
export const Rays: React.FC<{ a: string; b: string; cx?: number; cy?: number; speed?: number; count?: number }> = ({
  a,
  b,
  cx = 540,
  cy = 960,
  speed = 0.15,
  count = 18,
}) => {
  const frame = useCurrentFrame();
  const rot = frame * speed;
  const wedges = Array.from({ length: count }, (_, i) => {
    const a0 = ((i / count) * 360 * Math.PI) / 180;
    const a1 = (((i + 0.5) / count) * 360 * Math.PI) / 180;
    const R = 2600;
    return `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} L${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`;
  });
  return (
    <AbsoluteFill style={{ backgroundColor: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          {wedges.map((d, i) => (
            <path key={i} d={d} fill={b} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Desenho à mão com rough.js, que se traça sozinho entre `from` e `to` (quadros).
export const RoughShape: React.FC<{
  kind: "rect" | "line" | "path" | "circle";
  args: number[] | string;
  from: number;
  to: number;
  stroke?: string;
  width?: number;
  fill?: string;
  seed?: number;
}> = ({ kind, args, from, to, stroke = color.ink, width = 5, fill, seed = 3 }) => {
  const frame = useCurrentFrame();
  const paths = useMemo(() => {
    const o = { stroke, strokeWidth: width, roughness: 1.6, bowing: 1.2, seed, fill, fillStyle: "hachure", hachureGap: 14, fillWeight: 3 };
    const a = args as number[];
    const d =
      kind === "rect"
        ? gen.rectangle(a[0], a[1], a[2], a[3], o)
        : kind === "line"
          ? gen.line(a[0], a[1], a[2], a[3], o)
          : kind === "circle"
            ? gen.circle(a[0], a[1], a[2], o)
            : gen.path(args as string, o);
    return gen.toPaths(d);
  }, [kind, args, stroke, width, fill, seed]);
  const p = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <g>
      {paths.map((pi, i) => (
        <path
          key={i}
          d={pi.d}
          stroke={pi.stroke}
          strokeWidth={pi.strokeWidth}
          fill="none"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

// Palavra "carimbada": entra grande e assenta com uma mola seca.
export const Stamp: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  rotate?: number;
}> = ({ at, children, style, rotate = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 260, mass: 0.6 } });
  if (frame < at) return null;
  const scale = interpolate(s, [0, 1], [1.9, 1]);
  const opacity = interpolate(frame - at, [0, 3], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", transform: `rotate(${rotate}deg) scale(${scale})`, opacity, ...style }}>
      <InkBurst at={at} seed={`st${at}`} />
      {children}
    </div>
  );
};

// Retrato que se desenha: primeiro os contornos, varridos na diagonal como a
// mão do desenhista, depois o sombreamento; tudo com um avanço lento de câmera.
export const Portrait: React.FC<{ name: string; left: number; top: number; width: number; drawFrom: number; drawTo: number }> = ({
  name,
  left,
  top,
  width,
  drawFrom,
  drawTo,
}) => {
  const frame = useCurrentFrame();
  const mid = drawFrom + (drawTo - drawFrom) * 0.55;
  const lineP = interpolate(frame, [drawFrom, mid], [-20, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const shadeP = interpolate(frame, [drawFrom + (drawTo - drawFrom) * 0.3, drawTo], [-20, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const zoom = interpolate(frame, [0, 300], [1.0, 1.07]);
  const sweep = (p: number) => `linear-gradient(160deg, #000 ${p - 12}%, rgba(0,0,0,0.35) ${p - 4}%, transparent ${p}%)`;
  const h = width * 1.25;
  const layer = (p: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    WebkitMaskImage: sweep(p),
    maskImage: sweep(p),
  });
  return (
    <div style={{ position: "absolute", left, top, width, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 40%" }}>
        <Img src={staticFile(`retratos/${name}-sombra.png`)} style={layer(shadeP)} />
        <Img src={staticFile(`retratos/${name}-linhas.png`)} style={layer(lineP)} />
      </div>
    </div>
  );
};

// Vinheta e luz quente de projeção, por cima de tudo.
export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.9 + 0.1 * Math.sin(frame * 0.7) * Math.sin(frame * 0.23);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(255,214,150,${0.04 * flicker}) 0%, transparent 62%, rgba(10,6,4,0.28) 100%)`,
      }}
    />
  );
};

// Faixa diagonal que varre a tela nas trocas de cena.
export const Wipe: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -8 || t > 10) return null;
  const x = interpolate(t, [-8, 10], [-1800, 1800], { easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x, top: -400, width: 520, height: 2800, backgroundColor: color.red, transform: "rotate(18deg)" }} />
      <div style={{ position: "absolute", left: x + 520, top: -400, width: 180, height: 2800, backgroundColor: color.ink, transform: "rotate(18deg)" }} />
    </AbsoluteFill>
  );
};
