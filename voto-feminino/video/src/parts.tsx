import React, { useMemo } from "react";
import rough from "roughjs";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { color, font } from "./theme";

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
      {children}
    </div>
  );
};

// Etiqueta que diz qual técnica está em cena.
export const SkillChip: React.FC<{ label: string; dark?: boolean }> = ({ label, dark }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [4, 16], [-420, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 92,
        left: 0,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 26px 14px 56px",
        backgroundColor: dark ? color.paper : color.ink,
        color: dark ? color.ink : color.paper,
        fontFamily: font.mono,
        fontSize: 26,
        letterSpacing: 2,
      }}
    >
      <span style={{ width: 14, height: 14, backgroundColor: color.red, display: "inline-block" }} />
      {label}
    </div>
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
