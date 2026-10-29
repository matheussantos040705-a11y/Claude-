import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Paper, Rays, Stamp, Vignette, Wipe } from "./parts";
import { FilmFX } from "./fx";
import { color, font } from "./theme";
import { Clip, ClipScene, clamp, display, Falling, useShake } from "./VotoEmRisco";
import clips from "./fem-clips.json";
import timeline from "./fem-timeline.json";

// "Feminicídio existe" — Café Nosso. Recortes reais + narração; dados do Anuário 2026 e leis 13.104/2015 e 14.994/2024.
// Os instantes das batidas (fração da cena) são os mesmos usados no mix.py para os sons.

type Seg = { type: "clip" | "narr" | "end"; id: string; from: number; dur: number };

// 1. 1.571 mulheres: contador e uma ponto por vítima.
const F1: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const end = Math.round(dur * 0.55);
  const n = Math.round(interpolate(frame, [0, end], [0, 1571], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const rec = Math.round(dur * 0.72);
  const shake = useShake([end, rec]);
  const cols = 40;
  return (
    <AbsoluteFill style={{ transform: shake, backgroundColor: color.ink }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 1600 }, (_, i) => (
          <circle key={i} cx={60 + (i % cols) * 24.6} cy={760 + Math.floor(i / cols) * 24.6} r={8}
            fill={i < n ? color.red : "#2b231e"} opacity={i < n ? 1 : 0.6} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 60, top: 170, ...display(330, color.paper), textShadow: `10px 10px 0 ${color.red}` }}>
        {n.toLocaleString("pt-BR")}
      </div>
      <div style={{ position: "absolute", left: 66, top: 500, ...display(66, color.paper), width: 950, opacity: interpolate(frame, [8, 18], [0, 1], clamp) }}>
        MULHERES MORTAS POR SEREM MULHERES EM 2025
      </div>
      <Stamp at={rec} rotate={-8} style={{ left: 420, top: 1620 }}>
        <div style={{ ...display(84, color.paper), backgroundColor: color.red, padding: "12px 22px 2px" }}>RECORDE · 4º ANO SEGUIDO</div>
      </Stamp>
      <div style={{ position: "absolute", left: 66, top: 1840, fontFamily: font.mono, fontSize: 22, color: color.paper, opacity: 0.7 }}>
        FONTE: ANUÁRIO BRASILEIRO DE SEGURANÇA PÚBLICA 2026 (FBSP) · 1 PONTO = 1 MULHER
      </div>
    </AbsoluteFill>
  );
};

// 2. Linha do tempo: 1976, Ciudad Juárez, 2015.
const Card: React.FC<{ at: number; top: number; ano: string; quem: string; termo: string; rot: number }> = ({ at, top, ano, quem, termo, rot }) => (
  <Stamp at={at} rotate={rot} style={{ left: 70, top }}>
    <div style={{ display: "flex", alignItems: "stretch", boxShadow: `12px 12px 0 ${color.ink}` }}>
      <div style={{ ...display(150, color.paper), backgroundColor: color.red, padding: "24px 26px 8px" }}>{ano}</div>
      <div style={{ backgroundColor: color.paper, padding: "22px 28px", width: 560 }}>
        <div style={{ fontFamily: font.mono, fontSize: 30, color: color.ink, letterSpacing: 2 }}>{quem}</div>
        <div style={{ fontFamily: font.serif, fontStyle: "italic", fontSize: 76, color: color.ink, marginTop: 6 }}>{termo}</div>
      </div>
    </div>
  </Stamp>
);
const F2: React.FC<{ dur: number }> = ({ dur }) => {
  const b = Math.round(dur * 0.36), c = Math.round(dur * 0.72);
  const shake = useShake([4, b, c]);
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Paper />
      <div style={{ position: "absolute", left: 80, top: 190, ...display(110, color.ink) }}>DE ONDE VEM O NOME</div>
      <Card at={4} top={420} ano="1976" quem="DIANA RUSSELL · BRUXELAS" termo="“femicide”" rot={-3} />
      <Card at={b} top={820} ano="1993+" quem="CIUDAD JUÁREZ · MARCELA LAGARDE" termo="“feminicidio”" rot={2} />
      <Card at={c} top={1220} ano="2015" quem="BRASIL · LEI 13.104" termo="feminicídio" rot={-2} />
    </AbsoluteFill>
  );
};

// 3. "Tem gente querendo apagar esse nome": a palavra é apagada.
const F3: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const erase = interpolate(frame, [6, dur - 10], [0, 100], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <AbsoluteFill style={{ backgroundColor: color.red }}>
      <div style={{ position: "absolute", left: 50, top: 760, ...display(176, color.paper), clipPath: `inset(0 ${erase}% 0 0)` }}>FEMINICÍDIO</div>
      <div style={{ position: "absolute", left: `calc(${100 - erase}% - 40px)`, top: 730, width: 70, height: 240, backgroundColor: color.paper, opacity: erase > 0 && erase < 100 ? 1 : 0, transform: "rotate(-8deg)", borderRadius: 10 }} />
      <div style={{ position: "absolute", left: 70, top: 1100, ...display(80, color.ink), opacity: interpolate(frame, [4, 12], [0, 1], clamp) }}>TEM GENTE QUERENDO APAGAR ESSE NOME</div>
    </AbsoluteFill>
  );
};

