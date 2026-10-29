import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { color, font } from "./theme";

// Capa do Reels "Feminicídio existe": ilustração do Canva + tipografia do vídeo.
// Texto dentro da faixa central 3:4 (y 240–1680) para aparecer inteiro na grade do perfil.
const display = (size: number, c: string): React.CSSProperties => ({
  fontFamily: font.display, fontWeight: 700, fontSize: size, lineHeight: 0.86, color: c, textTransform: "uppercase", letterSpacing: -1,
});

export const CapaFeminicidio: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.ink }}>
    <Img src={staticFile("img/capa-feminicidio.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    {/* título no céu de raios, à direita do punho */}
    <div style={{ position: "absolute", right: 46, top: 250, textAlign: "right" }}>
      <div style={{ ...display(158, color.paper), textShadow: `8px 8px 0 ${color.ink}` }}>FEMINICÍDIO</div>
      <div style={{ ...display(224, color.yellow), textShadow: `10px 10px 0 ${color.ink}`, marginTop: 4 }}>EXISTE.</div>
    </div>
    {/* dado à direita da cabeça, acima do grupo de mulheres */}
    <div style={{ position: "absolute", right: 46, top: 800, textAlign: "right", backgroundColor: color.ink, padding: "14px 20px 6px", boxShadow: `7px 7px 0 ${color.paper}` }}>
      <div style={{ ...display(66, color.paper) }}>1.571 MULHERES</div>
      <div style={{ ...display(66, color.paper) }}>MORTAS EM 2025</div>
      <div style={{ ...display(44, color.red), marginTop: 6 }}>RECORDE HISTÓRICO</div>
    </div>
    {/* assinatura pequena no rodapé, fora dos elementos principais */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 1808, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: font.mono, fontSize: 30, letterSpacing: 5, color: color.paper, backgroundColor: "rgba(21,17,15,0.85)", padding: "10px 22px" }}>☕ CAFÉ NOSSO</div>
    </div>
  </AbsoluteFill>
);

// Versão para o feed (4:5, 1080×1350): mesma arte, enquadrada do punho ao grupo de mulheres.
export const CapaFeminicidioFeed: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: color.ink, overflow: "hidden" }}>
    <Img src={staticFile("img/capa-feminicidio.png")} style={{ position: "absolute", left: 0, top: -230, width: 1080, height: 1922 }} />
    <div style={{ position: "absolute", right: 40, top: 40, textAlign: "right" }}>
      <div style={{ ...display(150, color.paper), textShadow: `8px 8px 0 ${color.ink}` }}>FEMINICÍDIO</div>
      <div style={{ ...display(212, color.yellow), textShadow: `10px 10px 0 ${color.ink}`, marginTop: 4 }}>EXISTE.</div>
    </div>
    <div style={{ position: "absolute", right: 40, top: 560, textAlign: "right", backgroundColor: color.ink, padding: "12px 18px 6px", boxShadow: `6px 6px 0 ${color.paper}` }}>
      <div style={{ ...display(60, color.paper) }}>1.571 MULHERES</div>
      <div style={{ ...display(60, color.paper) }}>MORTAS EM 2025</div>
      <div style={{ ...display(40, color.red), marginTop: 6 }}>RECORDE HISTÓRICO</div>
    </div>
    <div style={{ position: "absolute", left: 30, top: 1280, fontFamily: font.mono, fontSize: 26, letterSpacing: 5, color: color.paper, backgroundColor: "rgba(21,17,15,0.85)", padding: "8px 18px" }}>☕ CAFÉ NOSSO</div>
  </AbsoluteFill>
);
