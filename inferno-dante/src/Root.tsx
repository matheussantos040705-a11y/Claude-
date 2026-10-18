import { Composition, Folder } from "remotion";
import { Inferno } from "./Inferno";
import { Cocito } from "./scenes/Cocito";
import { CircleLabel, Descida } from "./scenes/Descida";
import { Estrelas } from "./scenes/Estrelas";
import { Porta } from "./scenes/Porta";
import { SelvaOscura } from "./scenes/SelvaOscura";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Inferno"
        component={Inferno}
        durationInFrames={1516}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Cenas">
        <Composition
          id="SelvaOscura"
          component={SelvaOscura}
          durationInFrames={240}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
        <Composition
          id="Porta"
          component={Porta}
          durationInFrames={270}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
        <Composition
          id="Descida"
          component={Descida}
          durationInFrames={540}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
        <Composition
          id="Cocito"
          component={Cocito}
          durationInFrames={270}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
        <Composition
          id="Estrelas"
          component={Estrelas}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
      </Folder>
      <Folder name="Elementos">
        <Composition
          id="CircleLabel"
          component={CircleLabel}
          durationInFrames={60}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            numeral: "VII",
            title: "VIOLÊNCIA",
            description: "no rio de sangue fervente",
            color: "#ff2433",
            style: { backgroundColor: "#050203" },
          }}
        />
      </Folder>
    </>
  );
};
