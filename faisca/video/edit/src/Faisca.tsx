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
  deep: "#12001E",
  magenta: "#C2187A",
  white: "#FFF8E6",
};
const DISPLAY = "Big Shoulders";
const SANS = "Work Sans";
loadFont({ family: DISPLAY, url: staticFile("fonts/BigShoulders-Bold.ttf"), weight: "700" });
loadFont({ family: SANS, url: staticFile("fonts/WorkSans-Bold.ttf"), weight: "700" });

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Sequência de PNGs renderizada no Blender (f_0001.png ...).
const Frames: React.FC<{ dir: string; count: number; speed?: number }> = ({ dir, count, speed = 1 }) => {
  const f = useCurrentFrame();
  const i = Math.min(count, Math.floor(f * speed) + 1);
  return (
    <Img
      src={staticFile(`${dir}/f_${String(i).padStart(4, "0")}.png`)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

// Raio elétrico: caminho em zigue-zague que muda a cada 2 quadros.
const Bolt: React.FC<{
  x1: number; y1: number; x2: number; y2: number; seed: string; width?: number; color?: string;
}> = ({ x1, y1, x2, y2, seed, width = 6, color = C.yellow }) => {
  const f = Math.floor(useCurrentFrame() / 2);
  const n = 9;
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const t = k / n;
    const j = k === 0 || k === n ? 0 : (random(`${seed}-${f}-${k}`) - 0.5) * 90;
    const nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
    return `${x1 + (x2 - x1) * t + (nx / len) * j},${y1 + (y2 - y1) * t + (ny / len) * j}`;
  }).join(" ");
  return (
    <polyline
      points={pts}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 28px ${C.magenta})` }}
    />
  );
};

// Flash branco-amarelado curto para cortes e faíscas.
const Flash: React.FC<{ at: number; len?: number; peak?: number }> = ({ at, len = 6, peak = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + len], [0, peak, 0], clamp);
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #fff, ${C.yellow} 45%, transparent 80%)`, opacity: o, mixBlendMode: "screen" }} />;
};

// Faixa de luz que atravessa o quadro na diagonal.
const Sweep: React.FC<{ from: number; dur: number; strength?: number }> = ({ from, dur, strength = 0.35 }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [from, from + dur], [-140, 140], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(105deg, transparent ${45 + x}%, rgba(255,255,255,${strength}) ${50 + x}%, transparent ${55 + x}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

// Grão de filme e vinheta: deixam o 3D com cara de câmera.
const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(8,0,14,0.75) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grao">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 11} />
          </filter>
          <rect width="100%" height="100%" filter="url(#grao)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// Bolhas subindo (gás do refrigerante).
const Bubbles: React.FC<{ n?: number; seed?: string }> = ({ n = 40, seed = "b" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: n }, (_, i) => {
        const r = 6 + random(`${seed}r${i}`) * 26;
        const speed = 4 + random(`${seed}v${i}`) * 9;
        const x = random(`${seed}x${i}`) * 1080 + Math.sin((f + i * 13) / 14) * 12;
        const y = ((random(`${seed}y${i}`) * 2200 - f * speed) % 2200 + 2200) % 2200 - 140;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: "50%",
              border: `${Math.max(1.5, r / 9)}px solid rgba(255,240,200,0.55)`,
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), rgba(255,200,0,0.08) 40%, transparent 70%)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Palavra que "bate" na tela: escala grande -> 1 com mola, tremendo a câmera.
const Slam: React.FC<{ text: string; at: number; top: number; size: number; color: string }> = ({ text, at, top, size, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 220, mass: 0.8 } });
  if (f < at) return null;
  const scale = interpolate(p, [0, 1], [2.6, 1]);
  const blur = interpolate(p, [0, 0.7], [18, 0], clamp);
  return (
    <div
      style={{
        position: "absolute", top, width: "100%", textAlign: "center",
        fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 0.86, color,
        letterSpacing: -2, transform: `scale(${scale})`, opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
        filter: `blur(${blur}px) drop-shadow(0 12px 40px rgba(0,0,0,0.6))`,
      }}
    >
      {text}
    </div>
  );
};

