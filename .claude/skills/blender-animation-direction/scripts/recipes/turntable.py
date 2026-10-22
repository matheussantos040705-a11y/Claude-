"""
turntable — seam-free looping rotation.

Linear interpolation, linear extrapolation. Any easing inside a loop creates a
visible pulse at the seam.

The seam: key frame N+1 at 360 deg and render frames 1..N. Keying frame N at 360
duplicates a perceptually identical frame, which is the one-frame hitch you see on
every repeat. ``al.turntable`` returns the correct last render frame.

Speeds (references/camera-moves.md):
    360 deg over 12 s = 30 deg/s   slow, catalog
    360 deg over  8 s = 45 deg/s   energetic

For a beauty film do NOT use a full revolution — show 30-120 deg. A mandatory 360
is a catalog convention, not a cinematic one. Set PARTIAL_DEGREES for that.

Run:
    blender -b scene.blend -P turntable.py
    blender -b scene.blend -P turntable.py -o //render/tt_ -a
"""

import math
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import bpy
import anim_lib as al


# --- configure -------------------------------------------------------------

SUBJECT_NAME = "Product"
FPS = 24
DURATION_S = 12.0            # 360 deg / 12 s = 30 deg/s

ROTATE_CAMERA = False        # False: spin the product. True: orbit the camera.
PARTIAL_DEGREES = None       # e.g. 90.0 for a beauty segment; None = full 360 loop

LENS_MM = 85.0
FSTOP = al.FSTOP["packshot"]  # f/9 — a catalog turntable wants the whole product sharp
FILL = 0.68                   # fraction of frame height


def build():
    scene = al.setup_scene(fps=FPS, start=1, duration_s=DURATION_S)

    subject = bpy.data.objects.get(SUBJECT_NAME)
    if subject is None:
        raise ValueError("no object named %r" % SUBJECT_NAME)

    height = al.subject_height(subject)
    center = al.visual_center(subject)
    distance = al.distance_for_framing(height, LENS_MM, fill=FILL)

    rig = al.camera_rig("CAM", scene=scene,
                        location=(0.0, -distance, center.z),
                        lens=LENS_MM, fstop=FSTOP)
    rig["aim"].location = center
    rig["focus"].location = (center.x, center.y - height * 0.2, center.z)

    if ROTATE_CAMERA:
        pivot = al.new_empty("CAM_Pivot", location=center, scene=scene,
                             display_size=0.5)
        rig["dolly"].parent = pivot
        rig["dolly"].location = (0.0, -distance, 0.0)
        spinner = pivot
    else:
        spinner = subject

    if PARTIAL_DEGREES is None:
        last = al.turntable(spinner, scene.frame_start, revolutions=1.0,
                            duration_s=DURATION_S, scene=scene)
        scene.frame_end = int(last)
        print("turntable: 360 deg over %.1fs = %.1f deg/s, render frames %d-%d"
              % (DURATION_S, 360.0 / DURATION_S, scene.frame_start, scene.frame_end))
    else:
        # A partial reveal is a finite move, so it eases like one.
        al.orbit(spinner, scene.frame_start,
                 al.sec(DURATION_S, scene), PARTIAL_DEGREES,
                 profile="camera", scene=scene)
        print("turntable: %.0f deg over %.1fs = %.1f deg/s (eased, non-looping)"
              % (PARTIAL_DEGREES, DURATION_S, PARTIAL_DEGREES / DURATION_S))

    print("  lens %.0f mm, f/%.1f, distance %.3f, %s rotating"
          % (LENS_MM, FSTOP, distance, "camera" if ROTATE_CAMERA else "product"))
    return rig


if __name__ == "__main__":
    build()
