import { loadFont } from "@remotion/fonts";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Paleta da marca: amarelo-lata, roxo profundo, magenta de estúdio.
const C = {
  yellow: "#FFC800",
  purple: "#2A0640",
  deep: "#0B0014",
  magenta: "#E0207F",
  white: "#FFF8EA",
};
const DISPLAY = "Big Shoulders";
const SANS = "Work Sans";
loadFont({ family: DISPLAY, url: staticFile("fonts/BigShoulders-Bold.ttf"), weight: "700" });
loadFont({ family: SANS, url: staticFile("fonts/WorkSans-Bold.ttf"), weight: "700" });

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Tomadas renderizadas no Blender (cena.py) e onde entram na linha do tempo.
const SHOTS = {
  macro: { from: 0, len: 50 },
  splash: { from: 50, len: 90 },
  fruta: { from: 140, len: 80 },
  hero: { from: 220, len: 60 },
};
const END = 450;

// Sequência de PNGs; `hold` congela no último quadro (cartão final).
const Frames: React.FC<{ dir: string; count: number }> = ({ dir, count }) => {
  const f = useCurrentFrame();
  const i = Math.min(count, Math.max(1, f + 1));
  return (
    <Img
      src={staticFile(`${dir}/f_${String(i).padStart(4, "0")}.png`)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

// Raio elétrico: zigue-zague que muda a cada 2 quadros, com brilho.
const Bolt: React.FC<{ x1: number; y1: number; x2: number; y2: number; seed: string; width?: number }> = ({
  x1, y1, x2, y2, seed, width = 5,
}) => {
  const f = Math.floor(useCurrentFrame() / 2);
  const n = 10;
  const nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const t = k / n;
    const j = k === 0 || k === n ? 0 : (random(`${seed}-${f}-${k}`) - 0.5) * 70;
    return `${x1 + (x2 - x1) * t + (nx / len) * j},${y1 + (y2 - y1) * t + (ny / len) * j}`;
  }).join(" ");
  return (
    <polyline points={pts} fill="none" stroke="#FFF6C8" strokeWidth={width} strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 6px ${C.yellow}) drop-shadow(0 0 22px ${C.magenta})` }} />
  );
};

// Flash de luz nos cortes.
const Flash: React.FC<{ at: number; len?: number; peak?: number }> = ({ at, len = 6, peak = 0.8 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + len], [0, peak, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #fff 0%, ${C.yellow} 35%, ${C.magenta} 70%, transparent 100%)`, opacity: o, mixBlendMode: "screen" }} />
  );
};

