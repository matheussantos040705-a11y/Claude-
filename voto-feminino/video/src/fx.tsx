import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import cue from "./cues.json";
import { color, scene } from "./theme";

// Instantes de impacto (s): carimbos, palavras caindo, cédula na urna, "VOZ".
// Os mesmos instantes recebem som de batida no sfx.py.
const FALL_LAND = 0.3; // a palavra que cai leva ~0,3 s até bater no chão
export const IMPACTS: [number, number][] = [
  [cue.date24, 1], [cue.dateFev, 0.6], [cue.date1932, 1.2],
  [cue.ballotLand, 0.8], [cue.lawVoto, 0.8], [cue.lawLei, 1],
  [cue.skyNao + FALL_LAND, 1], [cue.skyCaiu + FALL_LAND, 1], [cue.skyCeu + FALL_LAND, 1.3],
  [cue.berthaName, 0.8], [cue.berthaMilhares, 0.7], [cue.berthaMulheres, 0.5], [cue.berthaAteLei, 0.7],
  [cue.voiceUse, 0.9], [cue.voiceSeuVoto, 0.8], [cue.voiceESua, 0.7], [cue.voiceVoz, 1.6],
  [scene.poster, 1.2],
];

// Tremor de câmera curto a cada impacto, amortecido.
export const useShake = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let x = 0, y = 0, r = 0;
  for (const [t, k] of IMPACTS) {
    const d = frame - Math.round(t * fps);
    if (d < 0 || d > 10) continue;
    const a = 18 * k * Math.exp(-d / 2.6);
    x += (random(`x${t}${d}`) - 0.5) * a;
    y += (random(`y${t}${d}`) - 0.5) * a;
    r += (random(`r${t}${d}`) - 0.5) * a * 0.03;
  }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

// Respingos de tinta saindo do centro de um carimbo quando ele bate.
export const InkBurst: React.FC<{ at: number; seed: string; n?: number; c?: string }> = ({ at, seed, n = 16, c = color.ink }) => {
  const t = useCurrentFrame() - at;
  if (t < 0 || t > 16) return null;
  const p = interpolate(t, [0, 16], [0, 1]);
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const dist = (120 + random(`${seed}d${i}`) * 260) * (1 - Math.pow(1 - p, 3));
        const sz = 6 + random(`${seed}s${i}`) * 16;
        return (
          <div key={i} style={{
            position: "absolute", left: Math.cos(a) * dist, top: Math.sin(a) * dist * 0.7,
            width: sz, height: sz * (0.6 + random(`${seed}h${i}`) * 0.6), borderRadius: "50%",
            backgroundColor: c, opacity: 1 - p, transform: `rotate(${a}rad)`,
          }} />
        );
      })}
    </div>
  );
};

// Película antiga: poeira, fios, riscos verticais, oscilação da janela e cintilação.
export const FilmFX: React.FC = () => {
  const frame = useCurrentFrame();
  const f = Math.floor(frame / 2);
  const specks = Array.from({ length: 10 }, (_, i) => ({
    x: random(`dx${f}${i}`) * 1080, y: random(`dy${f}${i}`) * 1920,
    r: 1.5 + random(`dr${f}${i}`) * 4, show: random(`ds${f}${i}`) > 0.45,
  }));
  const hair = random(`h${Math.floor(frame / 5)}`) > 0.82;
  const scratch = random(`s${Math.floor(frame / 9)}`) > 0.55;
  const sx = random(`sx${Math.floor(frame / 9)}`) * 1080;
  const flick = 0.035 * (random(`fl${frame}`) - 0.5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.55 }}>
        {specks.filter((s) => s.show).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#1a120c" />)}
        {hair ? (
          <path d={`M${random(`hx${f}`) * 1000} ${random(`hy${f}`) * 1800} q 30 -40 70 -10 t 60 20`} stroke="#1a120c" strokeWidth={2} fill="none" />
        ) : null}
        {scratch ? <line x1={sx} y1={0} x2={sx + 6} y2={1920} stroke="#fff6e0" strokeWidth={1.6} opacity={0.5} /> : null}
      </svg>
      <AbsoluteFill style={{ backgroundColor: flick > 0 ? "#fff3d6" : "#140c06", opacity: Math.abs(flick) }} />
    </AbsoluteFill>
  );
};

// Oscilação da janela do projetor (aplicada ao quadro inteiro).
export const useGateWeave = () => {
  const frame = useCurrentFrame();
  const x = Math.sin(frame * 0.9) * 0.8 + (random(`gw${frame}`) - 0.5) * 0.8;
  const y = Math.sin(frame * 0.37) * 1.2;
  return `translate(${x}px, ${y}px)`;
};

// Ondas sonoras saindo do megafone.
export const SoundRings: React.FC<{ cx: number; cy: number; angle: number; from: number }> = ({ cx, cy, angle, from }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", pointerEvents: "none" }}>
      <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
        {Array.from({ length: 5 }, (_, i) => {
          const p = ((frame - from) / 30 + i / 5) % 1;
          const r = 300 + p * 700;
          return (
            <path key={i} d={`M ${r * Math.cos(-0.5)} ${r * Math.sin(-0.5)} A ${r} ${r} 0 0 1 ${r * Math.cos(0.5)} ${r * Math.sin(0.5)}`}
              stroke={color.yellow} strokeWidth={14 * (1 - p) + 2} fill="none" opacity={(1 - p) * 0.9} strokeLinecap="round" />
          );
        })}
      </g>
    </svg>
  );
};

// Brilho de projeção que varre o pôster no final.
export const LightSweep: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [from, from + dur], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < from || frame > from + dur) return null;
  return (
    <AbsoluteFill style={{
      pointerEvents: "none", mixBlendMode: "screen",
      background: `linear-gradient(110deg, transparent ${x - 12}%, rgba(255,240,200,0.45) ${x}%, transparent ${x + 12}%)`,
    }} />
  );
};