const shake = (f: number, hits: number[], amp = 22) =>
  hits.reduce((acc, h) => {
    const d = f - h;
    if (d < 0 || d > 10) return acc;
    const k = amp * Math.exp(-d / 3);
    return [acc[0] + (random(`sx${h}${d}`) - 0.5) * k, acc[1] + (random(`sy${h}${d}`) - 0.5) * k];
  }, [0, 0]);

// ---------------------------------------------------------------- cenas

// 0-2 s: escuro, lata abrindo, close nas gotas da tampa.
const CenaAbre: React.FC = () => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [4, 16], [0, 1], clamp);
  const zoom = interpolate(f, [0, 60], [1.12, 1.0], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fade, transform: `scale(${zoom})` }}>
        <Frames dir="shotA" count={60} />
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: interpolate(f, [24, 26, 34], [0, 1, 0], clamp) }}>
        <Bolt x1={540} y1={700} x2={180} y2={330} seed="a1" width={5} />
        <Bolt x1={540} y1={700} x2={930} y2={420} seed="a2" width={4} />
      </svg>
      <Flash at={26} len={7} peak={0.55} />
    </AbsoluteFill>
  );
};

// 2-5 s: lata girando no estúdio, gelo caindo em câmera lenta.
const CenaGiro: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 90], [1.0, 1.04], clamp);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Frames dir="shotB" count={90} />
      </AbsoluteFill>
      <Sweep from={20} dur={40} strength={0.28} />
      <Flash at={0} len={8} peak={0.7} />
    </AbsoluteFill>
  );
};

// 5-8 s: "UM GOLE." / "UMA FAÍSCA." batendo na tela com raios.
const CenaTipo: React.FC = () => {
  const f = useCurrentFrame();
  const hit2 = s(1.4);
  const [sx, sy] = shake(f, [0, hit2]);
  const charge = interpolate(f, [hit2, hit2 + 4, hit2 + 50], [0, 1, 0.35], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 48%, #4A0B5E 0%, ${C.purple} 45%, ${C.deep} 100%)` }}>
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        <Slam text="UM GOLE." at={0} top={560} size={250} color={C.white} />
        <Slam text="UMA" at={hit2} top={830} size={250} color={C.yellow} />
        <Slam text="FAÍSCA." at={hit2 + 3} top={1090} size={330} color={C.yellow} />
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: f >= hit2 ? charge : 0 }}>
          <Bolt x1={-20} y1={980} x2={170} y2={1200} seed="t1" />
          <Bolt x1={1100} y1={900} x2={900} y2={1180} seed="t2" />
          <Bolt x1={540} y1={1400} x2={420} y2={1720} seed="t3" width={4} />
          <Bolt x1={600} y1={1400} x2={800} y2={1700} seed="t4" width={3} />
        </svg>
      </AbsoluteFill>
      <Flash at={hit2} len={5} peak={0.6} />
    </AbsoluteFill>
  );
};

