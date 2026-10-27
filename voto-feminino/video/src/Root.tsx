import { Composition } from "remotion";
import "./theme";
import { VotoFeminino } from "./VotoFeminino";
import { VotoMaximalista } from "./VotoMaximalista";
import { Perfil } from "./Perfil";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VotoFeminino"
        component={VotoFeminino}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="VotoMaximalista"
        component={VotoMaximalista}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="Perfil" component={Perfil} durationInFrames={1} fps={30} width={1080} height={1080} />
    </>
  );
};
