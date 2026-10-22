"""
hero_reveal — the standard 15-second product film.

Beat structure (references/cinematography.md section 7):

    0.0 - 1.5    macro hook, parallax slide
    1.5 - 4.0    45 deg reveal arc at 18 deg/s
    4.0 - 6.0    detail insert with a 1 s rack focus
    6.0 - 8.0    second feature beat
    8.0 - 11.5   25 deg orbit at 7 deg/s plus a 20% dolly-in
    11.5 - 12.5  product finishes rotating; camera settles first, focus lands second
    12.5 - 15.0  symmetrical hero hold

The arrivals are deliberately staggered. If camera, product, focus and highlight all
resolve on the same frame the shot reads as procedural — see SKILL.md section 8.

Run:
    blender -b scene.blend -P hero_reveal.py
    blender -b scene.blend -P hero_reveal.py -o //render/frame_ -a
"""

import math
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import bpy
import anim_lib as al


# --- configure -------------------------------------------------------------

SUBJECT_NAME = "Product"     # the object being sold
FPS = 24
DURATION_S = 15.0

LENS_MM = 85.0               # primary beauty packshot lens
FSTOP = al.FSTOP["beauty"]   # f/4.5

ARC_DEGREES = 45.0           # beat 2: reveal arc
ORBIT_DEGREES = 25.0         # beat 5: build into hero
PUSH_IN_FRACTION = 0.20      # beat 5: 20% closer
PRODUCT_ROTATION = 10.0      # beat 6: product settles into its best angle


def build():
    scene = al.setup_scene(fps=FPS, start=1, duration_s=DURATION_S)

    subject = bpy.data.objects.get(SUBJECT_NAME)
    if subject is None:
        raise ValueError(
            "no object named %r — set SUBJECT_NAME to the product in your scene"
            % SUBJECT_NAME
        )

    height = al.subject_height(subject)
    center = al.visual_center(subject)

    # Distance is chosen for the depth ratios, then the lens frames it.
    # Start wider than the hero so the push-in has somewhere to go.
    d_start, d_hero = al.push_in_target(height, LENS_MM, start_fill=0.55,
                                        end_fill=al.HERO_FRAME_HEIGHT)
    d_arc = d_start * (1.0 - PUSH_IN_FRACTION * 0.5)

    rig = al.camera_rig("CAM", scene=scene,
                        location=(0.0, -d_start, center.z),
                        lens=LENS_MM, fstop=FSTOP)

    # Orbit pivot at the product's visual centre, not its mesh origin —
    # otherwise the product swings rather than turns.
    pivot = al.new_empty("CAM_Pivot", location=center, scene=scene, display_size=0.5)
    rig["dolly"].parent = pivot
    rig["dolly"].location = (0.0, -d_start, 0.0)

    # Aim at the visual centre; focus on the hero face, nearer the camera.
    rig["aim"].location = center
    rig["focus"].location = (center.x, center.y - height * 0.25, center.z)

    f = lambda s: al.sec(s, scene)

    # --- beat 1: hook, 0.0-1.5 s -----------------------------------------
    # A 0.8 s parallax slide. Lateral travel, so depth planes separate.
    al.key_many(
        rig["dolly"], "location",
        [(f(0.0), -height * 0.9), (f(0.8), 0.0)],
        index=0, interp="BEZIER", easing="EASE_IN_OUT", group="Dolly",
    )
    al.key(rig["dolly"], "location", f(1.5), 0.0, index=0, group="Dolly")

    # --- beat 2: reveal arc, 1.5-4.0 s ------------------------------------
    # 45 deg over 2.5 s = 18 deg/s. Ends 6-12 frames before the beat boundary
    # so the image can settle before the next move begins.
    al.orbit(pivot, f(1.5), f(4.0) - 8, ARC_DEGREES, start_deg=-ARC_DEGREES,
             profile="camera", scene=scene)

    # A 5-15 deg vertical component keeps it from reading as a lathe.
    al.ease_move(pivot, "rotation_euler", f(1.5), f(4.0) - 8,
                 math.radians(-6.0), math.radians(0.0),
                 index=0, profile="camera", group="Orbit")

    # Slight close during the arc.
    al.ease_move(rig["dolly"], "location", f(1.5), f(4.0),
                 -d_start, -d_arc, index=1, profile="camera", group="Dolly")

    # --- beat 3: detail insert, 4.0-6.0 s ---------------------------------
    # 1 s rack focus onto a detail, then back. Hold each endpoint 10 frames.
    detail = al.new_empty("FOCUS_Detail",
                          location=(center.x, center.y - height * 0.35,
                                    center.z + height * 0.25),
                          scene=scene, display_type="SPHERE", display_size=0.08)
    hero_face = al.new_empty("FOCUS_Hero",
                             location=(center.x, center.y - height * 0.25, center.z),
                             scene=scene, display_type="SPHERE", display_size=0.08)

    al.rack_focus(rig["camera"], f(4.2), f(5.2), hero_face, detail,
                  hold_frames=10, scene=scene)

    # --- beat 4: second feature, 6.0-8.0 s --------------------------------
    al.rack_focus(rig["camera"], f(6.2), f(7.2), detail, hero_face,
                  hold_frames=10, scene=scene)

    # --- beat 5: build into hero, 8.0-11.5 s ------------------------------
    # 25 deg over 3.5 s = 7 deg/s, plus a 20% dolly-in.
    # Two curves on two parameters, not one blended motion.
    al.orbit(pivot, f(8.0), f(11.5), ORBIT_DEGREES, start_deg=0.0,
             profile="camera", scene=scene)

    # The push has a longer tail than the orbit, so the camera is still barely
    # closing when the rotation has stopped. That overlap is what makes the
    # arrival feel authored rather than computed.
    al.ease_move(rig["dolly"], "location", f(8.0), f(12.0),
                 -d_arc, -d_hero, index=1, profile="camera", group="Dolly")

    # --- beat 6: hero arrival, 11.5-12.5 s --------------------------------
    # Product finishes its rotation AFTER the camera has stopped orbiting.
    al.ease_move(subject, "rotation_euler", f(10.5), f(12.2),
                 subject.rotation_euler.z,
                 subject.rotation_euler.z + math.radians(PRODUCT_ROTATION),
                 index=2, profile="product", group="Product")

    # Focus lands last of all.
    al.rack_focus(rig["camera"], f(11.8), f(12.5), detail, hero_face,
                  hold_frames=6, scene=scene)

    # --- beat 7: hero hold, 12.5-15.0 s -----------------------------------
    # 2.5 s of near-stillness. This is what the whole move was for.
    al.settle(pivot, "rotation_euler", f(12.5),
              math.radians(-ARC_DEGREES + ARC_DEGREES + ORBIT_DEGREES),
              index=2, hold_s=2.5, scene=scene)
    al.settle(rig["dolly"], "location", f(12.5), -d_hero,
              index=1, hold_s=2.5, scene=scene)

    print("hero_reveal: %.1fs at %d fps (frames %d-%d)"
          % (DURATION_S, FPS, scene.frame_start, scene.frame_end))
    print("  lens %.0f mm, f/%.1f, hero distance %.3f" % (LENS_MM, FSTOP, d_hero))
    print("  subject height %.3f, visual centre z %.3f" % (height, center.z))
    return rig


if __name__ == "__main__":
    build()
