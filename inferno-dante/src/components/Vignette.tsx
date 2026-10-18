import React from "react";

type VignetteProps = {
  readonly strength?: number;
  readonly color?: string;
};

export const Vignette: React.FC<VignetteProps> = ({
  strength = 0.9,
  color = "0, 0, 0",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `radial-gradient(ellipse 75% 60% at 50% 50%, rgba(${color}, 0) 40%, rgba(${color}, ${strength * 0.55}) 75%, rgba(${color}, ${strength}) 100%)`,
      }}
    />
  );
};
