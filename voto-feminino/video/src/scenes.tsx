import React from "react";
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
import { Paper, Rays, RoughShape, SkillChip, Stamp } from "./parts";
import { color, font, scene } from "./theme";

// Converte um instante absoluto da narração em quadro relativo à cena.
const useAt = (sceneStart: number) => {
  const { fps } = useVideoConfig();
  return (abs: number) => Math.round((abs - sceneStart) * fps);
};

const display = (size: number, c: string = color.ink): React.CSSProperties => ({
  fontFamily: font.display,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 0.86,
  color: c,
  textTransform: "uppercase",
  letterSpacing: -2,
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 1. A data.
export const SceneDate: React.FC = () => {
  const at = useAt(scene.date);
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 150], [0, -40]);
  return (
    <AbsoluteFill>
      <Rays a={color.ink} b={color.redDark} cy={820} speed={0.12} />
      <AbsoluteFill style={{ transform: `translateY(${drift}px)` }}>
        <Stamp at={at(0.8)} rotate={-6} style={{ left: 90, top: 330 }}>
          <div style={{ ...display(300, color.paper) }}>24</div>
        </Stamp>
        <Stamp at={at(1.76)} rotate={-6} style={{ left: 470, top: 410 }}>
          <div style={{ ...display(170, color.ink), backgroundColor: color.yellow, padding: "6px 22px 0" }}>FEV</div>
        </Stamp>
        <Stamp at={at(2.44)} rotate={-6} style={{ left: 40, top: 690 }}>
          <div style={{ ...display(400, color.red), textShadow: `14px 14px 0 ${color.ink}` }}>1932</div>
        </Stamp>
      </AbsoluteFill>
      <SkillChip label="MOTION DESIGN · REMOTION" />
    </AbsoluteFill>
  );
};

// 2. A lei: urna desenhada à mão e a cédula caindo.
export const SceneLaw: React.FC = () => {
  const at = useAt(scene.law);
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [at(5.8), at(6.3)], [-260, 120], { ...clamp, easing: Easing.in(Easing.quad) });
  const ballotVisible = frame < at(6.3) + 1;
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <RoughShape kind="rect" args={[300, 760, 480, 400]} from={0} to={22} width={7} />
        <RoughShape kind="rect" args={[300, 760, 480, 400]} from={8} to={34} fill={color.red} width={2} stroke={color.red} seed={9} />
        <RoughShape kind="line" args={[440, 760, 640, 760]} from={18} to={28} width={14} />
        <RoughShape kind="path" args="M300 760 L380 690 L860 690 L780 760" from={10} to={30} width={6} seed={5} />
        {ballotVisible ? (
          <g transform={`translate(0 ${drop})`}>
            <rect x={480} y={520} width={130} height={170} fill={color.paper} stroke={color.ink} strokeWidth={5} transform="rotate(-6 545 605)" />
            <path d="M510 600 L540 635 L585 560" stroke={color.ink} strokeWidth={9} fill="none" transform="rotate(-6 545 605)" />
          </g>
        ) : null}
      </svg>
      <Stamp at={at(6.08)} rotate={-8} style={{ left: 60, top: 300 }}>
        <div style={{ ...display(150, color.paper), backgroundColor: color.ink, padding: "14px 26px 4px" }}>VOTO FEMININO</div>
      </Stamp>
      <Stamp at={at(6.86)} rotate={6} style={{ left: 600, top: 1170 }}>
        <div style={{ ...display(170, color.red), border: `10px solid ${color.red}`, padding: "10px 24px 0" }}>É LEI</div>
      </Stamp>
      <SkillChip label="TRAÇO À MÃO · ROUGH.JS" />
    </AbsoluteFill>
  );
};

