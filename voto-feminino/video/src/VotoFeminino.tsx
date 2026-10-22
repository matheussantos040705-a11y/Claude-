import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Vignette, Wipe } from "./parts";
import {
  SceneAlzira,
  SceneBertha,
  SceneCelina,
  SceneData,
  SceneDate,
  SceneLaw,
  ScenePoster,
  SceneSky,
  SceneVoice,
} from "./scenes";
import { scene } from "./theme";

const order: [number, number, React.FC][] = [
  [scene.date, scene.law, SceneDate],
  [scene.law, scene.sky, SceneLaw],
  [scene.sky, scene.celina, SceneSky],
  [scene.celina, scene.alzira, SceneCelina],
  [scene.alzira, scene.bertha, SceneAlzira],
  [scene.bertha, scene.data, SceneBertha],
  [scene.data, scene.voice, SceneData],
  [scene.voice, scene.poster, SceneVoice],
  [scene.poster, scene.end, ScenePoster],
];

export const VotoFeminino: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#15110F" }}>
      {order.map(([from, to, Scene]) => (
        <Sequence key={from} from={Math.round(from * fps)} durationInFrames={Math.round((to - from) * fps)}>
          <Scene />
        </Sequence>
      ))}
      {order.slice(1).map(([from]) => (
        <Wipe key={from} at={Math.round(from * fps)} />
      ))}
      <Vignette />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
