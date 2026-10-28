import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Paper, Rays, RoughShape, Stamp, Vignette, Wipe } from "./parts";
import { FilmFX, InkBurst } from "./fx";
import { color, font } from "./theme";
import clips from "./vr-clips.json";
import timeline from "./vr-timeline.json";

// "Querem tirar o seu voto" — Café Nosso. Recortes reais (áudio original) intercalados com a narração.
// vr-clips.json vem de cafe-nosso/voto-em-risco/cortar.py; vr-timeline.json de mix.py.

type Clip = { id: string; nome: string; papel: string; fonte: string; carimbo: string; wave: number[]; caps: [string, number][] };
type Seg = { type: "clip" | "narr"; id: string; from: number; dur: number };

const display = (size: number, c: string = color.ink): React.CSSProperties => ({
  fontFamily: font.display, fontWeight: 700, fontSize: size, lineHeight: 0.88, color: c, textTransform: "uppercase", letterSpacing: -1,
});
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Tremor curto quando algo bate na tela (instantes em quadros locais).
const useShake = (hits: number[], amp = 16) => {
  const frame = useCurrentFrame();
  let x = 0, y = 0;
  for (const h of hits) {
    const d = frame - h;
    if (d < 0 || d > 9) continue;
    const a = amp * Math.exp(-d / 2.5);
    x += (random(`x${h}${d}`) - 0.5) * a; y += (random(`y${h}${d}`) - 0.5) * a;
  }
  return `translate(${x}px, ${y}px)`;
};

// Forma de onda ao vivo do áudio original.
const Wave: React.FC<{ wave: number[] }> = ({ wave }) => {
  const frame = useCurrentFrame();
  const bars = 36;
  return (
    <svg width={780} height={110}>
      {Array.from({ length: bars }, (_, i) => {
        const v = wave[Math.max(0, Math.min(wave.length - 1, frame - (bars - 1 - i)))] ?? 0;
        const h = 8 + v * 100;
        return <rect key={i} x={i * 21.5} y={55 - h / 2} width={13} height={h} fill={i === bars - 1 ? color.red : color.ink} opacity={0.35 + 0.65 * (i / bars)} />;
      })}
    </svg>
  );
};

