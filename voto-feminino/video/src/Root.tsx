import { Composition } from "remotion";
import "./theme";
import { VotoFeminino } from "./VotoFeminino";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VotoFeminino"
      component={VotoFeminino}
      durationInFrames={1350}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
