import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { RisoGrain, TornWipe, pal } from "./collage";
import { MaxAlzira, MaxBertha, MaxCelina, MaxData, MaxDate, MaxLaw, MaxPoster, MaxSky, MaxVoice } from "./scenes-max";
import { scene } from "./theme";

// Mesma narração e mesmos cortes da versão construtivista, outro figurino:
// colagem, vetor, retrô e maximalismo.
const order: [number, number, React.FC, string][] = [
  [scene.date, scene.law, MaxDate, pal.yellow],
  [scene.law, scene.sky, MaxLaw, pal.cobalt],
  [scene.sky, scene.celina, MaxSky, pal.pink],
  [scene.celina, scene.alzira, MaxCelina, pal.teal],
  [scene.alzira, scene.bertha, MaxAlzira, pal.orange],
  [scene.bertha, scene.data, MaxBertha, pal.green],
  [scene.data, scene.voice, MaxData, pal.red],
  [scene.voice, scene.poster, MaxVoice, pal.cobalt],
  [scene.poster, scene.end, MaxPoster, pal.yellow],
];

export const VotoMaximalista: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: pal.ink }}>
      {order.map(([from, to, Scene]) => (
        <Sequence key={from} from={Math.round(from * fps)} durationInFrames={Math.round((to - from) * fps)}>
          <Scene />
        </Sequence>
      ))}
      {order.slice(1).map(([from, , , c], i) => (
        <TornWipe key={from} at={Math.round(from * fps)} color={c} seed={i + 3} />
      ))}
      <RisoGrain />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
