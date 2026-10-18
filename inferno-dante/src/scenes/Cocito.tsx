import { noise2D } from "@remotion/noise";
import React, { useMemo } from "react";
import {
  Easing,
  Interactive,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Embers } from "../components/Embers";
import { Fog } from "../components/Fog";
import { RevealWords } from "../components/RevealWords";
import { cinzel, cormorant } from "../fonts";

const ICE_Y = 1150;
const FLAP_PERIOD = 90;

// Left wing, origin at the shoulder. The right wing is its mirror image.
const WING =
  "M 0 -10 C -50 -130 -110 -220 -170 -255 C -250 -300 -340 -330 -430 -330 " +
  "L -600 -150 Q -440 -110 -560 110 Q -400 40 -420 320 Q -300 160 -230 430 " +
  "Q -140 250 -20 260 Z";
const WING_BONES = [
  [-600, -150],
  [-560, 110],
  [-420, 320],
  [-230, 430],
];

// Chest-deep in the ice: neck, sloping trapezius, massive shoulders and arms.
const TORSO =
  "M 250 1160 L 262 1040 C 268 980 290 940 330 920 C 380 900 440 880 488 846 " +
  "L 500 796 L 580 796 L 592 846 C 640 880 700 900 750 920 " +
  "C 790 940 812 980 818 1040 L 830 1160 Z";
const TORSO_DETAIL =
  "M 334 958 C 330 1030 336 1100 344 1160 M 746 958 C 750 1030 744 1100 736 1160 " +
  "M 420 960 C 470 990 510 996 540 992 C 570 996 610 990 660 960";

// Three faces on one head: black on the left, red in front, pallid yellow on the right.
const HEADS =
  "M 540 590 C 580 592 606 626 606 668 C 606 706 594 738 574 764 C 562 782 552 796 540 806 " +
  "C 528 796 518 782 506 764 C 486 738 474 706 474 668 C 474 626 500 592 540 590 Z " +
  "M 476 676 C 446 672 418 690 412 718 C 406 746 414 772 432 790 C 446 802 466 808 484 800 C 488 760 488 716 476 676 Z " +
  "M 604 676 C 634 672 662 690 668 718 C 674 746 666 772 648 790 C 634 802 614 808 596 800 C 592 760 592 716 604 676 Z";
const HORNS =
  "M 516 612 C 492 556 466 512 418 488 C 456 526 474 568 496 630 Z " +
  "M 564 612 C 588 556 614 512 662 488 C 624 526 606 568 584 630 Z " +
  "M 430 702 C 398 664 370 644 338 640 C 368 662 386 684 412 720 Z " +
  "M 650 702 C 682 664 710 644 742 640 C 712 662 694 684 668 720 Z";

type EyePairProps = {
  readonly cx: number;
  readonly cy: number;
  readonly gap: number;
  readonly size: number;
  readonly color: string;
  readonly openAt: number;
};

const EyePair: React.FC<EyePairProps> = ({ cx, cy, gap, size, color, openAt }) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [openAt, openAt + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const flare = interpolate(frame, [openAt, openAt + 6, openAt + 40], [0, 1.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: cx + (side * gap) / 2 - size / 2,
            top: cy - size / 5,
            width: size,
            height: (size * 2) / 5,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 50%, #ffffff 0%, ${color} 45%, rgba(0,0,0,0) 75%)`,
            boxShadow: `0 0 ${size * 1.4 * flare}px ${size * 0.4 * flare}px ${color}`,
            rotate: `${side * -14}deg`,
            scale: `1 ${open}`,
            opacity: open > 0.02 ? 1 : 0,
          }}
        />
      ))}
    </>
  );
};

type Crack = { d: string; length: number; delay: number; width: number };

// Jagged fractures racing across the frozen lake toward the viewer.
const useCracks = (): Crack[] =>
  useMemo(() => {
    const cracks: Crack[] = [];
    for (let i = 0; i < 11; i++) {
      let x = 540 + (random(`crack-x-${i}`) - 0.5) * 300;
      let y = ICE_Y + 8;
      let angle = Math.PI / 2 + (random(`crack-a-${i}`) - 0.5) * 2.6;
      const points = [`M ${x} ${y}`];
      let length = 0;
      const steps = 5 + Math.floor(random(`crack-n-${i}`) * 6);
      for (let j = 0; j < steps; j++) {
        // Ice splits in straight runs with sudden angular turns.
        angle += (random(`crack-j-${i}-${j}`) - 0.5) * 0.7;
        // Perspective: segments grow as the crack comes closer.
        const seg = 20 + (y - ICE_Y) * 0.16 + random(`crack-l-${i}-${j}`) * 30;
        const nx = x + Math.cos(angle) * seg;
        const ny = Math.max(ICE_Y + 4, y + Math.abs(Math.sin(angle)) * seg);
        length += Math.hypot(nx - x, ny - y);
        x = nx;
        y = ny;
        points.push(`L ${x} ${y}`);
      }
      cracks.push({
        d: points.join(" "),
        length,
        delay: random(`crack-d-${i}`) * 26,
        width: 0.8 + random(`crack-w-${i}`) * 1.6,
      });
    }
    return cracks;
  }, []);

