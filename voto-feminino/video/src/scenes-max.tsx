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
import {
  Burst,
  Checker,
  Confetti,
  Dots,
  Hand,
  Newsprint,
  Ransom,
  Squiggle,
  Star,
  SunsetBands,
  Tape,
  Torn,
  mfont,
  pal,
  usePop,
} from "./collage";
import { Portrait, Rays } from "./parts";
import { scene } from "./theme";

const useAt = (sceneStart: number) => {
  const { fps } = useVideoConfig();
  return (abs: number) => Math.round((abs - sceneStart) * fps);
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 1. A data, em letras recortadas sobre raios cobalto.
export const MaxDate: React.FC = () => {
  const at = useAt(scene.date);
  return (
    <AbsoluteFill>
      <Rays a={pal.cobalt} b="#3A5BE3" cy={900} speed={0.15} count={22} />
      <Checker top={1660} height={260} size={65} a={pal.ink} b={pal.yellow} />
      <Star x={150} y={220} r={60} color={pal.yellow} spin={1.2} />
      <Star x={930} y={1530} r={80} color={pal.pink} spin={-0.8} />
      <Star x={980} y={260} r={36} color={pal.cream} spin={2} />
      <Ransom text="24" x={110} y={330} size={280} at={at(0.9)} seed={11} />
      <Burst x={790} y={470} r={160} color={pal.yellow} text="FEV" at={at(1.86)} />
      <Ransom text="1932" x={80} y={760} size={260} at={at(2.58)} seed={23} stagger={3} />
      <Squiggle x={110} y={1130} w={760} color={pal.pink} at={at(3.3)} />
      <Hand text="um dia histórico" x={200} y={1260} size={96} color={pal.cream} at={at(3.6)} />
    </AbsoluteFill>
  );
};

// Urna vetorial chapada, com contorno grosso.
const Urn: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={520} height={470} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    <path d="M40 90 L120 20 L500 20 L420 90 Z" fill="#F7B3D2" stroke={pal.ink} strokeWidth={8} strokeLinejoin="round" />
    <path d="M420 90 L500 20 L500 380 L420 450 Z" fill="#C9578C" stroke={pal.ink} strokeWidth={8} strokeLinejoin="round" />
    <rect x={40} y={90} width={380} height={360} fill={pal.pink} stroke={pal.ink} strokeWidth={8} />
    <rect x={150} y={44} width={200} height={22} rx={8} fill={pal.ink} transform="skewX(-40) translate(62 0)" />
    <circle cx={230} cy={270} r={70} fill={pal.yellow} stroke={pal.ink} strokeWidth={8} />
    <path d="M195 270 L222 298 L268 238" fill="none" stroke={pal.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 2. A lei: urna vetorial, cédula caindo e o selo "É LEI!".
export const MaxLaw: React.FC = () => {
  const at = useAt(scene.law);
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [at(6.32), at(6.82)], [-420, 60], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill style={{ backgroundColor: pal.kraft }}>
      <Torn x={60} y={420} w={960} h={1080} color={pal.cream} rotate={-3} seed={31}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(44,75,209,0.25) 2px, transparent 2px), linear-gradient(90deg, rgba(44,75,209,0.25) 2px, transparent 2px)`, backgroundSize: "48px 48px" }} />
      </Torn>
      <Tape x={80} y={420} rotate={-30} />
      <Tape x={860} y={1430} rotate={-25} />
      <Urn x={250} y={820} />
      {frame < at(6.82) + 1 ? (
        <div style={{ position: "absolute", left: 420, top: 600 + drop, width: 150, height: 200, backgroundColor: pal.cream, border: `6px solid ${pal.ink}`, transform: "rotate(-8deg)" }}>
          <div style={{ fontFamily: mfont.hand, fontSize: 90, color: pal.green, textAlign: "center", lineHeight: "190px" }}>✓</div>
        </div>
      ) : null}
      <Ransom text="VOTO FEMININO" x={50} y={150} size={104} at={at(6.66)} seed={5} stagger={1} />
      <Burst x={830} y={1500} r={180} color={pal.green} text={"É LEI!"} textColor={pal.cream} at={at(7.44)} />
      <Star x={150} y={1560} r={70} color={pal.yellow} />
    </AbsoluteFill>
  );
};

// 3. "Não caiu do céu": pôr do sol setentista e palavras em papel caindo.
const FallCard: React.FC<{ at: number; x: number; y: number; w: number; h: number; bg: string; fg: string; font: string; size: number; rotate: number; seed: number; children: React.ReactNode }> = ({
  at,
  x,
  y,
  w,
  h,
  bg,
  fg,
  font,
  size,
  rotate,
  seed,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 130, mass: 0.9 } });
  if (frame < at) return null;
  const ty = interpolate(s, [0, 1], [-1500, 0]);
  return (
    <Torn x={x} y={y + ty} w={w} h={h} color={bg} rotate={rotate + (1 - s) * -20} seed={seed}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font, fontSize: size, color: fg, lineHeight: 1 }}>
        {children}
      </div>
    </Torn>
  );
};

const Cloud: React.FC<{ x: number; y: number; s: number; speed: number }> = ({ x, y, s, speed }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={300 * s} height={140 * s} viewBox="0 0 300 140" style={{ position: "absolute", left: x + frame * speed, top: y }}>
      <path d="M40 120 Q0 120 10 90 Q20 60 60 70 Q70 20 130 30 Q160 0 200 30 Q260 20 260 70 Q300 80 285 110 Q280 125 250 120 Z" fill={pal.cream} stroke={pal.ink} strokeWidth={6} />
    </svg>
  );
};

export const MaxSky: React.FC = () => {
  const at = useAt(scene.sky);
  return (
    <AbsoluteFill>
      <SunsetBands colors={[pal.cobalt, pal.pink, pal.red, pal.orange, pal.yellow]} />
      <div style={{ position: "absolute", left: 290, top: 1250, width: 500, height: 500, borderRadius: "50%", backgroundColor: pal.red, border: `10px solid ${pal.ink}` }} />
      <Cloud x={-80} y={160} s={1.3} speed={0.8} />
      <Cloud x={620} y={420} s={0.9} speed={-0.6} />
      <Hand text="mas essa conquista..." x={90} y={300} size={84} color={pal.cream} at={0} rotate={-4} />
      <FallCard at={at(9.88)} x={90} y={520} w={600} h={240} bg={pal.ink} fg={pal.cream} font={mfont.fat} size={190} rotate={-4} seed={41}>NÃO</FallCard>
      <FallCard at={at(10.06)} x={360} y={790} w={640} h={240} bg={pal.cream} fg={pal.red} font={mfont.retro} size={150} rotate={3} seed={42}>CAIU</FallCard>
      <FallCard at={at(10.42)} x={70} y={1060} w={820} h={240} bg={pal.yellow} fg={pal.ink} font={mfont.didone} size={180} rotate={-2} seed={43}>do céu.</FallCard>
    </AbsoluteFill>
  );
};

// Carimbo postal circular com texto em volta.
const Postmark: React.FC<{ x: number; y: number; r: number; text: string; center: string; at: number; color?: string }> = ({ x, y, r, text, center, at, color = pal.red }) => {
  const frame = useCurrentFrame();
  const { s, visible } = usePop(at, 260);
  if (!visible) return null;
  const id = `pm-${center}`;
  return (
    <svg width={r * 2 + 20} height={r * 2 + 20} style={{ position: "absolute", left: x - r - 10, top: y - r - 10, transform: `rotate(${-14 + frame * 0.05}deg) scale(${interpolate(s, [0, 1], [1.6, 1])})`, opacity: 0.9 }}>
      <defs>
        <path id={id} d={`M ${r + 10} ${r + 10} m -${r - 26} 0 a ${r - 26} ${r - 26} 0 1 1 ${2 * (r - 26)} 0 a ${r - 26} ${r - 26} 0 1 1 -${2 * (r - 26)} 0`} />
      </defs>
      <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={color} strokeWidth={8} />
      <circle cx={r + 10} cy={r + 10} r={r - 52} fill="none" stroke={color} strokeWidth={4} />
      <text fontFamily={mfont.grotesk} fontWeight={700} fontSize={30} fill={color} letterSpacing={6}>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
      <text x={r + 10} y={r + 30} textAnchor="middle" fontFamily={mfont.retro} fontSize={50} fill={color}>
        {center}
      </text>
    </svg>
  );
};

// 4. Celina: retrato colado em papel, recortes de jornal e carimbo.
export const MaxCelina: React.FC = () => {
  const at = useAt(scene.celina);
  return (
    <AbsoluteFill>
      <Dots color="rgba(215,38,30,0.45)" bg={pal.cream} size={40} dot={7} />
      <Newsprint x={-60} y={160} w={420} h={620} rotate={-9} seed={12} />
      <Newsprint x={700} y={980} w={440} h={560} rotate={8} seed={13} />
      <Torn x={146} y={146} w={840} h={1050} color={pal.pink} rotate={-2} seed={51} shadow={false} />
      <Torn x={120} y={120} w={840} h={1050} color={pal.cream} rotate={-2} seed={52}>
        <Portrait name="celina" left={20} top={20} width={800} drawFrom={0} drawTo={at(15.6)} />
      </Torn>
      <Tape x={90} y={110} rotate={-35} />
      <Tape x={850} y={110} rotate={30} />
      <Burst x={230} y={1100} r={150} color={pal.yellow} text="1927" at={at(11.78)} fontSize={66} />
      <Postmark x={860} y={1120} r={130} text="MOSSORÓ ✶ RIO GRANDE DO NORTE ✶ " center="RN" at={at(13.64)} />
      <Torn x={60} y={1300} w={960} h={170} color={pal.ink} rotate={1} seed={53} at={at(14.9)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mfont.serif, fontSize: 74, color: pal.cream }}>
          Celina Guimarães Viana
        </div>
      </Torn>
      <Ransom text="1ª ELEITORA DO BRASIL" x={60} y={1520} size={72} at={at(17.32)} seed={77} stagger={1} maxWidth={980} />
      <Star x={980} y={150} r={50} color={pal.cobalt} />
    </AbsoluteFill>
  );
};

// Faixa vetorial (fita de premiação) com pontas recortadas.
const Ribbon: React.FC<{ y: number; text: string; at: number; color: string }> = ({ y, text, at, color }) => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <div style={{ position: "absolute", left: 40, top: y, width: 1000, height: 150, transform: `scaleX(${w}) rotate(-3deg)` }}>
      <svg width={1000} height={150} style={{ position: "absolute", overflow: "visible" }}>
        <path d="M0 30 L80 30 L80 140 L0 140 L30 85 Z" fill="#8E1712" stroke={pal.ink} strokeWidth={6} />
        <path d="M1000 30 L920 30 L920 140 L1000 140 L970 85 Z" fill="#8E1712" stroke={pal.ink} strokeWidth={6} />
        <rect x={60} y={10} width={880} height={110} fill={color} stroke={pal.ink} strokeWidth={6} />
      </svg>
      <div style={{ position: "absolute", left: 60, top: 10, width: 880, height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mfont.retro, fontSize: 46, color: pal.cream }}>
        {text}
      </div>
    </div>
  );
};

// 5. Alzira: moldura em arco retrô, faixa de prefeita.
export const MaxAlzira: React.FC = () => {
  const at = useAt(scene.alzira);
  return (
    <AbsoluteFill style={{ backgroundColor: pal.teal }}>
      <Checker top={0} height={110} size={55} a={pal.cream} b={pal.teal} shift={-0.6} />
      <Checker top={1810} height={110} size={55} a={pal.cream} b={pal.teal} />
      <div style={{ position: "absolute", left: 120, top: 170, width: 840, height: 1040, borderRadius: "420px 420px 24px 24px", backgroundColor: pal.orange, border: `10px solid ${pal.ink}` }} />
      <div style={{ position: "absolute", left: 160, top: 210, width: 760, height: 960, borderRadius: "380px 380px 16px 16px", overflow: "hidden", backgroundColor: pal.cream, border: `8px solid ${pal.ink}` }}>
        <Portrait name="alzira" left={-20} top={0} width={800} drawFrom={0} drawTo={at(22.2)} />
      </div>
      <Burst x={900} y={1100} r={140} color={pal.yellow} text="1928" at={5} fontSize={60} />
      <Hand text="Lajes · RN" x={110} y={1230} size={90} color={pal.cream} at={at(20.4)} rotate={-5} />
      <div style={{ position: "absolute", left: 90, top: 1340, fontFamily: mfont.didone, fontSize: 120, color: pal.ink, opacity: interpolate(useCurrentFrame(), [at(20.74), at(20.74) + 8], [0, 1], clamp) }}>
        Alzira Soriano
      </div>
      <Ribbon y={1540} text="1ª PREFEITA DO BRASIL" at={at(22.42)} color={pal.red} />
      <Star x={120} y={230} r={60} color={pal.pink} />
      <Star x={980} y={760} r={44} color={pal.yellow} spin={-1.5} />
    </AbsoluteFill>
  );
};

// Cartaz de protesto vetorial que sobe.
const Sign: React.FC<{ x: number; y: number; text: string; bg: string; fg: string; at: number; rot: number; w?: number }> = ({ x, y, text, bg, fg, at, rot, w = 300 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 120 } });
  if (frame < at) return null;
  const bob = Math.sin((frame - at) / 6 + x) * 6;
  return (
    <div style={{ position: "absolute", left: x, top: y + interpolate(s, [0, 1], [500, 0]) + bob, transform: `rotate(${rot}deg)` }}>
      <div style={{ position: "absolute", left: w / 2 - 9, top: 150, width: 18, height: 420, backgroundColor: pal.kraft, border: `5px solid ${pal.ink}` }} />
      <div style={{ position: "relative", width: w, height: 170, backgroundColor: bg, border: `7px solid ${pal.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mfont.fat, fontSize: 70, color: fg, boxShadow: "8px 8px 0 rgba(27,22,18,0.3)" }}>
        {text}
      </div>
    </div>
  );
};

