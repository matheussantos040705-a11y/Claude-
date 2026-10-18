import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import React from "react";

type EmberBurnProps = {
  /** Where the burn starts, as CSS position */
  readonly origin: string;
};

// The next scene burns through the previous one from a single point, its
// edge a ring of glowing embers.
const EmberBurnPresentation: React.FC<
  TransitionPresentationComponentProps<EmberBurnProps>
> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  if (presentationDirection === "exiting") {
    return <div style={{ position: "absolute", inset: 0 }}>{children}</div>;
  }

  const radius = presentationProgress * 135;
  const mask = `radial-gradient(circle at ${passedProps.origin}, black ${Math.max(0, radius - 9)}%, transparent ${radius}%)`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "screen",
          opacity: Math.sin(presentationProgress * Math.PI) * 1.2,
          background: `radial-gradient(circle at ${passedProps.origin}, rgba(0,0,0,0) ${Math.max(0, radius - 12)}%, rgba(255, 120, 30, 0.95) ${Math.max(0, radius - 4)}%, rgba(255, 230, 170, 1) ${Math.max(0, radius - 1)}%, rgba(0,0,0,0) ${radius + 4}%)`,
        }}
      />
    </div>
  );
};

export const emberBurn = (
  props: EmberBurnProps,
): TransitionPresentation<EmberBurnProps> => ({
  component: EmberBurnPresentation,
  props,
});
