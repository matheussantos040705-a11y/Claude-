"""
exploded_view — staggered assembly / disassembly.

The whole craft here is the STAGGER. Parts that all separate on the same frame read
as a single exploding blob; parts that leave in sequence read as a mechanism coming
apart, and the eye can follow each one.

Two orderings:

    OUTWARD   outermost part leaves first, working inward. Disassembly, teardown.
    INWARD    innermost first. Reads as the core being revealed.

Assembly (REVERSE = True) is not a mirrored explosion. Parts arrive with a settle,
and the LAST part to arrive gets the longest hold — that is the shot's hero moment.

Direction is derived from each part's offset from the assembly centre, so it works
on any model without hand-authoring vectors.

Run:
    blender -b scene.blend -P exploded_view.py
"""

import math
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import bpy
from mathutils import Vector
import anim_lib as al


# --- configure -------------------------------------------------------------

PART_NAMES = []              # explicit list, or leave empty and use COLLECTION
COLLECTION = "Parts"         # every mesh in this collection becomes a part

FPS = 24
EXPLODE_DISTANCE = 1.8       # multiplier on each part's offset from centre
MOVE_DURATION_S = 1.2        # per part
STAGGER_FRAMES = 5           # 3-8 is the readable range
ORDER = "OUTWARD"            # OUTWARD | INWARD
REVERSE = False              # True = assemble instead of explode

ROTATE_PARTS = 8.0           # degrees of secondary tumble; 0 to disable

LENS_MM = 35.0               # wider than a packshot — exploded views need space
FSTOP = al.FSTOP["environmental"]


def collect_parts(scene):
    if PART_NAMES:
        parts = [bpy.data.objects[n] for n in PART_NAMES]
    else:
        coll = bpy.data.collections.get(COLLECTION)
        if coll is None:
            raise ValueError(
                "no collection %r and PART_NAMES is empty" % COLLECTION
            )
        parts = [o for o in coll.objects if o.type == "MESH"]
    if not parts:
        raise ValueError("no parts found")
    return parts


def build():
    scene = al.setup_scene(fps=FPS, start=1, end=240)
    parts = collect_parts(scene)

    # Assembly centre and each part's outward vector.
    origin = Vector((0.0, 0.0, 0.0))
    for p in parts:
        origin += p.matrix_world.translation
    origin /= len(parts)

    entries = []
    for p in parts:
        home = p.matrix_world.translation.copy()
        offset = home - origin
        if offset.length < 1e-6:
            # A part sitting exactly at the centre has no natural direction;
            # send it up so it does not sit inside everything else.
            offset = Vector((0.0, 0.0, 1.0)) * 0.1
        entries.append({
            "obj": p,
            "home": home,
            "out": home + offset * EXPLODE_DISTANCE,
            "radius": offset.length,
        })

    entries.sort(key=lambda e: e["radius"], reverse=(ORDER == "OUTWARD"))

    move_f = al.frames(MOVE_DURATION_S, scene)
    last_frame = scene.frame_start

    for i, e in enumerate(entries):
        obj = e["obj"]
        f0 = al.stagger(scene.frame_start + 4, i, STAGGER_FRAMES, scene)
        f1 = f0 + move_f

        a, b = (e["out"], e["home"]) if REVERSE else (e["home"], e["out"])

        for axis in range(3):
            if REVERSE:
                # Arriving parts settle: they overshoot the seated position
                # slightly and come back. Heavier parts overshoot less.
                kind = "heavy" if e["radius"] > 0.5 else "prop"
                al.overshoot(obj, "location", f0, a[axis], b[axis],
                             index=axis, kind=kind, scene=scene, group="Assemble")
            else:
                # Leaving parts accelerate away and decelerate to a stop —
                # they are not thrown, they are lifted clear.
                al.ease_move(obj, "location", f0, f1, a[axis], b[axis],
                             index=axis, profile="camera", group="Explode")

        # Secondary tumble. Lower amplitude than the primary translation so it
        # supports rather than competes.
        if ROTATE_PARTS:
            sign = 1.0 if i % 2 == 0 else -1.0
            base = obj.rotation_euler.z
            target = base + math.radians(ROTATE_PARTS) * sign
            al.ease_move(obj, "rotation_euler",
                         f0 + al.scale_frames_24(2, scene), f1,
                         target if REVERSE else base,
                         base if REVERSE else target,
                         index=2, profile="camera", group="Tumble")

        last_frame = max(last_frame, f1)

    # The final arrival holds. In an assembly this is the hero moment; in an
    # explosion it is the readable diagram the viewer needs time to scan.
    hold_end = last_frame + al.frames(2.0, scene)
    for e in entries:
        end_pos = e["home"] if REVERSE else e["out"]
        for axis in range(3):
            al.key(e["obj"], "location", hold_end, end_pos[axis],
                   index=axis, group="Hold")

    # --- camera -----------------------------------------------------------
    spread = max(e["radius"] for e in entries) * EXPLODE_DISTANCE * 2.2
    distance = al.distance_for_framing(max(spread, 0.1), LENS_MM, fill=0.75)

    rig = al.camera_rig("CAM", scene=scene,
                        location=(0.0, -distance, origin.z + spread * 0.25),
                        lens=LENS_MM, fstop=FSTOP)
    rig["aim"].location = origin
    rig["focus"].location = origin

    # A slow counter-orbit through the whole move gives the diagram depth
    # without stealing attention from the parts.
    pivot = al.new_empty("CAM_Pivot", location=origin, scene=scene, display_size=0.6)
    rig["dolly"].parent = pivot
    rig["dolly"].location = (0.0, -distance, spread * 0.25)
    al.orbit(pivot, scene.frame_start, hold_end, 20.0, start_deg=-10.0,
             profile="camera", scene=scene)

    scene.frame_end = int(hold_end)

    print("exploded_view: %d parts, %s, %s"
          % (len(entries), ORDER, "ASSEMBLE" if REVERSE else "EXPLODE"))
    print("  stagger %d fr, move %.1fs, total %d frames"
          % (STAGGER_FRAMES, MOVE_DURATION_S, scene.frame_end))
    print("  spread %.3f, lens %.0f mm, distance %.3f" % (spread, LENS_MM, distance))
    print("  order: " + " -> ".join(e["obj"].name for e in entries[:6])
          + (" ..." if len(entries) > 6 else ""))
    return rig


if __name__ == "__main__":
    build()