const March: React.FC<{ top: number; h: number; speed: number; hue: number }> = ({ top, h, speed, hue }) => {
  const frame = useCurrentFrame();
  const w = h * (1382 / 973);
  const x = -((frame * speed) % w);
  return (
    <div style={{ position: "absolute", top, left: x, display: "flex", filter: `hue-rotate(${hue}deg) saturate(1.3)` }}>
      {Array.from({ length: Math.ceil(1080 / w) + 2 }, (_, i) => (
        <Img key={i} src={staticFile("img/mulher-halftone.png")} style={{ height: h, width: w }} />
      ))}
    </div>
  );
};

// 6. Bertha Lutz e a multidão: retrato, cartazes, marcha em cores.
export const MaxBertha: React.FC = () => {
  const at = useAt(scene.bertha);
  return (
    <AbsoluteFill>
      <Rays a={pal.pink} b="#F7B9D4" cy={500} speed={-0.12} count={26} />
      <March top={1480} h={220} speed={4} hue={150} />
      <March top={1680} h={260} speed={6} hue={0} />
      <Torn x={250} y={70} w={600} h={760} color={pal.cream} rotate={3} seed={61}>
        <Portrait name="bertha" left={20} top={20} width={560} drawFrom={0} drawTo={at(26.8)} />
      </Torn>
      <Tape x={210} y={80} rotate={-28} />
      <Tape x={760} y={790} rotate={-20} />
      <Ransom text="BERTHA LUTZ" x={50} y={860} size={92} at={at(24.8)} seed={88} stagger={1} />
      <Sign x={50} y={1120} text="VOTO!" bg={pal.yellow} fg={pal.ink} at={at(25.7)} rot={-6} />
      <Sign x={380} y={1180} text="JÁ!" bg={pal.green} fg={pal.cream} at={at(25.9)} rot={4} w={220} />
      <Burst x={845} y={1170} r={190} color={pal.orange} text={"+MILHARES\nDE\nMULHERES"} at={at(26.2)} fontSize={38} />
      <Torn x={160} y={1380} w={760} h={120} color={pal.red} rotate={-4} seed={62} at={at(27.84)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mfont.retro, fontSize: 52, color: pal.cream }}>
          ATÉ A LEI MUDAR
        </div>
      </Torn>
    </AbsoluteFill>
  );
};