// Souls sealed in the ice "like straws in glass".
const FROZEN_SOULS = [
  { x: 180, y: 1330, r: -30, s: 0.8 },
  { x: 880, y: 1290, r: 25, s: 0.7 },
  { x: 330, y: 1760, r: 70, s: 1.3 },
  { x: 760, y: 1700, r: -55, s: 1.2 },
  { x: 560, y: 1420, r: 10, s: 0.9 },
];

const CocitoInner: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cracks = useCracks();
  const flap = Math.sin((frame / FLAP_PERIOD) * Math.PI * 2);
  const rimLight = interpolate(frame, [0, 90], [0.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #010205 0%, #030812 30%, #081526 52%, #12273c 60%, #0a1828 61%, #050c16 80%, #020509 100%)",
        }}
      />

      <Interactive.Div
        name="Câmera"
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "540px 900px",
          scale: interpolate(frame, [0, durationInFrames], [1.0, 1.1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        <Fog
          id="cocito-mist-back"
          seed={44}
          rgb={[0.45, 0.65, 0.8]}
          density={0.9}
          speedX={-0.6}
          opacity={0.35}
          top={300}
          height={900}
          mask="linear-gradient(180deg, transparent 0%, black 50%, black 80%, transparent 100%)"
        />

        {/* Lucifer, emperor of the woeful realm, frozen to the chest */}
        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          <defs>
            <filter id="cocito-rim" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {[
            { key: "left", x: 410, mirror: 1 },
            { key: "right", x: 670, mirror: -1 },
          ].map((wing) => (
            <g
              key={wing.key}
              transform={`translate(${wing.x} 905) scale(${wing.mirror} 1) rotate(${16 + flap * 11}) scale(0.82 ${0.82 + flap * 0.05})`}
            >
              <path d={WING} fill="none" stroke="#6fd0ff" strokeWidth={10} opacity={0.35 * rimLight} filter="url(#cocito-rim)" />
              <path d={WING} fill="#010205" />
              {WING_BONES.map(([bx, by]) => (
                <path
                  key={`${bx}`}
                  d={`M -430 -340 Q ${(bx - 430) / 2 + 10} ${(by - 340) / 2 - 10} ${bx} ${by}`}
                  fill="none"
                  stroke="#2a4a62"
                  strokeWidth={5}
                  opacity={0.7 * rimLight}
                />
              ))}
              <path d={WING} fill="none" stroke="#a9e4ff" strokeWidth={1.6} opacity={0.4 * rimLight} />
            </g>
          ))}
          <path d={`${TORSO} ${HEADS}`} fill="none" stroke="#6fd0ff" strokeWidth={12} opacity={0.3 * rimLight} filter="url(#cocito-rim)" />
          <path d={HORNS} fill="#010205" stroke="#7fd4ff" strokeWidth={1.4} strokeOpacity={0.35 * rimLight} />
          <path d={TORSO} fill="#010205" />
          <path d={TORSO_DETAIL} fill="none" stroke="#5fb8e6" strokeWidth={2} opacity={0.22 * rimLight} />
          <path d={HEADS} fill="#010205" />
          <path d={`${TORSO} ${HEADS}`} fill="none" stroke="#a9e4ff" strokeWidth={1.6} opacity={0.35 * rimLight} />
        </svg>

        {/* Six eyes open, one face after another */}
        <EyePair cx={446} cy={736} gap={30} size={18} color="#b9a8ff" openAt={55} />
        <EyePair cx={634} cy={736} gap={30} size={18} color="#f2e39a" openAt={78} />
        <EyePair cx={540} cy={688} gap={50} size={30} color="#ff2a1a" openAt={105} />

        {/* The frozen lake */}
        <div
          style={{
            position: "absolute",
            left: -100,
            right: -100,
            top: ICE_Y,
            height: 900,
            background:
              "linear-gradient(180deg, #2a4e6a 0%, #11273b 6%, #081624 30%, #03080e 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: ICE_Y - 30,
            height: 160,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(160, 220, 255, 0.35) 0%, rgba(0,0,0,0) 70%)",
            mixBlendMode: "screen",
          }}
        />
        {FROZEN_SOULS.map((soul, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: soul.x - 40 * soul.s,
              top: soul.y - 90 * soul.s,
              width: 80 * soul.s,
              height: 180 * soul.s,
              rotate: `${soul.r}deg`,
              filter: `blur(${3 * soul.s}px)`,
              opacity: 0.22 + 0.06 * noise2D("soul", i, frame * 0.02),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "30%",
                top: 0,
                width: "40%",
                height: "22%",
                borderRadius: "50%",
                background: "#8cc4e6",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "18%",
                top: "24%",
                width: "64%",
                height: "76%",
                borderRadius: "45% 45% 30% 30%",
                background: "#8cc4e6",
              }}
            />
          </div>
        ))}
        <Fog
          id="cocito-ice-texture"
          seed={9}
          rgb={[0.6, 0.85, 1]}
          density={0.8}
          scale={0.35}
          speedX={0}
          opacity={0.18}
          top={ICE_Y}
          height={770}
          blendMode="screen"
        />
        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <defs>
            <filter id="cocito-crack-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          {cracks.map((c, i) => {
            const grow = interpolate(frame, [c.delay, c.delay + 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            });
            return (
              <g key={i}>
                <path
                  d={c.d}
                  fill="none"
                  stroke="#7fd8ff"
                  strokeWidth={c.width * 3}
                  strokeDasharray={c.length}
                  strokeDashoffset={c.length * (1 - grow)}
                  opacity={0.4}
                  filter="url(#cocito-crack-glow)"
                />
                <path
                  d={c.d}
                  fill="none"
                  stroke="#d8f3ff"
                  strokeOpacity={0.8}
                  strokeWidth={c.width}
                  strokeDasharray={c.length}
                  strokeDashoffset={c.length * (1 - grow)}
                  strokeLinejoin="bevel"
                />
              </g>
            );
          })}
        </svg>
      </Interactive.Div>

      {/* The wind of his wings, freezing everything */}
      <Embers
        seed="cocito-snow"
        count={130}
        color="rgba(190, 230, 255, 0.85)"
        coreColor="#ffffff"
        minSize={2}
        maxSize={7}
        speed={-1.6}
        drift={60}
        wind={5 + 3 * flap}
      />
      <Fog
        id="cocito-mist-front"
        seed={52}
        rgb={[0.6, 0.8, 0.95]}
        density={0.8}
        speedX={2.2}
        opacity={0.25}
        top={1000}
        height={600}
        mask="linear-gradient(180deg, transparent 0%, black 40%, black 60%, transparent 100%)"
      />

      {/* Frost creeping in from the edges of the frame */}
      <Interactive.Div
        name="Geada"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 72% 58% at 50% 55%, rgba(200,235,255,0) 60%, rgba(180,225,255,0.16) 85%, rgba(230,248,255,0.4) 100%)",
          opacity: interpolate(frame, [0, durationInFrames], [0.3, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1360,
          height: 560,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(1,4,10,0.75) 35%, rgba(1,4,10,0.85) 100%)",
        }}
      />
      <Interactive.Div
        name="Canto XXXIV"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1450,
          textAlign: "center",
          fontFamily: cinzel,
          fontWeight: 600,
          fontSize: 40,
          letterSpacing: "0.5em",
          color: "#7fc8ee",
          opacity: interpolate(frame, [115, 140], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        CANTO XXXIV
      </Interactive.Div>
      <RevealWords
        name="Verso italiano"
        text="Lo 'mperador del doloroso regno"
        delay={128}
        stagger={6}
        glowColor="rgba(120, 200, 255, 0.55)"
        style={{
          top: 1520,
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: 66,
          color: "#eaf6ff",
        }}
      />
      <RevealWords
        name="Tradução"
        text="O imperador do reino doloroso"
        delay={170}
        stagger={4}
        glowColor="rgba(0, 0, 0, 0)"
        style={{
          top: 1612,
          fontFamily: cormorant,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 46,
          color: "#8fb2c8",
        }}
      />
    </>
  );
};

export const Cocito = Interactive.create({
  Component: CocitoInner,
  layout: "absolute-fill",
});
