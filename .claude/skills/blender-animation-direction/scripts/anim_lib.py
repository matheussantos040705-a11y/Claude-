"""
anim_lib — shared core for cinematographic animation in Blender.

Target: Blender 4.2 LTS and up. Uses the classic ``action.fcurves.new()`` path, which
still works in 5.x; the slotted-Action API is deliberately avoided because it breaks
on 4.2.

Headless-safe: every function uses ``bpy.data`` and explicit objects. Nothing here
reads ``bpy.context`` or calls ``bpy.ops``, so the same code runs in the Text Editor
and under ``blender -b scene.blend -P script.py``.

Usage from a recipe living in scripts/recipes/::

    import sys, os
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    import anim_lib as al

The numeric constants below come from production practice and are documented in
../references/. Import them rather than retyping magic numbers.
"""

import math
import os
import sys

import bpy
from mathutils import Vector


# ---------------------------------------------------------------------------
# Constants — see ../references/camera-moves.md and motion-principles.md
# ---------------------------------------------------------------------------

GRAVITY = 9.81  # m/s^2

FULL_FRAME_SENSOR_WIDTH = 36.0  # mm
FULL_FRAME_SENSOR_HEIGHT = 24.0  # mm
FULL_FRAME_DIAGONAL = 43.27  # mm

#: Camera move speeds in degrees per second. See references/camera-moves.md.
ORBIT_SPEED = {
    "luxury": 12.0,      # 36 deg over 3.0 s
    "inspection": 8.0,
    "reveal": 24.0,      # 60 deg over 2.5 s
    "turntable_slow": 30.0,   # 360 deg over 12 s
    "turntable_fast": 45.0,   # 360 deg over 8 s
    "whip": 360.0,       # 120 deg over 8 frames
}

#: Aperture starting points by shot type. See references/cinematography.md.
FSTOP = {
    "packshot": 9.0,        # f/8-f/11
    "beauty": 4.5,          # f/4-f/5.6
    "premium_shallow": 3.2,  # f/2.8-f/4
    "macro": 8.0,           # f/5.6-f/11
    "rack_focus": 2.2,      # f/1.8-f/2.8
    "environmental": 5.6,   # f/4-f/8
}

#: Overshoot templates: (overshoot_factor, undershoot_factor, frames_at_24fps).
#: Frames are offsets from the start of the move: (start, over, under, settle).
OVERSHOOT = {
    "snappy": (1.08, 0.98, (0, 6, 9, 13)),
    "prop": (1.05, 0.985, (0, 12, 16, 22)),
    "heavy": (1.025, 0.995, (0, 16, 22, 32)),
    "camera": (1.01, 0.998, (0, 18, 23, 30)),
}

#: Follow-through delays behind the driver, in frames at 24 fps.
FOLLOW_DELAY_24 = {
    "torso": 2,
    "head": 3,
    "hands": 4,
    "soft_accessory": 6,
    "loose_cloth": 8,
    "rigid_load": 3,
}

#: Framing targets as a fraction of frame height.
HERO_FRAME_HEIGHT = 0.72      # 60-80%
DETAIL_FRAME_HEIGHT = 0.90    # 70-110%


# ---------------------------------------------------------------------------
# Scene and timing
# ---------------------------------------------------------------------------

def get_scene(name=None):
    """Return a scene by name, or the first one. Never touches bpy.context."""
    if name is not None:
        return bpy.data.scenes[name]
    return bpy.data.scenes[0]


def setup_scene(scene=None, fps=24, start=1, end=None, duration_s=None):
    """Set frame rate and range. Give either ``end`` (frames) or ``duration_s``.

    Returns the scene.
    """
    scene = scene or get_scene()
    scene.render.fps = fps
    scene.render.fps_base = 1.0

    scene.frame_start = start
    if duration_s is not None:
        scene.frame_end = start + int(round(duration_s * fps)) - 1
    elif end is not None:
        scene.frame_end = end
    return scene


def fps_of(scene=None):
    scene = scene or get_scene()
    return scene.render.fps / scene.render.fps_base


