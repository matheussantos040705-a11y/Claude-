import { Composition } from "remotion";
import "./theme";
import { VotoFeminino } from "./VotoFeminino";
import { VotoMaximalista } from "./VotoMaximalista";
import { Perfil } from "./Perfil";
import { CapaFeminicidio } from "./CapaFeminicidio";
import { VotoEmRisco } from "./VotoEmRisco";
import vrTimeline from "./vr-timeline.json";
import { Feminicidio } from "./Feminicidio";
import femTimeline from "./fem-timeline.json";

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
      <Composition id="VotoEmRisco" component={VotoEmRisco} durationInFrames={Math.round(vrTimeline.total * 30)} fps={30} width={1080} height={1920} />
      <Composition id="Feminicidio" component={Feminicidio} durationInFrames={Math.round(femTimeline.total * 30)} fps={30} width={1080} height={1920} />
      <Composition id="CapaFeminicidio" component={CapaFeminicidio} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Perfil" component={Perfil} durationInFrames={1} fps={30} width={1080} height={1080} />
    </>
  );
};
