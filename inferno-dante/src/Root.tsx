import { Composition, Folder } from "remotion";
import { EndLogo } from "./edit/EndLogo";
import { Quote } from "./edit/Quote";
import { Shot } from "./edit/Shot";
import { InfernoEdit } from "./InfernoEdit";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Inferno"
        component={InfernoEdit}
        durationInFrames={1024}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Elementos">
        <Composition
          id="Shot"
          component={Shot}
          durationInFrames={26}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            src: "shots/ugolino-rosto.jpg",
            tone: "statue",
            focusY: 0.45,
            style: { backgroundColor: "#000000" },
          }}
        />
        <Composition
          id="Quote"
          component={Quote}
          durationInFrames={84}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            text: "LASCIATE OGNE SPERANZA",
            style: { backgroundColor: "#f2f2f2" },
          }}
        />
        <Composition
          id="EndLogo"
          component={EndLogo}
          durationInFrames={102}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
      </Folder>
    </>
  );
};