// Recorte: cartão de papel com nome, fala original legendada, forma de onda e fonte.
const ClipScene: React.FC<{ clip: Clip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const stampAt = Math.round(fps * 0.9);
  const shake = useShake([stampAt]);
  const t = frame / fps;
  // frases já ditas ficam no cartão, esmaecidas; a atual entra revelada
  const idx = clip.caps.reduce((acc, [, s], i) => (t >= s - 0.05 ? i : acc), 0);
  const total = clip.caps.reduce((n, [x]) => n + (x.startsWith("—") ? 0 : x.length), 0);
  const size = total > 220 ? 56 : total > 120 ? 70 : 84;
  const blink = Math.floor(frame / 12) % 2 === 0;
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Rays a={color.ink} b="#2a1712" cx={540} cy={960} speed={0.05} count={22} />
      <div style={{ position: "absolute", left: 70, top: 170, display: "flex", alignItems: "center", gap: 16, opacity: blink ? 1 : 0.4 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color.red }} />
        <div style={{ fontFamily: font.mono, fontSize: 30, letterSpacing: 6, color: color.paper }}>ÁUDIO ORIGINAL</div>
      </div>
      <div style={{
        position: "absolute", left: 60, top: 260, width: 960, minHeight: 1300,
        transform: `translateY(${(1 - enter) * 900}px) rotate(${interpolate(enter, [0, 1], [6, -1.5])}deg)`,
        boxShadow: `18px 18px 0 ${color.red}`,
      }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><Paper /></div>
        <div style={{ position: "relative", padding: "50px 56px" }}>
          <div style={{ ...display(104, color.paper), backgroundColor: color.ink, display: "inline-block", padding: "14px 22px 4px" }}>{clip.nome}</div>
          <div style={{ fontFamily: font.mono, fontSize: 30, color: color.ink, marginTop: 18, letterSpacing: 2 }}>{clip.papel.toUpperCase()}</div>
          <div style={{ height: 6, backgroundColor: color.ink, margin: "34px 0 40px" }} />
          <div style={{ minHeight: 640 }}>
            {clip.caps.slice(0, idx + 1).map(([txt, s0], i) => {
              const isNote = txt.startsWith("—");
              if (isNote && i !== idx) return null;
              const reveal = interpolate(t, [s0, s0 + 0.35], [0, 100], { ...clamp, easing: Easing.out(Easing.quad) });
              return (
                <div key={i} style={{
                  fontFamily: isNote ? font.mono : font.serif, fontStyle: isNote ? "normal" : "italic",
                  fontSize: isNote ? 32 : size, lineHeight: 1.08, marginBottom: 14,
                  color: isNote ? "#6b5a48" : color.ink, opacity: i === idx ? 1 : 0.42,
                  clipPath: `inset(0 0 ${100 - reveal}% 0)`,
                }}>
                  {txt}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20 }}><Wave wave={clip.wave} /></div>
          <div style={{ fontFamily: font.mono, fontSize: 24, color: color.ink, marginTop: 24, opacity: 0.85 }}>FONTE: {clip.fonte}</div>
        </div>
      </div>
      <Stamp at={stampAt} rotate={-12} style={{ right: 50, top: 1500 }}>
        <div style={{ ...display(96, color.red), border: `10px solid ${color.red}`, padding: "14px 24px 4px", backgroundColor: "rgba(239,227,200,0.85)" }}>{clip.carimbo}</div>
      </Stamp>
      {clip.id === "pietra1" ? (
        <div style={{ position: "absolute", left: 70, top: 1760, width: 940, fontFamily: font.mono, fontSize: 26, color: color.paper, lineHeight: 1.3, opacity: interpolate(frame, [30, 45], [0, 1], clamp) }}>
          O MP ELEITORAL EMITIU RECOMENDAÇÃO (JUL/2026) SOBRE POSTS DELA PEDINDO O FIM DO VOTO FEMININO.
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 1. 1932 → 2026.
const N1: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const a = Math.round(dur * 0.42);
  const shake = useShake([4, a, a + 18]);
  const fade1932 = interpolate(frame, [a - 6, a], [1, 0.25], clamp);
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Rays a={color.ink} b={color.redDark} cy={900} speed={0.12} />
      <div style={{ opacity: fade1932 }}>
        <Stamp at={4} rotate={-6} style={{ left: 60, top: 260 }}>
          <div style={{ ...display(360, color.paper), textShadow: `12px 12px 0 ${color.red}` }}>1932</div>
        </Stamp>
        <Stamp at={14} rotate={-6} style={{ left: 80, top: 600 }}>
          <div style={{ ...display(90, color.ink), backgroundColor: color.yellow, padding: "10px 20px 2px" }}>ELAS CONQUISTARAM O VOTO</div>
        </Stamp>
      </div>
      <Stamp at={a} rotate={5} style={{ left: 90, top: 900 }}>
        <div style={{ ...display(420, color.red), textShadow: `14px 14px 0 ${color.ink}` }}>2026</div>
      </Stamp>
      <Stamp at={a + 18} rotate={5} style={{ left: 90, top: 1340 }}>
        <div style={{ ...display(96, color.paper), backgroundColor: color.red, padding: "12px 22px 2px" }}>TEM GENTE ACHANDO</div>
        <div style={{ ...display(96, color.paper), backgroundColor: color.red, padding: "8px 22px 2px", marginTop: 8 }}>QUE FOI UM ERRO.</div>
      </Stamp>
    </AbsoluteFill>
  );
};

// Palavra que cai do alto e bate (mesma física do vídeo anterior).
const Falling: React.FC<{ at: number; top: number; c: string; size: number; children: React.ReactNode }> = ({ at, top, c, size, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 140, mass: 0.9 } });
  return (
    <div style={{ position: "absolute", left: 70, top, transform: `translateY(${interpolate(s, [0, 1], [-1500, 0])}px) rotate(${interpolate(s, [0, 1], [-12, 0])}deg)`, ...display(size, c) }}>
      <InkBurst at={at + 9} seed={`fv${at}`} n={20} c={color.paper} />
      {children}
    </div>
  );
};

// 2. "O voto feminino foi uma conquista do feminismo."
const N2: React.FC<{ dur: number }> = ({ dur }) => {
  const b = Math.round(dur * 0.38), c = Math.round(dur * 0.66);
  const shake = useShake([9, b + 9, c + 9]);
  return (
    <AbsoluteFill style={{ backgroundColor: color.red, transform: shake }}>
      <Falling at={0} top={420} c={color.paper} size={190}>O VOTO FEMININO</Falling>
      <Falling at={b} top={760} c={color.ink} size={150}>FOI UMA CONQUISTA</Falling>
      <Falling at={c} top={1000} c={color.paper} size={210}>DO FEMINISMO.</Falling>
    </AbsoluteFill>
  );
};

// 3. Constituição: licença-maternidade é direito.
const N3: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const x = Math.round(dur * 0.12), d = Math.round(dur * 0.5);
  const shake = useShake([x, d]);
  const docIn = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Paper />
      <div style={{ position: "absolute", left: 90, top: 220, width: 900, opacity: docIn, transform: `translateY(${(1 - docIn) * 60}px)` }}>
        <div style={{ fontFamily: font.mono, fontSize: 32, letterSpacing: 4, color: color.ink }}>CONSTITUIÇÃO FEDERAL DE 1988</div>
        <div style={{ ...display(110, color.ink), marginTop: 20 }}>ART. 7º, XVIII</div>
        <div style={{ fontFamily: font.serif, fontStyle: "italic", fontSize: 66, lineHeight: 1.12, color: color.ink, marginTop: 30 }}>
          “licença à gestante, sem prejuízo do emprego e do salário, com a duração de cento e vinte dias”
        </div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <RoughShape kind="path" args="M90 760 C 380 745, 700 770, 990 750" from={6} to={22} width={8} stroke={color.red} seed={4} />
      </svg>
      <Stamp at={x} rotate={-8} style={{ left: 80, top: 1050 }}>
        <div style={{ ...display(130, color.ink), position: "relative" }}>
          NÃO É PRIVILÉGIO
          <div style={{ position: "absolute", left: -10, right: -10, top: "45%", height: 14, backgroundColor: color.red, transform: "rotate(-3deg)" }} />
        </div>
      </Stamp>
      <Stamp at={d} rotate={6} style={{ left: 200, top: 1300 }}>
        <div style={{ ...display(260, color.red), border: `16px solid ${color.red}`, padding: "16px 40px 0" }}>É DIREITO</div>
      </Stamp>
    </AbsoluteFill>
  );
};

