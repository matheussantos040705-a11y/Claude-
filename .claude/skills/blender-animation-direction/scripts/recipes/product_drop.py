"""
product_drop — a physically correct fall, impact and settle.

The fall is SAMPLED from the real parabola, not eased between two keys. Constant
acceleration gives per-frame distances in the ratio 1 : 3 : 5 : 7 : 9; a symmetric
Bezier ease does not, and that mismatch is what reads as "floaty".

    t = sqrt(2h/g)      0.25 m = 5 fr    1 m = 11 fr    2 m = 15 fr   (24 fps)

Mass does NOT change fall time. Do not slow a light object down — that is the most
common weight error in product animation. Weight is expressed in what happens at
the CONTACT: compression depth, recovery speed and settle frequency.

Impact pattern (references/motion-principles.md section 3):

    C-1        pre-contact
    C          contact
    C+1..C+3   maximum compression
    C+4..C+8   first recovery
    C+8..C+16  residual settle

Rigid shells stay at scale (1,1,1). If your product genuinely has a compliant part
(rubber foot, seal, suspension), name it in SQUASH_PART and it takes the
compression. Otherwise the shell just stops and only the ATTACHMENT overshoots.

Run:
    blender -b scene.blend -P product_drop.py
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

DROP_HEIGHT = 0.5            # metres above the landing plane
GROUND_Z = 0.0
WEIGHT = "prop"              # snappy | prop | heavy  — drives the settle, not the fall

SQUASH_PART = None           # name of a compliant part, or None for a rigid stop
SQUASH_AMOUNT = 0.12         # fraction of its height at max compression

ATTACHMENT = None            # name of a cable/lid/flap that follows through
ATTACHMENT_DELAY = "soft_accessory"   # key into al.FOLLOW_DELAY_24

LENS_MM = 50.0
FSTOP = al.FSTOP["beauty"]

SHUTTER_ANGLE = 180.0        # crisp enough to read the contact; 90-144 for detail


def build():
    scene = al.setup_scene(fps=FPS, start=1, end=120)

    subject = bpy.data.objects.get(SUBJECT_NAME)
    if subject is None:
        raise ValueError("no object named %r" % SUBJECT_NAME)

    height = al.subject_height(subject)
    center = al.visual_center(subject)

    # --- the fall ---------------------------------------------------------
    f_release = scene.frame_start + 6      # a beat of stillness before it lets go
    landing = al.key_ballistic(subject, "location", f_release,
                               DROP_HEIGHT, ground=GROUND_Z, index=2, scene=scene)

    t_fall = al.fall_time(DROP_HEIGHT)
    v_impact = al.fall_speed(DROP_HEIGHT)

    # --- the impact -------------------------------------------------------
    # Contact frame is where the physics put it, not where it would be convenient.
    C = landing
    over_f, under_f, offsets = al.OVERSHOOT[WEIGHT]
    _, compress_f, recover_f, settle_f = [
        al.scale_frames_24(n, scene) for n in offsets
    ]

    if SQUASH_PART:
        part = bpy.data.objects.get(SQUASH_PART)
        if part is None:
            raise ValueError("no object named %r for SQUASH_PART" % SQUASH_PART)
        # Compression lives in the part that can actually deform. Volume is
        # roughly preserved: squash Z, spread X and Y.
        sz = part.scale.z
        sx = part.scale.x
        squashed = sz * (1.0 - SQUASH_AMOUNT)
        spread = sx * (1.0 + SQUASH_AMOUNT * 0.5)

        al.key_many(part, "scale",
                    [(C, sz), (C + 2, squashed), (C + 6, sz * 1.02), (C + 12, sz)],
                    index=2, interp="BEZIER", easing="AUTO", group="Squash")
        for i in (0, 1):
            al.key_many(part, "scale",
                        [(C, sx), (C + 2, spread), (C + 6, sx * 0.99), (C + 12, sx)],
                        index=i, interp="BEZIER", easing="AUTO", group="Squash")
    else:
        # Rigid product: it simply stops. A tiny structural settle only.
        # Heavier -> smaller overshoot, slower reversal, longer settle.
        bounce = height * 0.015 * (2.0 if WEIGHT == "snappy" else 1.0)
        al.key_many(
            subject, "location",
            [
                (C, GROUND_Z),
                (C + compress_f * 0.4, GROUND_Z + bounce),
                (C + recover_f * 0.6, GROUND_Z + bounce * 0.15),
                (C + settle_f, GROUND_Z),
            ],
            index=2, interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED",
            group="Settle",
        )

    # Break the handle at contact — an impact is a genuine corner in the curve,
    # not something to smooth over.
    fc = al.get_fcurve(subject, "location", index=2)
    for kp in fc.keyframe_points:
        if abs(kp.co[0] - C) < 0.5:
            kp.handle_left_type = "FREE"
            kp.handle_right_type = "FREE"
    fc.update()

    # --- follow-through ---------------------------------------------------
    if ATTACHMENT:
        att = bpy.data.objects.get(ATTACHMENT)
        if att is None:
            raise ValueError("no object named %r for ATTACHMENT" % ATTACHMENT)
        delay = al.FOLLOW_DELAY_24[ATTACHMENT_DELAY]
        # The follower is reduced, not cloned, and on a hard stop it PASSES the
        # driver rather than merely lagging it.
        al.follow_through(subject, att, "location", delay,
                          amplitude=0.55, index=2, scene=scene)

    # --- camera -----------------------------------------------------------
    distance = al.distance_for_framing(height, LENS_MM, fill=0.6)
    rig = al.camera_rig("CAM", scene=scene,
                        location=(0.0, -distance, center.z * 0.8),
                        lens=LENS_MM, fstop=FSTOP)
    rig["aim"].location = (center.x, center.y, GROUND_Z + height * 0.4)
    rig["focus"].location = (center.x, center.y - height * 0.2, GROUND_Z + height * 0.4)

    scene.render.motion_blur_shutter = SHUTTER_ANGLE / 360.0
    scene.frame_end = int(C + settle_f + al.frames(1.5, scene))

    print("product_drop: %.2f m fall" % DROP_HEIGHT)
    print("  fall time %.3fs = %.1f frames, impact %.2f m/s"
          % (t_fall, al.fall_frames(DROP_HEIGHT, scene), v_impact))
    print("  release f%d, contact f%.0f, settled f%.0f"
          % (f_release, C, C + settle_f))
    print("  weight %r, %s"
          % (WEIGHT, "compliant part compresses" if SQUASH_PART else "rigid stop"))
    print("  shutter %.0f deg = %.4fs exposure"
          % (SHUTTER_ANGLE, al.shutter_exposure(SHUTTER_ANGLE, scene)))

    # Prove the spacing rather than trusting it.
    rep = al.spacing_report(subject, f_release, C, scene)
    if len(rep) >= 4:
        first = rep[0][1] or 1e-9
        ratios = ["%.1f" % (d / first) for _, d in rep[:5]]
        print("  spacing ratios %s  (constant accel wants 1 3 5 7 9)"
              % " ".join(ratios))

    return rig


if __name__ == "__main__":
    build()