// Bonequinha vetorial colorida para o gráfico.
const Woman: React.FC<{ x: number; y: number; c?: string }> = ({ x, y, c }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx={22} cy={12} r={11} fill={c ?? "none"} stroke={pal.ink} strokeWidth={3} />
    <path d="M22 26 L40 66 L4 66 Z" fill={c ?? "none"} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

// 7. Os dados: infográfico retrô.
export const MaxData: React.FC = () => {
  const at = useAt(scene.data);
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [at(30.4), at(32.62)], [0, 52], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const textO = interpolate(frame, [at(30.98), at(30.98) + 8], [0, 1], clamp);
  const cs = [pal.red, pal.pink, pal.orange, pal.cobalt, pal.green, pal.teal];
  return (
    <AbsoluteFill style={{ backgroundColor: pal.cream }}>
      <Checker top={0} height={90} size={45} a={pal.ink} b={pal.yellow} />
      <div style={{ position: "absolute", left: 70, top: 170, fontFamily: mfont.retro, fontSize: 250, lineHeight: 1, color: pal.pink }}>{n}%</div>
      <div style={{ position: "absolute", left: 60, top: 160, fontFamily: mfont.retro, fontSize: 250, lineHeight: 1, color: pal.red, mixBlendMode: "multiply" }}>{n}%</div>
      <Torn x={50} y={520} w={980} h={150} color={pal.cobalt} rotate={-1.5} seed={71} at={at(30.98)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mfont.grotesk, fontWeight: 700, fontSize: 56, color: pal.cream, opacity: textO }}>
          MAIS DA METADE DO ELEITORADO
        </div>
      </Torn>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 100 }, (_, i) => (
          <Woman key={i} x={110 + (i % 10) * 88} y={740 + Math.floor(i / 10) * 82} c={i < n ? cs[i % cs.length] : undefined} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 110, top: 1580, fontFamily: mfont.grotesk, fontWeight: 700, fontSize: 30, color: pal.ink, opacity: textO }}>
        Fonte: TSE, eleições 2024 (52,5%)
      </div>
      <Hand text="mais da metade!" x={420} y={1650} size={70} color={pal.red} at={at(33.2)} rotate={-8} />
      <Star x={960} y={250} r={70} color={pal.yellow} />
    </AbsoluteFill>
  );
};

