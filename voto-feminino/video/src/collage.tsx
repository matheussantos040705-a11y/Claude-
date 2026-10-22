import { loadFont } from "@remotion/fonts";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Paleta maximalista retrô: o vermelho construtivista ganha rosa, laranja,
// cobalto e verde-água; o verde e o amarelo do Brasil continuam por perto.
export const pal = {
  cream: "#F3E9D2",
  newsprint: "#E6DFCB",
  kraft: "#C9A472",
  ink: "#1B1612",
  red: "#D7261E",
  pink: "#F49AC1",
  orange: "#F5871F",
  yellow: "#F7C631",
  green: "#1F8A4C",
  teal: "#2BA39A",
  cobalt: "#2C4BD1",
};

export const mfont = {
  retro: "Boldonse",
  fat: "Erica One",
  serif: "Young Serif",
  didone: "Gloock",
  hand: "Nothing You Could Do",
  grotesk: "Bricolage Grotesque",
  condensed: "Big Shoulders",
};

loadFont({ family: mfont.retro, url: staticFile("fonts/Boldonse-Regular.ttf") });
loadFont({ family: mfont.fat, url: staticFile("fonts/EricaOne-Regular.ttf") });
loadFont({ family: mfont.serif, url: staticFile("fonts/YoungSerif-Regular.ttf") });
loadFont({ family: mfont.didone, url: staticFile("fonts/Gloock-Regular.ttf") });
loadFont({ family: mfont.hand, url: staticFile("fonts/NothingYouCouldDo-Regular.ttf") });
loadFont({ family: mfont.grotesk, url: staticFile("fonts/BricolageGrotesque-Bold.ttf"), weight: "700" });

// Aleatório com semente: a mesma colagem em todo quadro e em todo render.
export const rand = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Entrada com mola: o recorte "cai" na mesa e assenta.
export const usePop = (at: number, stiffness = 220) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness, mass: 0.7 } });
  return { s, visible: frame >= at };
};

// Contorno de papel rasgado: cada lado do retângulo recebe um serrilhado.
const tornPath = (w: number, h: number, seed: number, jag = 7) => {
  const r = rand(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(4, Math.round(len / 14));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const d = (r() - 0.5) * jag;
      pts.push(`${(x0 + (x1 - x0) * t + nx * d).toFixed(1)},${(y0 + (y1 - y0) * t + ny * d).toFixed(1)}`);
    }
  };
  edge(0, 0, w, 0, 0, 1);
  edge(w, 0, w, h, -1, 0);
  edge(w, h, 0, h, 0, -1);
  edge(0, h, 0, 0, 1, 0);
  return `M${pts.join(" L")} Z`;
};

export const Torn: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rotate?: number;
  seed?: number;
  at?: number;
  shadow?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, color, rotate = 0, seed = 1, at = -999, shadow = true, children, style }) => {
  const { s, visible } = usePop(at);
  const d = useMemo(() => tornPath(w, h, seed), [w, h, seed]);
  if (!visible) return null;
  const scale = at < 0 ? 1 : interpolate(s, [0, 1], [1.25, 1]);
  const rot = at < 0 ? rotate : interpolate(s, [0, 1], [rotate - 8, rotate]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `rotate(${rot}deg) scale(${scale})`,
        filter: shadow ? "drop-shadow(6px 9px 0 rgba(27,22,18,0.28))" : undefined,
        ...style,
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, clipPath: `path('${d}')`, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};

// Fita adesiva meio transparente, com as pontas picotadas.
export const Tape: React.FC<{ x: number; y: number; w?: number; rotate?: number; at?: number; color?: string }> = ({
  x,
  y,
  w = 170,
  rotate = -12,
  at = -999,
  color = "rgba(243,233,210,0.72)",
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const h = 46;
  const d = `M0 0 L${w} 0 L${w - 7} ${h / 4} L${w} ${h / 2} L${w - 7} ${(3 * h) / 4} L${w} ${h} L0 ${h} L7 ${(3 * h) / 4} L0 ${h / 2} L7 ${h / 4} Z`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: x, top: y, transform: `rotate(${rotate}deg)`, overflow: "visible" }}>
      <path d={d} fill={color} />
    </svg>
  );
};

// Letras recortadas de revista: cada uma com papel, fonte, cor e giro próprios.
const ransomFonts = [mfont.retro, mfont.fat, mfont.serif, mfont.didone, mfont.condensed, mfont.grotesk];
const ransomPapers = [pal.cream, pal.yellow, pal.pink, pal.cobalt, pal.ink, pal.green, pal.orange, pal.newsprint, pal.red, pal.teal];
const onPaper = (bg: string) => ([pal.ink, pal.cobalt, pal.green, pal.red, pal.teal].includes(bg) ? pal.cream : pal.ink);

