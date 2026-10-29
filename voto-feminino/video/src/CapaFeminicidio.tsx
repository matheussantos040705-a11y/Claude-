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
    <div style={{ position: "absolute", right: 50, top: 250, textAlign: "right", transform: "rotate(-4deg)", transformOrigin: "right top" }}>
      <div style={{ ...display(190, color.paper), textShadow: `10px 10px 0 ${color.ink}` }}>FEMINICÍDIO</div>
      <div style={{ ...display(250, color.yellow), textShadow: `12px 12px 0 ${color.ink}`, marginTop: 6 }}>EXISTE.</div>
      <div style={{ display: "inline-block", marginTop: 26, backgroundColor: color.ink, padding: "14px 22px 6px", boxShadow: `8px 8px 0 ${color.paper}` }}>
        <div style={{ ...display(74, color.paper) }}>1.571 MULHERES MORTAS</div>
        <div style={{ ...display(54, color.red), marginTop: 4 }}>EM 2025 · RECORDE</div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1560, display: "flex", justifyContent: "center" }}>
      <div style={{ ...display(96, color.ink), backgroundColor: color.paper, padding: "14px 34px 4px", boxShadow: `10px 10px 0 ${color.red}`, transform: "rotate(-2deg)" }}>☕ CAFÉ NOSSO</div>
    </div>
  </AbsoluteFill>
);
