# bpy animation API

**Target: Blender 4.2 LTS and up.** Everything here uses the classic `action.fcurves.new()` path,
which still works in 5.x. The newer slotted-Action API (`fcurve_ensure_for_datablock`) is noted
where relevant but not used — it breaks on 4.2.

**Headless-safe.** Every snippet uses `bpy.data` and explicit objects, never `bpy.context` or
`bpy.ops`. That means it runs identically in the Text Editor and under
`blender -b file.blend -P script.py`. Context-dependent code silently does nothing (or crashes) in
background mode — the single most common reason a render automation "works locally".

---

## 1. Scene, frame range, fps

```python
import bpy

scene = bpy.data.scenes["Scene"]        # not bpy.context.scene — headless safety

scene.frame_start = 1
scene.frame_end   = 360

scene.render.fps      = 24
scene.render.fps_base = 1.0             # 29.97 → fps=30, fps_base=1.001

effective_fps = scene.render.fps / scene.render.fps_base

scene.frame_set(72)                     # evaluates the depsgraph; use this, not frame_current
```

`frame_set()` forces constraints, drivers and dependent animation to update immediately.
Assigning `scene.frame_current` does not reliably do that.

Preview range (UI convenience, ignored in background renders):

```python
scene.use_preview_range   = True
scene.frame_preview_start = 48
scene.frame_preview_end   = 120
```

**Seconds → frames:** `frames = seconds * fps`. Keep it float while computing; round only when
placing the key.

---

## 2. Inserting keyframes — the simple path

```python
obj = bpy.data.objects["Product"]

obj.location = (0.0, 0.0, 0.0)
obj.keyframe_insert(data_path="location", frame=1)

obj.location.x = 5.0
obj.keyframe_insert(
    data_path="location",
    index=0,                    # X only; -1 (default) keys all components
    frame=24,
    group="Object Transforms",
    options={'INSERTKEY_NEEDED'},
    keytype='EXTREME',          # KEYFRAME BREAKDOWN MOVING_HOLD EXTREME JITTER GENERATED
)
```

`keyframe_insert()` creates animation data and F-curves as needed. Fine for a handful of keys; for
anything with controlled interpolation, go direct to the F-curve.

Common data paths:

| Target | `data_path` |
|---|---|
| Object location | `"location"` |
| Object Euler rotation | `"rotation_euler"` |
| Object quaternion | `"rotation_quaternion"` |
| Object scale | `"scale"` |
| Camera focal length | `"lens"` — **on `camera.data`, not the object** |
| Camera focus distance | `"dof.focus_distance"` — on `camera.data` |
| Camera f-stop | `"dof.aperture_fstop"` — on `camera.data` |
| Camera shift | `"shift_x"` / `"shift_y"` — on `camera.data` |
| Constraint influence | `"influence"` — on the constraint |
| Follow Path progress | `"offset_factor"` — on the constraint |
| Custom property | `'["my_prop"]'` — note the quotes inside |

---

## 3. Direct F-curve creation — the controlled path

This is what `anim_lib.py` uses. It gives exact control over interpolation, easing and handles.

```python
import bpy

obj = bpy.data.objects["Product"]

if obj.animation_data is None:
    obj.animation_data_create()

action = bpy.data.actions.new("Product_Move")
obj.animation_data.action = action

# 4.2 LTS path. Works in 5.x too.
fc = action.fcurves.new(data_path="location", index=0, action_group="Transform")

fc.auto_smoothing = 'CONT_ACCEL'        # or 'NONE' for local control
fc.extrapolation  = 'CONSTANT'          # or 'LINEAR' for looping turntables

keys = [(1.0, 0.0), (13.0, 10.6), (17.0, 9.8), (23.0, 10.0)]

fc.keyframe_points.add(count=len(keys))
for kp, (frame, value) in zip(fc.keyframe_points, keys):
    kp.co = (frame, value)
    kp.interpolation     = 'BEZIER'
    kp.easing            = 'EASE_IN_OUT'
    kp.handle_left_type  = 'AUTO_CLAMPED'
    kp.handle_right_type = 'AUTO_CLAMPED'

fc.update()          # REQUIRED after bulk edits — recalculates handles
```

`add()` + `zip()` is much faster than repeated `insert()` for long curves. When you do need
`insert()`:

```python
kp = fc.keyframe_points.insert(frame, value, options={'FAST'}, keyframe_type='KEYFRAME')
```

`{'FAST'}` defers recalculation — you **must** call `fc.update()` afterwards. Other options:
`'REPLACE'`, `'NEEDED'`.

**If an F-curve already exists, `fcurves.new()` raises.** Find it first:

```python
def get_or_create_fcurve(action, data_path, index=0, group=""):
    for fc in action.fcurves:
        if fc.data_path == data_path and fc.array_index == index:
            return fc
    return action.fcurves.new(data_path=data_path, index=index, action_group=group)
```

---

## 4. Interpolation, easing and handle enums

```python
kp.interpolation = 'CONSTANT'   # LINEAR BEZIER
                                # SINE QUAD CUBIC QUART QUINT EXPO CIRC
                                # BACK BOUNCE ELASTIC

kp.easing = 'AUTO'              # EASE_IN EASE_OUT EASE_IN_OUT

kp.handle_left_type  = 'AUTO_CLAMPED'   # FREE ALIGNED VECTOR AUTO AUTO_CLAMPED
kp.handle_right_type = 'AUTO_CLAMPED'

# Handle coordinates are (frame, value) in curve space:
kp.handle_left  = (11.0, 9.8)
kp.handle_right = (14.0, 10.8)

# Parameters for BACK and ELASTIC:
kp.back      = 1.70158
kp.amplitude = 0.15
kp.period    = 0.3
```

Setting `handle_left` / `handle_right` coordinates only has effect when the corresponding type is
`'FREE'` or `'ALIGNED'`. Auto types recompute and overwrite them.

`fc.extrapolation`: `'CONSTANT'` (hold the end value) or `'LINEAR'` (keep going — what a looping
turntable wants).

---

## 5. Camera setup

```python
cam_obj = bpy.data.objects["Camera"]
cam     = cam_obj.data

cam.type          = 'PERSP'
cam.lens          = 85.0
cam.sensor_fit    = 'HORIZONTAL'    # set explicitly, never leave on AUTO for repeatable work
cam.sensor_width  = 36.0            # full frame
cam.sensor_height = 24.0

cam.shift_x = 0.0
cam.shift_y = 0.0

cam.dof.use_dof           = True
cam.dof.focus_object      = bpy.data.objects.get("FOCUS_Target")
cam.dof.aperture_fstop    = 4.0
cam.dof.aperture_blades   = 7       # 0 = circular
cam.dof.aperture_rotation = 0.0
cam.dof.aperture_ratio    = 1.0     # anamorphic bokeh
```

Blender defaults: 50 mm, 36×24 mm, `AUTO` fit, DOF **off**, f/2.8, focus distance 10.

**`focus_object` overrides `focus_distance`.** Put the Empty on the hero surface — a target at the
product origin focuses *behind* the visible front face.

Keying focal length (it lives on the **data**, not the object):

```python
cam.lens = 24.0
cam.keyframe_insert(data_path="lens", frame=1)
cam.lens = 60.0
cam.keyframe_insert(data_path="lens", frame=120)
```

---

## 6. Camera rig constraints

```
CAM_Dolly              Follow Path or keyed location
 └── CAM_Pan
     └── CAM_Tilt
         └── CAM_Shake
             └── Camera   Damped Track → AIM_Target
```

### Damped Track — preferred for aim

```python
cam = bpy.data.objects["Camera"]
aim = bpy.data.objects["AIM_Target"]

c = cam.constraints.new(type='DAMPED_TRACK')
c.name       = "Aim"
c.target     = aim
c.track_axis = 'TRACK_NEGATIVE_Z'    # Blender cameras look down local -Z
c.influence  = 1.0
```

Shortest-rotation pointing, no up-axis, no twisting artifacts.

### Track To — when you need a locked horizon

```python
c = cam.constraints.new(type='TRACK_TO')
c.target     = aim
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis    = 'UP_Y'                # must differ from track_axis or the constraint is invalid
```

Legacy, and it twists near singular configurations. Use Damped Track unless the horizon must stay
level through the move.

### Follow Path — dolly and crane

```python
dolly = bpy.data.objects["CAM_Dolly"]
path  = bpy.data.objects["CameraPath"]

f = dolly.constraints.new(type='FOLLOW_PATH')
f.target             = path
f.use_fixed_location = True          # offset_factor becomes 0..1 along the curve
f.offset_factor      = 0.0
f.use_curve_follow   = False         # usually OFF — let a separate aim target handle orientation
f.forward_axis       = 'FORWARD_Y'   # must differ from up_axis
f.up_axis            = 'UP_Z'

f.keyframe_insert("offset_factor", frame=1)
f.offset_factor = 1.0
f.keyframe_insert("offset_factor", frame=120)
```

With `use_fixed_location`, `offset_factor` runs 0 → 1 regardless of the curve's Evaluation Time.
This is **the** parameter to ease — one curve, not three XYZ channels. Easing XYZ separately is
what produces the side-to-side wobble on orbits.

Keep `use_curve_follow = False` and aim with a separate target. That separates path position from
orientation and avoids inheriting the curve's banking and twist.

