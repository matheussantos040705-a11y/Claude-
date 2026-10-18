import { Composition, Folder } from "remotion";
import { EndTitle } from "./edit/EndTitle";
import { Inscription } from "./edit/Inscription";
import { Shot } from "./edit/Shot";
import { SlamWord } from "./edit/SlamWord";
import { InfernoEdit } from "./InfernoEdit";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Inferno"
        component={InfernoEdit}
        durationInFrames={1695}
        fps={30}
        width={1080}
        height={1920}
      />
      <Folder name="Elementos">
        <Composition
          id="Shot"
          component={Shot}
          durationInFrames={48}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            plate: "caronte",
            tone: "fire",
            focusX: 0.5,
            focusY: 0.42,
            punch: 0.3,
            flash: 1,
            shake: 26,
            split: 16,
            style: { backgroundColor: "#000000" },
          }}
        />
        <Composition
          id="Inscription"
          component={Inscription}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            verse: "PER ME SI VA\nNE LA CITTÀ DOLENTE",
            translation: "por mim se vai à cidade dolente",
            style: { backgroundColor: "#000000" },
          }}
        />
        <Composition
          id="SlamWord"
          component={SlamWord}
          durationInFrames={24}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            word: "SPERANZA",
            size: 170,
            style: { backgroundColor: "#000000" },
          }}
        />
        <Composition
          id="EndTitle"
          component={EndTitle}
          durationInFrames={120}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ style: { backgroundColor: "#000000" } }}
        />
      </Folder>
    </>
  );
};