// 4. 52%, seu voto é sua voz, assinatura Café Nosso.
const N4: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.round(interpolate(frame, [0, Math.round(dur * 0.3)], [0, 52], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const v1 = Math.round(dur * 0.42), v2 = Math.round(dur * 0.56), v3 = Math.round(dur * 0.68);
  const end = Math.round(dur * 0.86);
  const shake = useShake([v1, v2, v3, end]);
  const card = spring({ frame: frame - end, fps, config: { damping: 18 } });
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Rays a={color.ink} b={color.redDark} cx={540} cy={1000} speed={0.25} count={16} />
      <div style={{ position: "absolute", left: 70, top: 160, ...display(330, color.red), textShadow: `10px 10px 0 ${color.paper}` }}>
        {n}<span style={{ fontSize: 200 }}>%</span>
      </div>
      <div style={{ position: "absolute", left: 80, top: 470, ...display(70, color.paper), opacity: interpolate(frame, [8, 16], [0, 1], clamp) }}>DO ELEITORADO É MULHER</div>
      <Stamp at={v1} rotate={-8} style={{ left: 90, top: 720 }}><div style={{ ...display(200, color.paper) }}>SEU VOTO</div></Stamp>
      <Stamp at={v2} rotate={-8} style={{ left: 220, top: 920 }}><div style={{ ...display(180, color.yellow) }}>É SUA</div></Stamp>
      <Stamp at={v3} rotate={-8} style={{ left: 420, top: 1100 }}><div style={{ ...display(300, color.paper), textShadow: `12px 12px 0 ${color.red}` }}>VOZ</div></Stamp>
      {frame >= end ? (
        <div style={{
          position: "absolute", left: 0, right: 0, top: 1480, display: "flex", flexDirection: "column", alignItems: "center",
          transform: `scale(${interpolate(card, [0, 1], [1.6, 1])})`, opacity: card,
        }}>
          <div style={{ ...display(150, color.ink), backgroundColor: color.paper, padding: "18px 40px 6px", boxShadow: `14px 14px 0 ${color.red}` }}>☕ CAFÉ NOSSO</div>
          <div style={{ fontFamily: font.mono, fontSize: 28, letterSpacing: 4, color: color.paper, marginTop: 30 }}>FONTES NA LEGENDA</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const NARR: Record<string, React.FC<{ dur: number }>> = { n1: N1, n2: N2, n3: N3, n4: N4 };

export const VotoEmRisco: React.FC = () => {
  const { fps } = useVideoConfig();
  const segs = timeline.segments as Seg[];
  return (
    <AbsoluteFill style={{ backgroundColor: color.ink }}>
      {segs.map((s, i) => {
        const from = Math.round(s.from * fps);
        const next = i + 1 < segs.length ? Math.round(segs[i + 1].from * fps) : Math.round(timeline.total * fps);
        const Narr = NARR[s.id];
        const clip = (clips as unknown as Clip[]).find((c) => c.id === s.id);
        return (
          <Sequence key={i} from={from} durationInFrames={next - from}>
            {s.type === "clip" && clip ? <ClipScene clip={clip} /> : Narr ? <Narr dur={next - from} /> : null}
          </Sequence>
        );
      })}
      {segs.slice(1).map((s, i) => <Wipe key={i} at={Math.round(s.from * fps)} />)}
      <FilmFX />
      <Vignette />
      <Audio src={staticFile("audio/voto-em-risco.wav")} />
    </AbsoluteFill>
  );
};