// 4. Não é paixão: é violência. E é crime.
const F4: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const f = [0, Math.round(dur * 0.08), Math.round(dur * 0.16)].map((x) => x);
  const p = Math.round(dur * 0.28), v = Math.round(dur * 0.42), l = Math.round(dur * 0.62);
  const shake = useShake([...f.map((x) => x + 9), p, v, l]);
  return (
    <AbsoluteFill style={{ transform: shake, backgroundColor: color.ink }}>
      <Falling at={f[0]} top={180} c={color.paper} size={130}>CIÚME</Falling>
      <Falling at={f[1]} top={330} c={color.paper} size={130}>TRAIÇÃO</Falling>
      <Falling at={f[2]} top={480} c={color.paper} size={130}>FIM DE NAMORO</Falling>
      <Stamp at={p} rotate={-6} style={{ left: 80, top: 690 }}>
        <div style={{ ...display(150, color.paper), position: "relative" }}>
          PAIXÃO
          <div style={{ position: "absolute", left: -10, right: -10, top: "45%", height: 16, backgroundColor: color.red, transform: "rotate(-4deg)" }} />
        </div>
      </Stamp>
      <Stamp at={v} rotate={4} style={{ left: 70, top: 900 }}>
        <div style={{ ...display(104, color.paper), backgroundColor: color.red, padding: "14px 24px 4px" }}>VIOLÊNCIA CONTRA</div>
        <div style={{ ...display(104, color.paper), backgroundColor: color.red, padding: "10px 24px 4px", marginTop: 8, display: "inline-block" }}>A MULHER</div>
      </Stamp>
      <Stamp at={l} rotate={-3} style={{ left: 70, top: 1300 }}>
        <div style={{ backgroundColor: color.paper, padding: "26px 34px", boxShadow: `14px 14px 0 ${color.red}` }}>
          <div style={{ fontFamily: font.mono, fontSize: 30, color: color.ink, letterSpacing: 2 }}>LEI 14.994/2024 · ART. 121-A</div>
          <div style={{ ...display(140, color.red), marginTop: 10 }}>20 A 40 ANOS</div>
        </div>
      </Stamp>
      <div style={{ position: "absolute", left: 70, top: 1760, fontFamily: font.mono, fontSize: 24, color: color.paper, opacity: interpolate(frame, [l, l + 10], [0, 0.8], clamp) }}>
        DESDE 2024, FEMINICÍDIO É CRIME AUTÔNOMO NO CÓDIGO PENAL
      </div>
    </AbsoluteFill>
  );
};

// 5. Fecho: feminicídio existe. Tem nome, lei e pena.
const F5: React.FC<{ dur: number }> = ({ dur }) => {
  const a = Math.round(dur * 0.32), b = Math.round(dur * 0.46), c = Math.round(dur * 0.6);
  const shake = useShake([2, a, b, c]);
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Rays a={color.ink} b={color.redDark} cx={540} cy={900} speed={0.2} count={18} />
      <Stamp at={2} rotate={-6} style={{ left: 60, top: 300 }}>
        <div style={{ ...display(176, color.paper), textShadow: `10px 10px 0 ${color.red}` }}>FEMINICÍDIO</div>
        <div style={{ ...display(230, color.red), textShadow: `10px 10px 0 ${color.paper}` }}>EXISTE.</div>
      </Stamp>
      <Stamp at={a} rotate={-6} style={{ left: 90, top: 860 }}><div style={{ ...display(120, color.ink), backgroundColor: color.yellow, padding: "10px 22px 2px" }}>TEM NOME.</div></Stamp>
      <Stamp at={b} rotate={-6} style={{ left: 180, top: 1030 }}><div style={{ ...display(120, color.ink), backgroundColor: color.yellow, padding: "10px 22px 2px" }}>TEM LEI.</div></Stamp>
      <Stamp at={c} rotate={-6} style={{ left: 270, top: 1200 }}><div style={{ ...display(120, color.paper), backgroundColor: color.red, padding: "10px 22px 2px" }}>TEM PENA.</div></Stamp>
    </AbsoluteFill>
  );
};

// Assinatura final.
const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const fade = interpolate(frame, [70, 88], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: color.ink, opacity: fade, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...display(150, color.ink), backgroundColor: color.paper, padding: "18px 40px 6px", boxShadow: `14px 14px 0 ${color.red}`, transform: `scale(${interpolate(s, [0, 1], [1.5, 1])})`, opacity: s }}>☕ CAFÉ NOSSO</div>
      <div style={{ fontFamily: font.mono, fontSize: 30, letterSpacing: 4, color: color.paper, marginTop: 40, opacity: interpolate(frame, [14, 26], [0, 1], clamp) }}>FONTES NA LEGENDA</div>
      <div style={{ fontFamily: font.mono, fontSize: 26, color: color.paper, marginTop: 70, opacity: interpolate(frame, [20, 32], [0, 0.85], clamp), textAlign: "center", lineHeight: 1.4 }}>
        VIOLÊNCIA CONTRA A MULHER? LIGUE 180
      </div>
    </AbsoluteFill>
  );
};

const NARR: Record<string, React.FC<{ dur: number }>> = { n1: F1, n2: F2, n3: F3, n4: F4, n5: F5 };

export const Feminicidio: React.FC = () => {
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
            {s.type === "end" ? <End /> : s.type === "clip" && clip ? <ClipScene clip={clip} /> : Narr ? <Narr dur={next - from} /> : null}
          </Sequence>
        );
      })}
      {segs.slice(1).map((s, i) => <Wipe key={i} at={Math.round(s.from * fps)} />)}
      <FilmFX />
      <Vignette />
      <Audio src={staticFile("audio/feminicidio.wav")} />
    </AbsoluteFill>
  );
};