def sec(seconds, scene=None, start=1):
    """Seconds -> absolute frame number.

    Always author timing in seconds. Frame counts are not portable across frame
    rates; a 3 s move is 72 frames at 24 fps and 90 at 30 fps, and it is the same
    move. See references/camera-moves.md.
    """
    return start + seconds * fps_of(scene)


def frames(seconds, scene=None):
    """Seconds -> a duration in frames (not an absolute frame number)."""
    return seconds * fps_of(scene)


def scale_frames_24(frames_at_24, scene=None):
    """Rescale a frame count authored at 24 fps to the scene's frame rate."""
    return frames_at_24 * (fps_of(scene) / 24.0)


# ---------------------------------------------------------------------------
# F-curve plumbing
# ---------------------------------------------------------------------------

def ensure_action(id_data, name=None):
    """Return the action on ``id_data``, creating animation data if needed.

    ``id_data`` is an Object, or a Camera/Light *data* block for properties that
    live there (camera.data.lens, for example).

    The action name defaults to the datablock's own name. Do NOT give two
    datablocks the same action name: a shared action means keys written for one
    object land on the other's curves, and nothing raises. That is a silent
    failure — the animation simply comes out wrong, usually noticed only after a
    render. Pass an explicit ``name`` only when sharing is genuinely intended.
    """
    if id_data.animation_data is None:
        id_data.animation_data_create()

    action = id_data.animation_data.action

    # An action with more than one user is shared. Writing into it would put this
    # datablock's keys onto another object's curves, and nothing would raise, so
    # split off a private copy instead. This also catches actions left attached
    # by an earlier run, which bpy.data does not clear between scene resets.
    if action is not None and action.users > 1:
        action = action.copy()
        id_data.animation_data.action = action

    if action is None:
        action_name = name if name is not None else ("%s_Action" % id_data.name)
        action = bpy.data.actions.new(action_name)
        id_data.animation_data.action = action

    return action


def get_fcurve(id_data, data_path, index=0, group="", action_name=None):
    """Get or create an F-curve. ``fcurves.new`` raises if one already exists.

    ``action_name`` defaults to None so each datablock gets its own action — see
    ensure_action for why sharing one silently corrupts the animation.
    """
    action = ensure_action(id_data, action_name)
    for fc in action.fcurves:
        if fc.data_path == data_path and fc.array_index == index:
            return fc
    return action.fcurves.new(data_path=data_path, index=index, action_group=group)


def key(
    id_data,
    data_path,
    frame,
    value,
    index=0,
    interp="BEZIER",
    easing="AUTO",
    handle="AUTO_CLAMPED",
    group="",
):
    """Insert one keyframe with explicit interpolation, easing and handle type.

    ``interp``  CONSTANT LINEAR BEZIER SINE QUAD CUBIC QUART QUINT EXPO CIRC
                BACK BOUNCE ELASTIC
    ``easing``  AUTO EASE_IN EASE_OUT EASE_IN_OUT
    ``handle``  FREE ALIGNED VECTOR AUTO AUTO_CLAMPED

    AUTO_CLAMPED is the safe default: plain AUTO overshoots silently, which is how
    a camera ends up bouncing at the hero frame. See references/blender-fcurves.md.
    """
    fc = get_fcurve(id_data, data_path, index=index, group=group)
    kp = fc.keyframe_points.insert(float(frame), float(value), options={"FAST"})
    kp.interpolation = interp
    kp.easing = easing
    kp.handle_left_type = handle
    kp.handle_right_type = handle
    fc.update()
    return kp


def key_many(id_data, data_path, pairs, index=0, interp="BEZIER",
             easing="AUTO", handle="AUTO_CLAMPED", group=""):
    """Insert many (frame, value) pairs at once. Faster than repeated key()."""
    fc = get_fcurve(id_data, data_path, index=index, group=group)
    for frame, value in pairs:
        kp = fc.keyframe_points.insert(float(frame), float(value), options={"FAST"})
        kp.interpolation = interp
        kp.easing = easing
        kp.handle_left_type = handle
        kp.handle_right_type = handle
    fc.update()
    return fc


