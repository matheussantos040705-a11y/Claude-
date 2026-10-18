import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React from "react";

type IceFlashProps = Record<string, never>;

// Fire freezes: a blinding cold flash hides the cut from flame to ice.
const IceFlashPresentation: React.FC<
  TransitionPresentationComponentProps<IceFlashProps>
> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === "exiting") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `saturate(${1 - presentationProgress}) brightness(${1 + presentationProgress * 1.5})`,
        }}
      >
        {children}
      </div>
    );
  }

  const appear = Math.min(1, Math.max(0, (presentationProgress - 0.4) / 0.25));
  const flash = Math.sin(presentationProgress * Math.PI);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, opacity: appear }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 55%, #ffffff 0%, #d8f4ff 40%, #8fd3ff 100%)",
          opacity: flash * 0.92,
        }}
      />
    </div>
  );
};

export const iceFlash = (): TransitionPresentation<IceFlashProps> => ({
  component: IceFlashPresentation,
  props: {},
});