// 3. "Não caiu do céu": as palavras caem e quicam.
const Falling: React.FC<{ at: number; x: number; y: number; children: React.ReactNode; c?: string; size?: number }> = ({
  at,
  x,
  y,
  children,
  c = color.paper,
  size = 260,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 140, mass: 0.9 } });
  const ty = interpolate(s, [0, 1], [-1400, 0]);
  const rot = interpolate(s, [0, 1], [-14, 0]);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateY(${ty}px) rotate(${rot}deg)`, ...display(size, c) }}>
      {children}
    </div>
  );
};

export const SceneSky: React.FC = () => {
  const at = useAt(scene.sky);
  return (
    <AbsoluteFill style={{ backgroundColor: color.red }}>
      <div style={{ position: "absolute", left: 80, top: 330, ...display(70, color.ink), letterSpacing: 4 }}>MAS ESSA CONQUISTA</div>
      <Falling at={at(9.06)} x={80} y={450}>NÃO</Falling>
      <Falling at={at(9.22)} x={80} y={676} c={color.ink}>CAIU</Falling>
      <Falling at={at(9.64)} x={80} y={902}>DO CÉU.</Falling>
      <SkillChip label="FÍSICA DE MOLA · SPRING" />
    </AbsoluteFill>
  );
};

// Linha do tempo compartilhada pelas cenas de Celina e Alzira.
const Year: React.FC<{ from: number; to: number; start: number; end: number }> = ({ from, to, start, end }) => {
  const frame = useCurrentFrame();
  const y = Math.round(interpolate(frame, [start, end], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return <div style={{ position: "absolute", left: 210, top: 250, ...display(330, color.red) }}>{y}</div>;
};

const NameCard: React.FC<{ at: number; name: string; top: number }> = ({ at, name, top }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [at, at + 20], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        left: 210,
        top,
        width: 820,
        fontFamily: font.serif,
        fontStyle: "italic",
        fontSize: 118,
        lineHeight: 0.98,
        color: color.ink,
        clipPath: `inset(0 ${100 - reveal}% 0 0)`,
      }}
    >
      {name}
    </div>
  );
};

const Badge: React.FC<{ at: number; text: string; top: number }> = ({ at, text, top }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: 210, top, overflow: "hidden", transform: `scaleX(${w})`, transformOrigin: "left" }}>
      <div style={{ ...display(84, color.paper), backgroundColor: color.red, padding: "14px 24px 4px", letterSpacing: 1 }}>{text}</div>
    </div>
  );
};

const Place: React.FC<{ at: number; text: string; top: number }> = ({ at, text, top }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 8], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 210, top, opacity: o, fontFamily: font.mono, fontSize: 36, letterSpacing: 4, color: color.ink }}>
      ◉ {text}
    </div>
  );
};

export const SceneCelina: React.FC = () => {
  const at = useAt(scene.celina);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <RoughShape kind="line" args={[130, 230, 130, 1480]} from={0} to={30} width={6} />
        <RoughShape kind="circle" args={[130, 400, 46]} from={at(11.14)} to={at(11.14) + 12} fill={color.red} stroke={color.red} />
        <RoughShape kind="rect" args={[760, 1110, 200, 230]} from={at(16.2)} to={at(16.2) + 20} width={6} seed={11} />
        <RoughShape kind="path" args="M795 1230 L845 1290 L920 1150" from={at(16.7)} to={at(16.7) + 12} width={12} stroke={color.red} seed={4} />
      </svg>
      <Year from={1900} to={1927} start={at(11.14)} end={at(12.4)} />
      <Place at={at(13.36)} text="MOSSORÓ · RIO GRANDE DO NORTE" top={610} />
      <NameCard at={at(14.66)} name="Celina Guimarães Viana" top={700} />
      <Badge at={at(17.46)} text="1ª ELEITORA DO BRASIL" top={960} />
      <SkillChip label="LINHA DO TEMPO · DATAVIZ" />
    </AbsoluteFill>
  );
};

export const SceneAlzira: React.FC = () => {
  const at = useAt(scene.alzira);
  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <RoughShape kind="line" args={[130, 230, 130, 1480]} from={-1} to={0} width={6} />
        <RoughShape kind="circle" args={[130, 400, 46]} from={0} to={10} fill={color.ink} stroke={color.ink} seed={8} />
        <RoughShape kind="circle" args={[300, 1003, 190]} from={at(22.32)} to={at(22.32) + 16} width={6} stroke={color.ink} seed={2} />
      </svg>
      <Year from={1927} to={1928} start={0} end={14} />
      <Place at={at(20.4)} text="LAJES · RIO GRANDE DO NORTE" top={610} />
      <NameCard at={at(20.58)} name="Alzira Soriano" top={700} />
      <Badge at={at(22.32)} text="1ª PREFEITA DO BRASIL" top={960} />
      <SkillChip label="TIPOGRAFIA EDITORIAL" />
    </AbsoluteFill>
  );
};

// 6. Bertha Lutz e milhares de mulheres: fileiras em marcha.
const MarchRow: React.FC<{ top: number; h: number; speed: number; offset: number; opacity?: number }> = ({ top, h, speed, offset, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const w = h * (1382 / 973);
  const x = -((frame * speed + offset) % w);
  return (
    <div style={{ position: "absolute", top, left: x, display: "flex", opacity }}>
      {Array.from({ length: Math.ceil(1080 / w) + 2 }, (_, i) => (
        <Img key={i} src={staticFile("img/mulher-halftone.png")} style={{ height: h, width: w, mixBlendMode: "multiply" }} />
      ))}
    </div>
  );
};

export const SceneBertha: React.FC = () => {
  const at = useAt(scene.bertha);
  return (
    <AbsoluteFill>
      <Rays a={color.paper} b={color.paperDark} cy={1500} speed={-0.1} count={24} />
      <MarchRow top={1000} h={300} speed={3} offset={0} opacity={0.55} />
      <MarchRow top={1180} h={420} speed={5} offset={180} />
      <Stamp at={at(24.5)} rotate={-4} style={{ left: 70, top: 280 }}>
        <div style={{ ...display(190, color.paper), backgroundColor: color.ink, padding: "16px 28px 4px" }}>BERTHA LUTZ</div>
      </Stamp>
      <Stamp at={at(25.4)} rotate={-4} style={{ left: 90, top: 520 }}>
        <div style={{ ...display(170, color.red) }}>+ MILHARES</div>
      </Stamp>
      <Stamp at={at(26.0)} rotate={-4} style={{ left: 100, top: 670 }}>
        <div style={{ ...display(110, color.ink) }}>DE MULHERES</div>
      </Stamp>
      <Stamp at={at(28.12)} rotate={5} style={{ left: 330, top: 820 }}>
        <div style={{ ...display(90, color.paper), backgroundColor: color.red, padding: "10px 20px 2px" }}>ATÉ A LEI MUDAR</div>
      </Stamp>
      <SkillChip label="ILUSTRAÇÃO CANVA IA + MEIO-TOM" />
    </AbsoluteFill>
  );
};

// 7. Os dados de hoje: 52 de cada 100 eleitores são mulheres.
const Person: React.FC<{ x: number; y: number; on: boolean }> = ({ x, y, on }) => (
  <g transform={`translate(${x} ${y}) scale(0.85)`}>
    <circle cx={22} cy={12} r={11} fill={on ? color.red : "none"} stroke={on ? color.red : color.ink} strokeWidth={3} />
    <path d="M22 26 L40 70 L4 70 Z" fill={on ? color.red : "none"} stroke={on ? color.red : color.ink} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

export const SceneData: React.FC = () => {
  const at = useAt(scene.data);
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [at(30.8), at(33.28)], [0, 52], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const textO = interpolate(frame, [at(31.34), at(31.34) + 8], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 80, top: 220, ...display(380, color.red) }}>
        {n}
        <span style={{ fontSize: 220 }}>%</span>
      </div>
      <div style={{ position: "absolute", left: 90, top: 560, opacity: textO, ...display(84, color.ink), width: 900 }}>
        MAIS DA METADE DO ELEITORADO BRASILEIRO
      </div>
      <div style={{ position: "absolute", left: 92, top: 720, fontFamily: font.mono, fontSize: 26, color: color.ink, opacity: textO }}>
        FONTE: TSE, ELEIÇÕES 2024 — 52,5% DO ELEITORADO
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 100 }, (_, i) => (
          <Person key={i} x={110 + (i % 10) * 88} y={790 + Math.floor(i / 10) * 70} on={i < n} />
        ))}
      </svg>
      <SkillChip label="VISUALIZAÇÃO DE DADOS" />
    </AbsoluteFill>
  );
};

// 8. "Seu voto é sua voz": megafone e tipografia cinética.
export const SceneVoice: React.FC = () => {
  const at = useAt(scene.voice);
  const frame = useCurrentFrame();
  const pulse = 1 + 0.04 * Math.sin(frame / 3);
  return (
    <AbsoluteFill>
      <Rays a={color.ink} b={color.redDark} cx={260} cy={1350} speed={0.25} count={14} />
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`translate(260 1350) rotate(-28) scale(${pulse})`}>
          <path d="M0 -60 L260 -170 L260 170 L0 60 Z" fill={color.paper} />
          <rect x={-80} y={-60} width={80} height={120} fill={color.red} />
          <rect x={-60} y={60} width={40} height={110} fill={color.paper} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 80, top: 250, ...display(64, color.paper), letterSpacing: 3 }}>
        {frame >= at(35.6) ? "ESSE DIREITO FOI CONQUISTADO." : ""}
      </div>
      <Stamp at={at(37.18)} rotate={-10} style={{ left: 600, top: 330 }}>
        <div style={{ ...display(230, color.ink), backgroundColor: color.yellow, padding: "16px 30px 0" }}>USE.</div>
      </Stamp>
      <Stamp at={at(37.7)} rotate={-10} style={{ left: 110, top: 600 }}>
        <div style={{ ...display(210, color.paper) }}>SEU VOTO</div>
      </Stamp>
      <Stamp at={at(38.34)} rotate={-10} style={{ left: 250, top: 790 }}>
        <div style={{ ...display(190, color.yellow) }}>É SUA</div>
      </Stamp>
      <Stamp at={at(38.48)} rotate={-10} style={{ left: 470, top: 990 }}>
        <div style={{ ...display(330, color.paper), textShadow: `12px 12px 0 ${color.red}` }}>VOZ</div>
      </Stamp>
      <SkillChip label="TIPOGRAFIA CINÉTICA" dark />
    </AbsoluteFill>
  );
};

// 9. O pôster, sozinho.
export const ScenePoster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 90 } });
  const scale = interpolate(s, [0, 1], [1.5, 1]);
  const rot = interpolate(s, [0, 1], [-6, -2]);
  const fadeOut = interpolate(frame, [160, 180], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Rays a={color.redDark} b={color.red} cy={700} speed={0.1} count={20} />
      <div
        style={{
          position: "absolute",
          left: 105,
          top: 360,
          width: 870,
          height: 1160,
          transform: `scale(${scale}) rotate(${rot}deg)`,
          boxShadow: `22px 22px 0 ${color.ink}`,
          border: `14px solid ${color.paper}`,
        }}
      >
        <Img src={staticFile("img/poster.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </AbsoluteFill>
  );
};