def key_vector(id_data, data_path, frame, vec, interp="BEZIER",
               easing="AUTO", handle="AUTO_CLAMPED", group=""):
    """Key all three components of a vector property at one frame."""
    return [
        key(id_data, data_path, frame, vec[i], index=i, interp=interp,
            easing=easing, handle=handle, group=group)
        for i in range(3)
    ]


def set_extrapolation(id_data, data_path, mode="CONSTANT", index=0):
    """CONSTANT holds the end value; LINEAR keeps going (what a loop wants)."""
    fc = get_fcurve(id_data, data_path, index=index)
    fc.extrapolation = mode
    return fc


def set_auto_smoothing(id_data, data_path, mode="CONT_ACCEL", index=0):
    """CONT_ACCEL for sparse flowing curves; NONE for dense polished work."""
    fc = get_fcurve(id_data, data_path, index=index)
    fc.auto_smoothing = mode
    return fc


# ---------------------------------------------------------------------------
# Easing helpers — the shapes that actually get used
# ---------------------------------------------------------------------------

def ease_move(id_data, data_path, f_start, f_end, v_start, v_end, index=0,
              profile="camera", group=""):
    """A single eased A-to-B move.

    profile:
        "camera"   monotonic S, end ease slightly longer than the start ease.
                   The default for any camera translation.
        "product"  sharper S — engineered, not heavy.
        "linear"   constant velocity. Turntables, conveyors, clocks.
        "impact"   fast departure, hard arrival.
        "release"  hard departure, soft arrival.
    """
    profiles = {
        "camera": ("BEZIER", "EASE_IN_OUT", "AUTO_CLAMPED"),
        "product": ("CUBIC", "EASE_IN_OUT", "AUTO_CLAMPED"),
        "linear": ("LINEAR", "AUTO", "VECTOR"),
        "impact": ("QUAD", "EASE_IN", "AUTO_CLAMPED"),
        "release": ("QUAD", "EASE_OUT", "AUTO_CLAMPED"),
    }
    interp, easing, handle = profiles[profile]
    key(id_data, data_path, f_start, v_start, index=index,
        interp=interp, easing=easing, handle=handle, group=group)
    key(id_data, data_path, f_end, v_end, index=index,
        interp=interp, easing=easing, handle=handle, group=group)