// Faixa de luz atravessando o quadro.
const Sweep: React.FC<{ from: number; dur: number; strength?: number }> = ({ from, dur, strength = 0.3 }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [from, from + dur], [-120, 120], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(100deg, transparent ${44 + x}%, rgba(255,250,235,${strength}) ${50 + x}%, transparent ${56 + x}%)`,
      mixBlendMode: "screen",
    }} />
  );
};

// Acabamento de câmera: vinheta, grão, aberração cromática leve nas bordas.
const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(5,0,10,0.7) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grao"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 13} /></filter>
          <rect width="100%" height="100%" filter="url(#grao)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// Faíscas: partículas incandescentes saindo de um ponto.
const Sparks: React.FC<{ at: number; x: number; y: number; n?: number; seed: string }> = ({ at, x, y, n = 36, seed }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 40) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const v = 14 + random(`${seed}v${i}`) * 26;
        const t = f;
        const px = x + Math.cos(a) * v * t * 0.9;
        const py = y + Math.sin(a) * v * t * 0.9 + 0.6 * t * t;
        const life = 1 - t / (18 + random(`${seed}l${i}`) * 22);
        if (life <= 0) return null;
        const tail = 5;
        return (
          <line key={i} x1={px} y1={py} x2={px - Math.cos(a) * v * tail * 0.3} y2={py - (Math.sin(a) * v + 1.2 * t) * tail * 0.3}
            stroke={i % 3 ? "#FFE27A" : "#FFFFFF"} strokeWidth={3 * life + 1} strokeLinecap="round" opacity={life}
            style={{ filter: `drop-shadow(0 0 6px ${C.yellow})` }} />
        );
      })}
    </svg>
  );
};

// Título que bate na tela: escala/desfoque com mola, sombra suave.
const Slam: React.FC<{ text: string; at: number; out: number; top: number; size: number; color: string; glow?: boolean }> = ({
  text, at, out, top, size, color, glow,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f > out + 8) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 240, mass: 0.7 } });
  const q = interpolate(f, [out, out + 8], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const scale = interpolate(p, [0, 1], [1.9, 1]) * (1 + q * 0.25);
  return (
    <div style={{
      position: "absolute", top, width: "100%", textAlign: "center", fontFamily: DISPLAY, fontWeight: 700,
      fontSize: size, lineHeight: 0.88, color, letterSpacing: 1,
      transform: `scale(${scale})`, opacity: interpolate(p, [0, 0.2], [0, 1], clamp) * (1 - q),
      filter: `blur(${interpolate(p, [0, 0.6], [14, 0], clamp) + q * 12}px) drop-shadow(0 10px 30px rgba(0,0,0,0.65))${glow ? ` drop-shadow(0 0 30px ${C.yellow})` : ""}`,
    }}>
      {text}
    </div>
  );
};

// Linha de texto revelada por máscara, de baixo para cima.
const Reveal: React.FC<{ text: string; at: number; out: number; top: number; size: number; color: string; left?: number }> = ({
  text, at, out, top, size, color, left = 80,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 20, stiffness: 160 } });
  const q = interpolate(f, [out, out + 6], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", top, left, overflow: "hidden", height: size * 1.0 }}>
      <div style={{
        fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1, color,
        transform: `translateY(${(1 - p) * 100 - q * 100}%)`, textShadow: "0 8px 30px rgba(0,0,0,0.6)",
      }}>{text}</div>
    </div>
  );
};

const shake = (f: number, hits: number[], amp = 16) =>
  hits.reduce((acc, h) => {
    const d = f - h;
    if (d < 0 || d > 9) return acc;
    const k = amp * Math.exp(-d / 2.5);
    return [acc[0] + (random(`sx${h}${d}`) - 0.5) * k, acc[1] + (random(`sy${h}${d}`) - 0.5) * k];
  }, [0, 0]);

// Desfoque de movimento nos cortes (entra e sai rápido).
const cutBlur = (f: number, cuts: number[]) =>
  cuts.reduce((acc, c) => acc + interpolate(Math.abs(f - c), [0, 3], [10, 0], clamp), 0);

// ---------------------------------------------------------------- cenas

const CenaMacro: React.FC = () => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 10], [0, 1], clamp);
  const push = interpolate(f, [0, 50], [1.04, 1.0], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fade, transform: `scale(${push})` }}>
        <Frames dir="macro" count={SHOTS.macro.len} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CenaSplash: React.FC = () => {
  const f = useCurrentFrame();
  const [sx, sy] = shake(f, [0, s(1.35)]);
  const zoom = interpolate(f, [0, 6], [1.12, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px) scale(${zoom})` }}>
        <Frames dir="splash" count={SHOTS.splash.len} />
      </AbsoluteFill>
      <Slam text="UM GOLE." at={4} out={36} top={190} size={210} color={C.white} />
      <Slam text="UMA" at={s(1.35)} out={84} top={130} size={200} color={C.yellow} glow />
      <Slam text="FAÍSCA!" at={s(1.35) + 3} out={84} top={300} size={230} color={C.yellow} glow />
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: interpolate(f, [s(1.35), s(1.35) + 2, s(1.35) + 16], [0, 1, 0], clamp) }}>
        <Bolt x1={140} y1={420} x2={-20} y2={700} seed="s1" />
        <Bolt x1={940} y1={400} x2={1100} y2={640} seed="s2" />
      </svg>
      <Sparks at={s(1.35)} x={540} y={300} seed="sp1" />
      <Flash at={0} len={7} peak={0.75} />
    </AbsoluteFill>
  );
};