export const Ransom: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  at: number;
  seed?: number;
  stagger?: number;
  maxWidth?: number;
}> = ({ text, x, y, size, at, seed = 3, stagger = 2, maxWidth = 980 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = useMemo(() => rand(seed), [seed]);
  const letters = useMemo(
    () =>
      text.split("").map((ch) => ({
        ch,
        font: ransomFonts[Math.floor(r() * ransomFonts.length)],
        bg: ransomPapers[Math.floor(r() * ransomPapers.length)],
        rot: (r() - 0.5) * 14,
        dy: (r() - 0.5) * size * 0.12,
        scale: 0.85 + r() * 0.3,
        seed: Math.floor(r() * 1000),
      })),
    [text, r, size],
  );
  // Agrupa as letras por palavra para a quebra de linha nunca cortar uma palavra.
  const words: { l: (typeof letters)[number]; i: number }[][] = [[]];
  letters.forEach((l, i) => (l.ch === " " ? words.push([]) : words[words.length - 1].push({ l, i })));
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: size * 0.32, rowGap: size * 0.12, width: maxWidth }}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: "inline-flex", flexWrap: "nowrap", alignItems: "center", gap: size * 0.06 }}>
          {word.map(({ l, i }) => {
            const t = frame - at - i * stagger;
            if (t < 0) return <span key={i} style={{ width: size * 0.6, height: size }} />;
            const s = spring({ frame: t, fps, config: { damping: 11, stiffness: 260, mass: 0.5 } });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: `${size * 0.06}px ${size * 0.1}px ${size * 0.02}px`,
                  backgroundColor: l.bg,
                  color: onPaper(l.bg),
                  fontFamily: l.font,
                  fontSize: size * l.scale,
                  lineHeight: 1,
                  transform: `translateY(${l.dy}px) rotate(${l.rot}deg) scale(${interpolate(s, [0, 1], [1.8, 1])})`,
                  boxShadow: "4px 5px 0 rgba(27,22,18,0.3)",
                  textTransform: "uppercase",
                }}
              >
                {l.ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

// Selo estourado (starburst) com texto no meio, girando de leve.
export const Burst: React.FC<{
  x: number;
  y: number;
  r: number;
  color: string;
  text?: string;
  textColor?: string;
  points?: number;
  at?: number;
  font?: string;
  fontSize?: number;
  spin?: number;
}> = ({ x, y, r, color, text, textColor = pal.ink, points = 18, at = -999, font = mfont.retro, fontSize, spin = 0.4 }) => {
  const frame = useCurrentFrame();
  const { s, visible } = usePop(at, 200);
  if (!visible) return null;
  const pts = Array.from({ length: points * 2 }, (_, i) => {
    const a = (i / (points * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * 0.78 : r;
    return `${r + rr * Math.cos(a)},${r + rr * Math.sin(a)}`;
  }).join(" ");
  const sc = at < 0 ? 1 : interpolate(s, [0, 1], [0, 1]);
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, transform: `scale(${sc})` }}>
      <svg width={r * 2} height={r * 2} style={{ position: "absolute", transform: `rotate(${frame * spin}deg)`, filter: "drop-shadow(5px 7px 0 rgba(27,22,18,0.3))" }}>
        <polygon points={pts} fill={color} />
      </svg>
      {text ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: font,
            fontSize: fontSize ?? r * 0.42,
            lineHeight: 1.12,
            color: textColor,
            transform: "rotate(-10deg)",
            whiteSpace: "pre",
          }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
};

export const Star: React.FC<{ x: number; y: number; r: number; color: string; spin?: number; at?: number }> = ({
  x,
  y,
  r,
  color,
  spin = 1,
  at = -999,
}) => {
  const frame = useCurrentFrame();
  const { s, visible } = usePop(at, 240);
  if (!visible) return null;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    return `${r + rr * Math.cos(a)},${r + rr * Math.sin(a)}`;
  }).join(" ");
  return (
    <svg
      width={r * 2}
      height={r * 2}
      style={{ position: "absolute", left: x - r, top: y - r, transform: `rotate(${frame * spin}deg) scale(${at < 0 ? 1 : s})` }}
    >
      <polygon points={pts} fill={color} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
};

// Rabisco ondulado vetorial, desenhando-se.
export const Squiggle: React.FC<{ x: number; y: number; w: number; color: string; at: number; amp?: number; stroke?: number }> = ({
  x,
  y,
  w,
  color,
  at,
  amp = 14,
  stroke = 9,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const n = Math.round(w / 40);
  const d = `M0 ${amp} ` + Array.from({ length: n }, (_, i) => `Q ${i * 40 + 20} ${i % 2 ? amp * 2 : 0}, ${(i + 1) * 40} ${amp}`).join(" ");
  return (
    <svg width={w} height={amp * 2 + stroke} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

// Anotação à mão, que se escreve da esquerda para a direita.
export const Hand: React.FC<{ text: string; x: number; y: number; size: number; color: string; at: number; rotate?: number }> = ({
  text,
  x,
  y,
  size,
  color,
  at,
  rotate = -6,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 18], [0, 100], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: mfont.hand,
        fontSize: size,
        color,
        transform: `rotate(${rotate}deg)`,
        clipPath: `inset(-20% ${100 - p}% -20% -5%)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Fundos e padrões retrô.
export const Checker: React.FC<{ top: number; height: number; size?: number; a?: string; b?: string; shift?: number }> = ({
  top,
  height,
  size = 60,
  a = pal.ink,
  b = pal.cream,
  shift = 0.6,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        background: `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) ${-frame * shift}px 0 / ${size * 2}px ${size * 2}px`,
      }}
    />
  );
};

export const Dots: React.FC<{ color: string; bg: string; size?: number; dot?: number }> = ({ color, bg, size = 34, dot = 6 }) => (
  <AbsoluteFill style={{ backgroundColor: bg, backgroundImage: `radial-gradient(${color} ${dot}px, transparent ${dot + 1}px)`, backgroundSize: `${size}px ${size}px` }} />
);

export const SunsetBands: React.FC<{ colors: string[]; top?: number }> = ({ colors, top = 0 }) => (
  <AbsoluteFill style={{ top }}>
    {colors.map((c, i) => (
      <div key={i} style={{ height: `${100 / colors.length}%`, backgroundColor: c }} />
    ))}
  </AbsoluteFill>
);

// Recorte de jornal: colunas de "texto" desenhadas como linhas cinzas.
export const Newsprint: React.FC<{ x: number; y: number; w: number; h: number; rotate?: number; seed?: number; at?: number; headline?: string }> = ({
  x,
  y,
  w,
  h,
  rotate = 0,
  seed = 5,
  at = -999,
  headline,
}) => (
  <Torn x={x} y={y} w={w} h={h} color={pal.newsprint} rotate={rotate} seed={seed} at={at}>
    {headline ? (
      <div style={{ position: "absolute", left: 22, right: 22, top: 18, fontFamily: mfont.didone, fontSize: 46, lineHeight: 1, color: pal.ink, borderBottom: `3px solid ${pal.ink}`, paddingBottom: 10 }}>
        {headline}
      </div>
    ) : null}
    <div
      style={{
        position: "absolute",
        left: 22,
        right: 22,
        top: headline ? 92 : 22,
        bottom: 18,
        backgroundImage: `repeating-linear-gradient(to bottom, rgba(27,22,18,0.38) 0 5px, transparent 5px 15px)`,
        WebkitMaskImage: `repeating-linear-gradient(to right, #000 0 ${(w - 64) / 3}px, transparent ${(w - 64) / 3}px ${(w - 64) / 3 + 10}px)`,
        maskImage: `repeating-linear-gradient(to right, #000 0 ${(w - 64) / 3}px, transparent ${(w - 64) / 3}px ${(w - 64) / 3 + 10}px)`,
      }}
    />
  </Torn>
);

// Confete caindo, em várias cores e formatos.
export const Confetti: React.FC<{ count?: number; seed?: number; from?: number }> = ({ count = 70, seed = 9, from = 0 }) => {
  const frame = useCurrentFrame();
  const items = useMemo(() => {
    const r = rand(seed);
    const cs = [pal.red, pal.pink, pal.yellow, pal.cobalt, pal.green, pal.orange, pal.teal];
    return Array.from({ length: count }, () => ({
      x: r() * 1080,
      y0: -100 - r() * 1600,
      v: 4 + r() * 6,
      sway: 20 + r() * 40,
      ph: r() * 6.28,
      c: cs[Math.floor(r() * cs.length)],
      w: 14 + r() * 18,
      round: r() > 0.6,
      rot: r() * 360,
    }));
  }, [count, seed]);
  const t = Math.max(0, frame - from);
  if (frame < from) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: it.x + Math.sin(t / 12 + it.ph) * it.sway,
            top: it.y0 + t * it.v,
            width: it.w,
            height: it.round ? it.w : it.w * 0.45,
            borderRadius: it.round ? "50%" : 2,
            backgroundColor: it.c,
            transform: `rotate(${it.rot + t * 6}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Grão de risografia por cima de tudo: pontilhado leve que treme.
export const RisoGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 5;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.22 }}>
      <svg width="100%" height="100%">
        <filter id={`riso${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 1.4 -0.35" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#riso${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// Transição: uma folha de papel rasgado colorida varre a tela.
export const TornWipe: React.FC<{ at: number; color: string; seed?: number }> = ({ at, color, seed = 4 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const d = useMemo(() => tornPath(1400, 2400, seed, 40), [seed]);
  if (t < -9 || t > 9) return null;
  const y = interpolate(t, [-9, 9], [2100, -2500], { easing: Easing.inOut(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: -160, top: y, width: 1400, height: 2400, transform: "rotate(-8deg)", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, clipPath: `path('${d}')` }} />
    </div>
  );
};