// 8-11 s: maracujá e gengibre entre bolhas.
const CenaSabor: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inM = spring({ frame: f, fps, config: { damping: 16 } });
  const inG = spring({ frame: f - 22, fps, config: { damping: 12 } });
  const t1 = spring({ frame: f - 6, fps, config: { damping: 18 } });
  const t2 = spring({ frame: f - 34, fps, config: { damping: 14, stiffness: 200 } });
  const drift = f * 0.25;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 40% 55%, #5B1270, ${C.purple} 55%, ${C.deep})` }}>
      <Bubbles n={34} seed="s" />
      <Img
        src={staticFile("img/maracuja.png")}
        style={{
          position: "absolute", width: 900, left: 90 - drift, top: 820,
          transform: `scale(${interpolate(inM, [0, 1], [0.6, 1])}) rotate(${-8 + f * 0.08}deg)`,
          opacity: inM, filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
        }}
      />
      <Img
        src={staticFile("img/gengibre.png")}
        style={{
          position: "absolute", width: 360, left: 640 + drift * 0.6, top: 600,
          transform: `scale(${interpolate(inG, [0, 1], [0.2, 1])}) rotate(${12 - f * 0.15}deg)`,
          opacity: inG, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
        }}
      />
      <div style={{ position: "absolute", left: 80, top: 250, fontFamily: DISPLAY, fontWeight: 700, color: C.white, lineHeight: 0.9 }}>
        <div style={{ fontSize: 132, opacity: t1, transform: `translateY(${(1 - t1) * 60}px)` }}>MARACUJÁ</div>
        <div style={{ fontSize: 132, opacity: t1, transform: `translateY(${(1 - t1) * 80}px)` }}>DE VERDADE</div>
        <div style={{ fontSize: 96, color: C.yellow, marginTop: 24, opacity: t2, transform: `translateX(${(1 - t2) * -120}px)` }}>
          + UM CHOQUE
        </div>
        <div style={{ fontSize: 96, color: C.yellow, opacity: t2, transform: `translateX(${(1 - t2) * -160}px)` }}>DE GENGIBRE ⚡</div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: interpolate(f, [34, 38, 52], [0, 1, 0], clamp) }}>
        <Bolt x1={820} y1={760} x2={1000} y2={520} seed="g1" width={4} />
        <Bolt x1={700} y1={780} x2={560} y2={600} seed="g2" width={3} />
      </svg>
    </AbsoluteFill>
  );
};

// 11-15 s: packshot com empurrão de câmera, selo "ABRE UMA." e assinatura.
const CenaFinal: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = interpolate(f, [0, 120], [1.12, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const selo = spring({ frame: f - s(1.0), fps, config: { damping: 9, stiffness: 180 } });
  const tag = spring({ frame: f - s(2.0), fps, config: { damping: 20 } });
  const glow = interpolate(f, [s(2.0), s(2.1), s(3.2)], [0, 0.6, 0.15], clamp);
  return (
    <AbsoluteFill style={{ background: C.deep }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 40%" }}>
        <Img src={staticFile("img/packshot.png")} style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, rgba(255,200,0,${glow}), transparent 45%)`, mixBlendMode: "screen" }} />
      <Sweep from={s(2.0)} dur={22} strength={0.4} />
      <div
        style={{
          position: "absolute", left: 540 - 230, top: 1340, width: 460, height: 460,
          transform: `scale(${selo}) rotate(${interpolate(selo, [0, 1], [-40, -8])}deg)`,
        }}
      >
        <svg width={460} height={460} viewBox="-230 -230 460 460" style={{ position: "absolute" }}>
          <polygon
            fill={C.yellow}
            points={Array.from({ length: 28 }, (_, k) => {
              const a = (k / 28) * Math.PI * 2, r = k % 2 ? 196 : 222;
              return `${Math.cos(a) * r},${Math.sin(a) * r}`;
            }).join(" ")}
            style={{ filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.5))" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, color: C.purple, fontSize: 124, lineHeight: 0.85, paddingTop: 10 }}>
          <div>ABRE</div>
          <div>UMA.</div>
        </div>
      </div>
      <div
        style={{
          position: "absolute", width: "100%", top: 150, textAlign: "center", fontFamily: SANS, fontWeight: 700,
          fontSize: 38, letterSpacing: 10, color: C.white, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)`,
        }}
      >
        MARACUJÁ COM GENGIBRE
      </div>
      <Flash at={0} len={10} peak={0.85} />
    </AbsoluteFill>
  );
};

export const Faisca: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={s(2)}><CenaAbre /></Sequence>
      <Sequence from={s(2)} durationInFrames={s(3)}><CenaGiro /></Sequence>
      <Sequence from={s(5)} durationInFrames={s(3)}><CenaTipo /></Sequence>
      <Sequence from={s(8)} durationInFrames={s(3)}><CenaSabor /></Sequence>
      <Sequence from={s(11)} durationInFrames={s(4)}><CenaFinal /></Sequence>
      <Finish />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