// Megafone vetorial com ondas de som coloridas.
const Megaphone: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const rings = [pal.pink, pal.yellow, pal.teal, pal.cream];
  return (
    <svg width={1080} height={900} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      {rings.map((c, i) => {
        const t = ((frame + i * 9) % 36) / 36;
        return (
          <path
            key={i}
            d={`M ${560 + t * 260} ${170 - t * 200} A ${260 + t * 300} ${260 + t * 300} 0 0 1 ${560 + t * 260} ${590 + t * 200}`}
            fill="none"
            stroke={c}
            strokeWidth={22}
            strokeLinecap="round"
            opacity={1 - t}
          />
        );
      })}
      <g transform="rotate(-18 300 380)">
        <path d="M150 300 L520 140 L520 620 L150 460 Z" fill={pal.red} stroke={pal.ink} strokeWidth={10} strokeLinejoin="round" />
        <ellipse cx={520} cy={380} rx={60} ry={240} fill={pal.cream} stroke={pal.ink} strokeWidth={10} />
        <rect x={60} y={300} width={100} height={160} rx={18} fill={pal.yellow} stroke={pal.ink} strokeWidth={10} />
        <rect x={190} y={450} width={60} height={170} rx={14} fill={pal.cobalt} stroke={pal.ink} strokeWidth={10} />
      </g>
    </svg>
  );
};