def overshoot(id_data, data_path, f_start, v_start, v_end, index=0,
              kind="prop", scene=None, group=""):
    """Move to a target, past it, back under, then settle.

    ``kind``: snappy | prop | heavy | camera  (see OVERSHOOT)

    The overshoot key must not equal the target value — the curve has to cross the
    target, reach an extremum beyond it, reverse, and decay back. Two keys at the
    target value is a hold, not an overshoot.

    Camera overshoot reads as operator error: the "camera" preset is deliberately
    tiny (1%) and exists only for cases where a trace of settle is wanted.
    """
    over_f, under_f, offsets = OVERSHOOT[kind]
    delta = v_end - v_start

    o = [f_start + scale_frames_24(n, scene) for n in offsets]
    pairs = [
        (o[0], v_start),
        (o[1], v_start + delta * over_f),
        (o[2], v_start + delta * under_f),
        (o[3], v_end),
    ]
    key_many(id_data, data_path, pairs, index=index,
             interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED", group=group)
    return o[3]


def settle(id_data, data_path, f_arrive, value, index=0, hold_s=1.0, scene=None,
           group=""):
    """Hold a value still. A hold is part of the move, not dead time.

    The hero hold is what makes the whole shot land: 1.5-3 s for a final lockup.
    Returns the frame the hold ends on.
    """
    f_end = f_arrive + frames(hold_s, scene)
    key(id_data, data_path, f_arrive, value, index=index, group=group)
    key(id_data, data_path, f_end, value, index=index, group=group)
    return f_end


def stagger(base_frame, index, spread_frames=5, scene=None):
    """Offset the n-th element so things do not all start on the same frame.

    If camera, product, focus and lights all start and stop together, the shot
    reads as procedural. 3-8 frames of offset is the fix.
    """
    return base_frame + scale_frames_24(index * spread_frames, scene)


# ---------------------------------------------------------------------------
# Physics — see references/motion-principles.md
# ---------------------------------------------------------------------------

def fall_time(height_m, g=GRAVITY):
    """Seconds for a free fall from rest through ``height_m``.

    Mass does not enter. Do not float a light object — that is the most common
    weight error in product animation.
    """
    return math.sqrt(2.0 * height_m / g)


def fall_frames(height_m, scene=None, g=GRAVITY):
    return fall_time(height_m, g) * fps_of(scene)


def fall_speed(height_m, g=GRAVITY):
    """Impact speed in m/s after falling ``height_m`` from rest."""
    return math.sqrt(2.0 * g * height_m)


def fall_position(t, height_m, g=GRAVITY):
    """Height above the landing plane at time ``t`` into the fall."""
    return max(0.0, height_m - 0.5 * g * t * t)


def key_ballistic(id_data, data_path, f_start, height_m, ground=0.0, index=2,
                  scene=None, samples=None, group=""):
    """Key a physically correct free fall, sampled per frame.

    Constant acceleration means per-frame distances follow 1 : 3 : 5 : 7 : 9.
    A symmetric Bezier ease is not the same thing, which is why this samples the
    real parabola instead of easing two keys.

    Returns the landing frame.
    """
    fps = fps_of(scene)
    total_f = fall_frames(height_m, scene)
    n = samples if samples is not None else max(2, int(math.ceil(total_f)))

    pairs = []
    for i in range(n + 1):
        f = f_start + (total_f * i / n)
        t = (f - f_start) / fps
        pairs.append((f, ground + fall_position(t, height_m)))

    key_many(id_data, data_path, pairs, index=index,
             interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED", group=group)
    return f_start + total_f


def accel_time(mass_kg, delta_v, force_n):
    """Seconds to change velocity by ``delta_v`` under a constant net force.

    Mass alone never specifies timing — you need force and a target speed too.
    """
    return mass_kg * delta_v / force_n


def rest_to_rest(distance, accel):
    """(duration_s, peak_velocity) for a rest-to-rest move with no cruise phase."""
    t = 2.0 * math.sqrt(distance / accel)
    return t, math.sqrt(accel * distance)


def shutter_exposure(shutter_angle=180.0, scene=None):
    """Exposure time in seconds. 180 deg at 24 fps = 1/48 s."""
    return shutter_angle / (360.0 * fps_of(scene))


# ---------------------------------------------------------------------------
# Lens and perspective — see references/forced-perspective.md
# ---------------------------------------------------------------------------

def fov_from_lens(lens_mm, sensor_mm=FULL_FRAME_SENSOR_WIDTH):
    """Field of view in radians. theta = 2*atan(s / 2f)."""
    return 2.0 * math.atan(sensor_mm / (2.0 * lens_mm))


def lens_from_fov(fov_rad, sensor_mm=FULL_FRAME_SENSOR_WIDTH):
    """f = s / (2*tan(theta/2))."""
    return sensor_mm / (2.0 * math.tan(fov_rad / 2.0))


def coverage_at(distance, lens_mm, sensor_mm=FULL_FRAME_SENSOR_WIDTH):
    """Linear scene width covered at ``distance``. W = D * s / f."""
    return distance * sensor_mm / lens_mm


def effective_sensor_height(scene=None, sensor_width=FULL_FRAME_SENSOR_WIDTH,
                            sensor_height=FULL_FRAME_SENSOR_HEIGHT,
                            sensor_fit="HORIZONTAL"):
    """The sensor dimension that actually governs VERTICAL framing.

    Under the default HORIZONTAL fit, ``sensor_width`` sets the horizontal FOV and
    the vertical extent falls out of the render aspect ratio — so it is
    ``sensor_width * res_y / res_x``, NOT ``sensor_height``.

    At 16:9 on a 36 mm sensor that is 20.25 mm, not 24 mm. Assuming 24 mm makes a
    product render 18% larger than asked for, which is enough to push a hero shot
    out of the 60-80% band while every number in the script still looks right.
    """
    if sensor_fit == "VERTICAL":
        return sensor_height
    scene = scene or get_scene()
    return sensor_width * scene.render.resolution_y / scene.render.resolution_x


def distance_for_framing(subject_size, lens_mm, fill=HERO_FRAME_HEIGHT,
                         sensor_mm=None, scene=None):
    """Camera distance that makes ``subject_size`` fill ``fill`` of frame HEIGHT.

    From q*s = f*H/D  ->  D = f*H / (q*s).

    Pick distance for the depth ratios you want, then focal length for framing —
    never the reverse. This solves the other direction when the lens is fixed.

    ``sensor_mm`` defaults to the effective vertical sensor size for the scene's
    render aspect, so the result matches what the camera actually renders.
    """
    if sensor_mm is None:
        sensor_mm = effective_sensor_height(scene)
    return lens_mm * subject_size / (fill * sensor_mm)


def lens_for_framing(subject_size, distance, fill=HERO_FRAME_HEIGHT,
                     sensor_mm=None, scene=None):
    """Focal length that makes ``subject_size`` fill ``fill`` at ``distance``."""
    if sensor_mm is None:
        sensor_mm = effective_sensor_height(scene)
    return fill * sensor_mm * distance / subject_size


def equivalent_lens(lens_mm, from_sensor, to_sensor):
    """Match field of view across sensor sizes. f2 = f1 * (s2 / s1)."""
    return lens_mm * to_sensor / from_sensor


def full_frame_equivalent(lens_mm, sensor_mm):
    """Express an actual focal length as its full-frame equivalent."""
    return lens_mm * FULL_FRAME_SENSOR_WIDTH / sensor_mm


def near_feature_exaggeration(distance, protrusion):
    """E = D / (D - delta): how much a near feature is enlarged.

    D=400mm, delta=100mm -> 1.33 (aggressive). D=2000mm -> 1.05 (invisible).
    This is why moving 20 cm closer changes a product's apparent shape more than
    swapping lenses does.
    """
    if distance <= protrusion:
        raise ValueError("camera is inside the subject: distance must exceed protrusion")
    return distance / (distance - protrusion)


def background_ratio(distance, background_offset):
    """R = D / (D + L): apparent size of a same-sized object L further back.

    Small R (close camera) = strong separation. Large R (far camera) = the
    "compression" a long lens is credited with but distance actually caused.
    """
    return distance / (distance + background_offset)


def dolly_zoom_lens(lens_0, distance_0, distance_t):
    """f(t) = f0 * D(t)/D0 — holds subject screen size constant."""
    return lens_0 * distance_t / distance_0


def forced_perspective_distance(near_size, near_distance, far_size):
    """Distance at which ``far_size`` matches the apparent height of ``near_size``.

    Z2 = Z1 * (H2 / H1). A 0.25 m stand-in for a 2 m object must be 8x closer.

    The illusion holds only from the designed camera position — any lateral move
    exposes the real depth arrangement through parallax.
    """
    return near_distance * far_size / near_size


def log_lens_ramp(lens_0, lens_1, t):
    """f(t) = f0 * (f1/f0)^t — constant *proportional* zoom speed.

    Image scale is proportional to focal length, so a linear 24->120 mm ramp feels
    fast at the start and crawls at the end. This is what the eye reads as even.
    """
    return lens_0 * ((lens_1 / lens_0) ** t)


# ---------------------------------------------------------------------------
# Scene construction
# ---------------------------------------------------------------------------

def new_empty(name, location=(0, 0, 0), scene=None, display_size=0.2,
              display_type="PLAIN_AXES"):
    """Create (or fetch) an Empty and link it to the scene."""
    scene = scene or get_scene()
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, None)
        obj.empty_display_type = display_type
        obj.empty_display_size = display_size
    if obj.name not in scene.collection.objects:
        scene.collection.objects.link(obj)
    obj.location = location
    return obj


def visual_center(obj, lift=0.10):
    """World-space orbit pivot: bounding-box center lifted by ``lift`` of height.

    Orbiting the mesh origin makes a product appear to swing rather than turn.
    Upright bottles and packaging want the pivot 5-15% above bbox center.
    """
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    lo = Vector((min(c[i] for c in corners) for i in range(3)))
    hi = Vector((max(c[i] for c in corners) for i in range(3)))
    center = (lo + hi) * 0.5
    center.z += (hi.z - lo.z) * lift
    return center


def subject_height(obj):
    """World-space bounding-box height, for framing math."""
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    return max(c.z for c in corners) - min(c.z for c in corners)


def camera_rig(name="CAM", scene=None, location=(0, -4, 1), lens=85.0,
               sensor_width=FULL_FRAME_SENSOR_WIDTH, fstop=FSTOP["beauty"]):
    """Build the standard rig: dolly -> pan -> tilt -> shake -> camera.

    Three separate targets: position (dolly), aim (what it looks at), focus (what
    is sharp). They are frequently not the same point — the aim can sit at the
    product's visual center while focus sits on the logo nearer the camera.

    Returns a dict: dolly, pan, tilt, shake, camera, aim, focus.
    """
    scene = scene or get_scene()

    dolly = new_empty(name + "_Dolly", location=location, scene=scene, display_size=0.4)
    pan = new_empty(name + "_Pan", scene=scene, display_size=0.3)
    tilt = new_empty(name + "_Tilt", scene=scene, display_size=0.25)
    shake = new_empty(name + "_Shake", scene=scene, display_size=0.2)
    aim = new_empty(name + "_AIM", scene=scene, display_type="SPHERE", display_size=0.15)
    focus = new_empty(name + "_FOCUS", scene=scene, display_type="SPHERE", display_size=0.1)

    cam_data = bpy.data.cameras.get(name + "_Data") or bpy.data.cameras.new(name + "_Data")
    cam_obj = bpy.data.objects.get(name)
    if cam_obj is None:
        cam_obj = bpy.data.objects.new(name, cam_data)
    if cam_obj.name not in scene.collection.objects:
        scene.collection.objects.link(cam_obj)

    pan.parent = dolly
    tilt.parent = pan
    shake.parent = tilt
    cam_obj.parent = shake
    for child in (pan, tilt, shake, cam_obj):
        child.location = (0, 0, 0)

    set_camera(cam_obj, lens=lens, sensor_width=sensor_width, fstop=fstop,
               focus_object=focus)
    aim_at(cam_obj, aim)

    scene.camera = cam_obj
    return {
        "dolly": dolly, "pan": pan, "tilt": tilt, "shake": shake,
        "camera": cam_obj, "aim": aim, "focus": focus,
    }


def set_camera(cam_obj, lens=85.0, sensor_width=FULL_FRAME_SENSOR_WIDTH,
               sensor_height=FULL_FRAME_SENSOR_HEIGHT, fstop=FSTOP["beauty"],
               focus_object=None, focus_distance=None, blades=7):
    """Configure a camera explicitly.

    Set the sensor before naming a focal length — "85 mm" is meaningless without
    it, and sensor_fit is left on AUTO by default, which makes framing depend on
    output aspect.
    """
    cam = cam_obj.data
    cam.type = "PERSP"
    cam.lens = lens
    cam.sensor_fit = "HORIZONTAL"
    cam.sensor_width = sensor_width
    cam.sensor_height = sensor_height

    cam.dof.use_dof = True
    cam.dof.aperture_fstop = fstop
    cam.dof.aperture_blades = blades
    if focus_object is not None:
        cam.dof.focus_object = focus_object
    elif focus_distance is not None:
        cam.dof.focus_distance = focus_distance
    return cam


def aim_at(obj, target, damped=True, up_axis="UP_Y"):
    """Constrain ``obj`` to look at ``target``. Blender cameras look down -Z.

    Damped Track uses the shortest rotation and does not twist. Track To locks a
    horizon but is legacy and twists near singular configurations — use it only
    when the horizon must stay level through the move.
    """
    for c in list(obj.constraints):
        if c.type in {"DAMPED_TRACK", "TRACK_TO"}:
            obj.constraints.remove(c)

    if damped:
        c = obj.constraints.new(type="DAMPED_TRACK")
        c.track_axis = "TRACK_NEGATIVE_Z"
    else:
        c = obj.constraints.new(type="TRACK_TO")
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = up_axis
    c.target = target
    return c


def follow_path(obj, curve_obj, fixed=True, curve_follow=False):
    """Put ``obj`` on a curve. Animate ``offset_factor`` (0..1), not XYZ.

    Easing one path-progress parameter is what keeps an orbit smooth; easing three
    XYZ channels separately produces the side-to-side wobble no handle tweak fixes.

    curve_follow stays off so a separate aim target owns orientation — otherwise
    the camera inherits the curve's banking and twist.
    """
    c = obj.constraints.new(type="FOLLOW_PATH")
    c.target = curve_obj
    c.use_fixed_location = fixed
    c.use_curve_follow = curve_follow
    c.forward_axis = "FORWARD_Y"
    c.up_axis = "UP_Z"
    c.offset_factor = 0.0
    return c


# ---------------------------------------------------------------------------
# Moves
# ---------------------------------------------------------------------------

def orbit(pivot, f_start, f_end, degrees, start_deg=0.0, axis=2,
          profile="camera", scene=None):
    """Rotate a pivot Empty. Parent the dolly to it for a camera orbit.

    Speed reference (references/camera-moves.md): luxury orbit 5-15 deg/s,
    reveal arc 15-30 deg/s, turntable 24-45 deg/s linear.
    """
    ease_move(pivot, "rotation_euler", f_start, f_end,
              math.radians(start_deg), math.radians(start_deg + degrees),
              index=axis, profile=profile, group="Orbit")
    return f_end


def turntable(pivot, f_start, revolutions=1.0, duration_s=12.0, axis=2, scene=None):
    """Seam-free looping turntable. Linear in, linear out.

    Keys frame N+1 at 360 deg and expects frames 1..N to be rendered. Keying frame
    N at 360 duplicates a perceptually identical frame — the one-frame hitch on
    every repeat.

    Returns the last frame that should be rendered.
    """
    total_f = frames(duration_s, scene)
    key_many(
        pivot, "rotation_euler",
        [(f_start, 0.0), (f_start + total_f, math.radians(360.0 * revolutions))],
        index=axis, interp="LINEAR", easing="AUTO", handle="VECTOR",
        group="Turntable",
    )
    set_extrapolation(pivot, "rotation_euler", "LINEAR", index=axis)
    return f_start + total_f - 1


def dolly_in(dolly, f_start, f_end, start_pos, end_pos, profile="camera"):
    """Physically translate the camera. Not a zoom — perspective must change.

    Speed reference: move 5-20% of the starting distance per second; final image
    size increase 15-40%.
    """
    for i in range(3):
        ease_move(dolly, "location", f_start, f_end, start_pos[i], end_pos[i],
                  index=i, profile=profile, group="Dolly")
    return f_end


def push_in_target(subject_size, lens_mm, start_fill=0.55, end_fill=HERO_FRAME_HEIGHT,
                   sensor_mm=None, scene=None):
    """(start_distance, end_distance) for a push-in between two frame fills.

    Begin slightly wider than expected, arrive at 65-80% frame height, then hold.
    """
    return (
        distance_for_framing(subject_size, lens_mm, start_fill, sensor_mm, scene),
        distance_for_framing(subject_size, lens_mm, end_fill, sensor_mm, scene),
    )


def dolly_zoom(cam_obj, dolly, f_start, f_end, distance_0, distance_1,
               lens_0, axis=1, scene=None):
    """Vertigo effect: hold subject screen size while distance changes.

    f/D is held constant, so f2 = f1 * D2/D1. Dolly out + zoom in makes the
    background crowd the subject; dolly in + zoom out stretches it away.

    Distances are sampled per frame because the lens ramp is not linear in time.
    Returns the final focal length.
    """
    fps = fps_of(scene)
    n = max(2, int(math.ceil(f_end - f_start)))

    loc_pairs, lens_pairs = [], []
    for i in range(n + 1):
        t = i / n
        f = f_start + (f_end - f_start) * t
        # smoothstep so the move eases at both ends
        s = t * t * (3.0 - 2.0 * t)
        d = distance_0 + (distance_1 - distance_0) * s
        loc_pairs.append((f, -d if axis == 1 else d))
        lens_pairs.append((f, dolly_zoom_lens(lens_0, distance_0, d)))

    key_many(dolly, "location", loc_pairs, index=axis,
             interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED", group="DollyZoom")
    key_many(cam_obj.data, "lens", lens_pairs, index=0,
             interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED", group="Lens")
    return lens_pairs[-1][1]


def rack_focus(cam_obj, f_start, f_end, from_obj, to_obj, hold_frames=10,
               scene=None):
    """Move the focus Empty between two targets.

    Focus should leave the first subject decisively, cross the unusable middle
    fast, and land gently — hence EASE_IN_OUT with a smoothstep-shaped middle.
    Hold each sharp endpoint at least 8-12 frames.

    ``cam_obj.data.dof.focus_object`` must already be an Empty this can move.
    """
    focus = cam_obj.data.dof.focus_object
    if focus is None:
        raise ValueError("camera has no dof.focus_object to animate")

    a = from_obj.matrix_world.translation
    b = to_obj.matrix_world.translation

    for i in range(3):
        key_many(
            focus, "location",
            [
                (f_start - hold_frames, a[i]),
                (f_start, a[i]),
                (f_end, b[i]),
                (f_end + hold_frames, b[i]),
            ],
            index=i, interp="BEZIER", easing="EASE_IN_OUT",
            handle="AUTO_CLAMPED", group="RackFocus",
        )
    return f_end + hold_frames


def follow_through(driver_obj, follower_obj, data_path, delay_frames,
                   amplitude=0.7, index=0, scene=None):
    """Copy a driver's curve onto a follower, delayed and reduced.

    Never clone the driver — reduce or reshape the amplitude. And vary the delay
    per event: a uniform offset on every key is exactly what makes overlap look
    mechanical. Delays at 24 fps live in FOLLOW_DELAY_24.
    """
    src = None
    if driver_obj.animation_data and driver_obj.animation_data.action:
        for fc in driver_obj.animation_data.action.fcurves:
            if fc.data_path == data_path and fc.array_index == index:
                src = fc
                break
    if src is None:
        raise ValueError("driver has no fcurve for %s[%d]" % (data_path, index))

    d = scale_frames_24(delay_frames, scene)
    base = src.keyframe_points[0].co[1]

    pairs = [
        (kp.co[0] + d, base + (kp.co[1] - base) * amplitude)
        for kp in src.keyframe_points
    ]
    key_many(follower_obj, data_path, pairs, index=index,
             interp="BEZIER", easing="AUTO", handle="AUTO_CLAMPED",
             group="FollowThrough")
    return pairs[-1][0]


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def sample_motion(obj, f_start, f_end, scene=None):
    """World-space position per frame. Use this instead of eyeballing arcs."""
    scene = scene or get_scene()
    out = []
    for f in range(int(f_start), int(f_end) + 1):
        scene.frame_set(f)
        out.append((f, obj.matrix_world.translation.copy()))
    return out


def spacing_report(obj, f_start, f_end, scene=None):
    """Per-frame travel distances — the numbers behind 'spacing'.

    Constant acceleration from rest gives ratios 1 : 3 : 5 : 7 : 9. Evenly spaced
    means constant speed. Bunching before a pose is slow-in. Reading these beats
    guessing from the curve, especially since perceived speed is
    sqrt(x'^2 + y'^2 + z'^2) and no single channel shows it.
    """
    samples = sample_motion(obj, f_start, f_end, scene)
    return [
        (samples[i][0], (samples[i][1] - samples[i - 1][1]).length)
        for i in range(1, len(samples))
    ]


def check_framing(cam_obj, subject_obj, scene=None):
    """Fraction of frame height the subject occupies, at the current frame.

    Hero product should sit at 60-80%; a detail insert at 70-110%. Rough — uses
    the bounding box and ignores rotation of the subject relative to the camera.
    """
    scene = scene or get_scene()
    cam = cam_obj.data
    d = (subject_obj.matrix_world.translation - cam_obj.matrix_world.translation).length
    h = subject_height(subject_obj)
    sensor_h = effective_sensor_height(scene, cam.sensor_width,
                                       cam.sensor_height, cam.sensor_fit)
    return (cam.lens * h / d) / sensor_h