### Child Of — space switching

```python
rig     = bpy.data.objects["CAM_Rig"]
vehicle = bpy.data.objects["Vehicle"]

c = rig.constraints.new(type='CHILD_OF')
c.target    = vehicle
c.influence = 1.0
c.set_inverse_pending = True      # asks Blender to recompute the inverse matrix
```

Without the inverse set, enabling the constraint snaps the child. Animate `influence` over a short
span for a soft space switch, or switch in one frame with matched world transforms on both sides.

### Copy Location

```python
c = rig.constraints.new(type='COPY_LOCATION')
c.target       = bpy.data.objects["Vehicle"]
c.use_x, c.use_y, c.use_z = True, True, False
c.use_offset   = True             # adds the owner's original location
c.owner_space  = 'WORLD'
c.target_space = 'WORLD'
```

---

## 7. Drivers

```python
control = bpy.data.objects["CAM_Control"]
control["path_u"] = 0.0                       # custom property

fc  = follow_constraint.driver_add("offset_factor")
drv = fc.driver
drv.type = 'SCRIPTED'

var = drv.variables.new()
var.name = "u"
var.type = 'SINGLE_PROP'
var.targets[0].id        = control
var.targets[0].data_path = '["path_u"]'

drv.expression = "min(max(u, 0.0), 1.0)"
```

Transform-channel variable — this is the dolly-zoom pattern:

```python
fc  = cam.data.driver_add("lens")
drv = fc.driver
drv.type = 'SCRIPTED'

var = drv.variables.new()
var.name = "d"
var.type = 'TRANSFORMS'
t = var.targets[0]
t.id              = bpy.data.objects["CAM_Dolly"]
t.transform_type  = 'LOC_Y'
t.transform_space = 'WORLD_SPACE'

# f = f0 * (D / D0), clamped to a sane lens range
drv.expression = "max(14.0, min(200.0, 24.0 * (abs(d) / 2.0)))"
```

Also useful: `var.type = 'LOC_DIFF'` gives the distance between two objects directly — cleaner than
computing it from a single transform channel when the camera is not on an axis.

**Reference RNA properties through driver variables**, not by embedding lookups in the expression
string. Blender can only track dependencies it can see, and an expression that reaches into
`bpy.data` will silently fail to update.

Use drivers for **deterministic relationships** — lens compensation, path parameters, focus
distance, wheel rotation. Keyframes stay easier to art-direct for the primary performance.

---

## 8. NLA

```python
obj  = bpy.data.objects["Product"]
anim = obj.animation_data or obj.animation_data_create()

track = anim.nla_tracks.new()
track.name = "Reveal"

strip = track.strips.new("Reveal_01", 1, bpy.data.actions["HeroReveal"])
strip.repeat     = 1.0
strip.scale      = 1.0
strip.blend_type = 'REPLACE'      # ADD SUBTRACT COMBINE
strip.influence  = 1.0
```

`strips.new(name, start_frame, action)`.

---

## 9. Motion paths (for arc checking)

```python
obj = bpy.data.objects["Product"]
mp  = obj.motion_path

# Calculation requires an operator and therefore a context — UI only.
# In headless work, sample the transform manually instead:
scene = bpy.data.scenes["Scene"]
samples = []
for f in range(scene.frame_start, scene.frame_end + 1):
    scene.frame_set(f)
    samples.append(obj.matrix_world.translation.copy())
```

The manual sample loop is often better anyway — you get the numbers, so you can check spacing
ratios (`1 : 3 : 5 : 7` for constant acceleration) programmatically instead of by eye.

---

## 10. Headless render

```bash
blender -b scene.blend -P scripts/recipes/hero_reveal.py -o //render/frame_ -a
```

Order matters: `-b` (background) → `-P` (run script) → render flags. The script runs **before** the
render starts, so it can set up animation, then `-a` renders the animation range.

To render from inside the script instead:

```python
scene.render.filepath = "//render/frame_"
bpy.ops.render.render(animation=True, write_still=False)
```

`bpy.ops.render.render` is one of the few operators that works reliably in background mode.

### Headless gotchas

| Trap | Fix |
|---|---|
| `bpy.context.object` is `None` | Use `bpy.data.objects["Name"]` |
| `bpy.context.scene` can be unset | Use `bpy.data.scenes["Scene"]` |
| Most `bpy.ops.*` silently no-op | Use the data API; if an operator is unavoidable, build a context override |
| Selection state does not exist | Never rely on `select_get()` / active object |
| `frame_current` does not update dependents | Use `scene.frame_set(f)` |
| Handles look wrong after bulk edits | Call `fcurve.update()` |
| Driver never updates | Reference the property through a driver **variable**, not inside the expression |