// 8. "Seu voto é sua voz": final maximalista.
export const MaxVoice: React.FC = () => {
  const at = useAt(scene.voice);
  return (
    <AbsoluteFill>
      <Rays a={pal.yellow} b={pal.orange} cy={1400} cx={200} speed={0.3} count={16} />
      <Checker top={1800} height={120} size={60} a={pal.ink} b={pal.cream} shift={1.2} />
      <Megaphone x={-40} y={1050} />
      <Hand text="esse direito foi conquistado." x={60} y={150} size={70} color={pal.ink} at={at(35.6)} rotate={-3} />
      <Burst x={820} y={430} r={170} color={pal.ink} text="USE." textColor={pal.yellow} at={at(37.46)} fontSize={70} />
      <Ransom text="SEU VOTO" x={50} y={600} size={124} at={at(37.88)} seed={91} stagger={1} />
      <Ransom text="É SUA" x={160} y={800} size={120} at={at(38.6)} seed={92} stagger={1} />
      <Ransom text="VOZ!" x={300} y={960} size={190} at={at(38.88)} seed={93} stagger={1} />
      <Star x={120} y={480} r={56} color={pal.pink} spin={2} />
      <Star x={990} y={900} r={46} color={pal.cobalt} spin={-2} />
    </AbsoluteFill>
  );
};

// 9. O pôster colado no mural, com adesivos e confete.
export const MaxPoster: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const fadeOut = interpolate(frame, [130, 153], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Rays a={pal.red} b={pal.orange} cy={900} speed={0.1} count={24} />
      <Newsprint x={-80} y={120} w={460} h={700} rotate={-12} seed={21} />
      <Newsprint x={720} y={1150} w={460} h={700} rotate={10} seed={22} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 300,
          width: 860,
          height: 1146,
          transform: `scale(${interpolate(s, [0, 1], [1.4, 1])}) rotate(${interpolate(s, [0, 1], [-8, -2])}deg)`,
          border: `16px solid ${pal.cream}`,
          boxShadow: `18px 18px 0 ${pal.ink}`,
        }}
      >
        <Img src={staticFile("img/poster.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <Tape x={60} y={280} rotate={-38} at={10} />
      <Tape x={840} y={270} rotate={36} at={12} />
      <Tape x={60} y={1420} rotate={34} at={14} />
      <Tape x={850} y={1400} rotate={-32} at={16} />
      <Burst x={180} y={250} r={120} color={pal.pink} text="1932" at={20} fontSize={48} />
      <Burst x={900} y={1560} r={130} color={pal.green} text="VOTE!" textColor={pal.cream} at={26} fontSize={44} />
      <Star x={960} y={220} r={70} color={pal.yellow} at={30} />
      <Star x={130} y={1600} r={60} color={pal.cobalt} at={34} />
      <Confetti from={8} count={80} />
    </AbsoluteFill>
  );
};