const CenaFruta: React.FC = () => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, 80], [1.06, 1.0], clamp);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <Frames dir="fruta" count={SHOTS.fruta.len} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,0,16,0.55) 0%, transparent 30%, transparent 70%, rgba(8,0,16,0.6) 100%)" }} />
      <Reveal text="MARACUJÁ" at={4} out={74} top={150} size={150} color={C.white} />
      <Reveal text="DE VERDADE" at={9} out={74} top={290} size={150} color={C.white} />
      <Reveal text="+ UM CHOQUE" at={50} out={74} top={1500} size={120} color={C.yellow} />
      <Reveal text="DE GENGIBRE" at={55} out={74} top={1615} size={120} color={C.yellow} />
      <Sparks at={53} x={760} y={1560} n={24} seed="sp2" />
    </AbsoluteFill>
  );
};

const CenaHero: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = SHOTS.hero.len; // quadro em que a lata assenta e congela
  const push = interpolate(f, [t0, END - SHOTS.hero.from], [1.0, 1.05], clamp);
  const selo = spring({ frame: f - 107, fps, config: { damping: 9, stiffness: 170 } });
  const tag = spring({ frame: f - s(1.6), fps, config: { damping: 20 } });
  const logoAt = s(12.4) - SHOTS.hero.from;
  const glow = interpolate(f, [logoAt - 2, logoAt + 2, logoAt + 40], [0, 0.55, 0.12], clamp);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
        <Frames dir="hero" count={SHOTS.hero.len} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(255,200,0,${glow}), transparent 42%)`, mixBlendMode: "screen" }} />
      <Sweep from={logoAt - 4} dur={22} strength={0.35} />
      <Sparks at={logoAt} x={540} y={430} n={44} seed="sp3" />
      <div style={{
        position: "absolute", width: "100%", top: 120, textAlign: "center", fontFamily: SANS, fontWeight: 700,
        fontSize: 36, letterSpacing: 12, color: C.white, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`,
        textShadow: "0 4px 18px rgba(0,0,0,0.8)",
      }}>
        MARACUJÁ COM GENGIBRE
      </div>
      <div style={{
        position: "absolute", left: 640, top: 1180, width: 400, height: 400,
        transform: `scale(${selo * 0.85}) rotate(${interpolate(selo, [0, 1], [-50, 12])}deg)`,
      }}>
        <svg width={400} height={400} viewBox="-200 -200 400 400" style={{ position: "absolute" }}>
          <polygon fill={C.yellow} style={{ filter: "drop-shadow(0 16px 36px rgba(0,0,0,0.6))" }}
            points={Array.from({ length: 28 }, (_, k) => {
              const a = (k / 28) * Math.PI * 2, r = k % 2 ? 170 : 194;
              return `${Math.cos(a) * r},${Math.sin(a) * r}`;
            }).join(" ")} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontWeight: 700, color: C.purple, fontSize: 108, lineHeight: 0.86, paddingTop: 8,
        }}>
          <div>ABRE</div>
          <div>UMA.</div>
        </div>
      </div>
      <Flash at={0} len={8} peak={0.7} />
    </AbsoluteFill>
  );
};

export const Faisca: React.FC = () => {
  const f = useCurrentFrame();
  const blur = cutBlur(f, [SHOTS.fruta.from, SHOTS.hero.from]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: blur > 0.1 ? `blur(${blur}px)` : undefined }}>
        <Sequence durationInFrames={SHOTS.macro.len}><CenaMacro /></Sequence>
        <Sequence from={SHOTS.splash.from} durationInFrames={SHOTS.splash.len}><CenaSplash /></Sequence>
        <Sequence from={SHOTS.fruta.from} durationInFrames={SHOTS.fruta.len}><CenaFruta /></Sequence>
        <Sequence from={SHOTS.hero.from} durationInFrames={END - SHOTS.hero.from}><CenaHero /></Sequence>
      </AbsoluteFill>
      <Finish />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
