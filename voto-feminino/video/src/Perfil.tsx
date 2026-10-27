import React from "react";
import { AbsoluteFill } from "remotion";
import { Paper, Rays } from "./parts";
import { color, font } from "./theme";

// Foto de perfil do Instagram "Café Nosso": xícara construtivista cujo vapor vira o símbolo ♀.
// Pensada para ser recortada em círculo e lida a ~110 px.
export const Perfil: React.FC<{ texto?: boolean }> = ({ texto = true }) => {
  const S = 1080;
  return (
    <AbsoluteFill style={{ backgroundColor: color.ink }}>
      <Rays a={color.redDark} b={color.red} cx={540} cy={700} speed={0} count={20} />
      <svg width={S} height={S} viewBox="0 0 1080 1080" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="disco"><circle cx={540} cy={560} r={390} /></clipPath>
        </defs>
        {/* disco de papel com sombra deslocada (carimbo) */}
        <circle cx={556} cy={576} r={390} fill={color.ink} />
        <g clipPath="url(#disco)">
          <foreignObject x={150} y={170} width={780} height={780}>
            <div style={{ width: 780, height: 780, position: "relative" }}><Paper /></div>
          </foreignObject>
        </g>
        {/* vapor: duas volutas laterais e a central que vira ♀ */}
        <g fill="none" stroke={color.ink} strokeLinecap="round" strokeWidth={22}>
          <path d="M440 520 C 400 470, 470 430, 430 370" />
          <path d="M640 520 C 680 470, 610 430, 650 370" />
        </g>
        <g stroke={color.red} strokeWidth={30} fill="none" strokeLinecap="round">
          <path d="M540 545 C 505 500, 575 470, 540 420" />
          <circle cx={540} cy={330} r={78} />
          <line x1={540} y1={408} x2={540} y2={505} />
          <line x1={492} y1={462} x2={588} y2={462} />
        </g>
        {/* xícara: corpo trapezoidal, faixa vermelha, alça e pires */}
        <ellipse cx={540} cy={790} rx={250} ry={34} fill={color.ink} />
        <path d="M362 560 L718 560 L688 742 Q684 770 656 770 L424 770 Q396 770 392 742 Z" fill={color.ink} />
        <rect x={372} y={612} width={336} height={58} fill={color.red} />
        <path d="M712 598 C 812 592, 818 712, 694 716" fill="none" stroke={color.ink} strokeWidth={30} />
        <ellipse cx={540} cy={560} rx={178} ry={22} fill={color.redDark} />
        {texto ? (
          <text x={540} y={656} textAnchor="middle" fontFamily={font.display} fontWeight={700} fontSize={50} fill={color.paper} letterSpacing={6}>
            CAFÉ NOSSO
          </text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
