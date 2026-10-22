import { Composition } from "remotion";
import { Faisca } from "./Faisca";

export const RemotionRoot: React.FC = () => {
  return <Composition id="Faisca" component={Faisca} durationInFrames={450} fps={30} width={1080} height={1920} />;
};
