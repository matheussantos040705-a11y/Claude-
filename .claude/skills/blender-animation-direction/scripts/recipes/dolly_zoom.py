"""
dolly_zoom — the Vertigo effect.

Hold the subject at constant screen size while camera distance changes, so the
background perspective transforms underneath it.

    q*s = f*H/D   ->   f/D = constant   ->   f2 = f1 * (D2/D1)

Background at L behind the subject scales as R = D/(D+L):

    dolly OUT + zoom IN   ->  D grows, background GROWS and crowds the subject
    dolly IN  + zoom OUT  ->  D shrinks, background SHRINKS and stretches away

Two implementations here. KEYED samples the curve per frame and bakes it — robust,
renders anywhere, and you can hand-edit the result. DRIVER computes the lens live
from the dolly's position, so retiming the dolly automatically retimes the lens.

Run:
    blender -b scene.blend -P dolly_zoom.py
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
DURATION_S = 3.0

MODE = "KEYED"               # KEYED or DRIVER

LENS_START = 24.0            # wide and close
DISTANCE_START = 1.2         # metres
DISTANCE_END = 3.0           # dolly out -> background crowds in

FSTOP = al.FSTOP["premium_shallow"]

LENS_MIN, LENS_MAX = 14.0, 200.0   # clamp so the driver cannot produce nonsense


def build():
    scene = al.setup_scene(fps=FPS, start=1, duration_s=DURATION_S)

    subject = bpy.data.objects.get(SUBJECT_NAME)
    if subject is None:
        raise ValueError("no object named %r" % SUBJECT_NAME)

    center = al.visual_center(subject)
    height = al.subject_height(subject)

    rig = al.camera_rig("CAM", scene=scene,
                        location=(0.0, -DISTANCE_START, center.z),
                        lens=LENS_START, fstop=FSTOP)

    # The lock plane is the hero face, not the object origin. The formula holds
    # exactly one plane; anything with real depth still shifts slightly around it.
    rig["aim"].location = center
    rig["focus"].location = (center.x, center.y - height * 0.25, center.z)

    lens_end = al.dolly_zoom_lens(LENS_START, DISTANCE_START, DISTANCE_END)

    f_start = scene.frame_start
    f_end = al.sec(DURATION_S, scene)

    if MODE == "KEYED":
        final = al.dolly_zoom(rig["camera"], rig["dolly"], f_start, f_end,
                              DISTANCE_START, DISTANCE_END, LENS_START,
                              axis=1, scene=scene)
        print("dolly_zoom KEYED: %.0f mm @ %.2fm -> %.1f mm @ %.2fm"
              % (LENS_START, DISTANCE_START, final, DISTANCE_END))

    elif MODE == "DRIVER":
        # Dolly moves; the lens follows from its position automatically.
        al.ease_move(rig["dolly"], "location", f_start, f_end,
                     -DISTANCE_START, -DISTANCE_END, index=1,
                     profile="camera", group="Dolly")

        cam_data = rig["camera"].data
        fc = cam_data.driver_add("lens")
        drv = fc.driver
        drv.type = "SCRIPTED"

        # LOC_DIFF gives the camera-to-target distance directly, which is cleaner
        # than reading a single transform channel when the rig is off-axis.
        var = drv.variables.new()
        var.name = "d"
        var.type = "LOC_DIFF"
        var.targets[0].id = rig["dolly"]
        var.targets[1].id = rig["aim"]

        drv.expression = "max(%f, min(%f, %f * (d / %f)))" % (
            LENS_MIN, LENS_MAX, LENS_START, DISTANCE_START
        )
        print("dolly_zoom DRIVER: lens = %.0f * (d / %.2f), clamped [%.0f, %.0f]"
              % (LENS_START, DISTANCE_START, LENS_MIN, LENS_MAX))
    else:
        raise ValueError("MODE must be KEYED or DRIVER")

    # What the background actually does — the reason for the shot.
    for label, offset in (("near bg", 1.0), ("far bg", 5.0)):
        r0 = al.background_ratio(DISTANCE_START, offset)
        r1 = al.background_ratio(DISTANCE_END, offset)
        print("  %s at +%.1fm: apparent size %.3f -> %.3f (%+.0f%%)"
              % (label, offset, r0, r1, (r1 / r0 - 1.0) * 100.0))

    print("  verify in SCREEN SPACE, not by trusting world distance")
    return rig


if __name__ == "__main__":
    build()
