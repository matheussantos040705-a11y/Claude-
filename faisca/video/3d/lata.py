"""Cena 3D da lata FAÍSCA: lata com rótulo, gotas geladas, estúdio roxo.

blender -b -P lata.py -- --out quadro.png [--frame N] [--res W H] [--samples N]
"""
import bpy, sys, math, os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default, n=1, cast=str):
    if name in argv:
        i = argv.index(name)
        vals = [cast(v) for v in argv[i + 1:i + 1 + n]]
        return vals if n > 1 else vals[0]
    return default
OUT = arg("--out", "quadro.png")
FRAME = arg("--frame", 1, cast=int)
RES = arg("--res", [1080, 1920], 2, int)
SAMPLES = arg("--samples", 64, cast=int)
SHOT = arg("--shot", "B")
SEQ = arg("--seq", "")
HERE = os.path.dirname(os.path.abspath(__file__))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.fps = 30
sc.frame_start, sc.frame_end = 1, 150
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.exposure = -0.2

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links

# --- Lata: corpo com rótulo + tampa de alumínio -------------------------------
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.029, depth=0.15, location=(0, 0, 0.075))
body = bpy.context.object; body.name = "Lata"
bpy.ops.object.shade_smooth()
m, n, l = mat("Rotulo")
bsdf = n["Principled BSDF"]
tex = n.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(os.path.join(HERE, "rotulo.png"))
# Mapeamento cilíndrico próprio: u = ângulo em volta da lata, v = altura.
tc = n.new("ShaderNodeTexCoord"); sep = n.new("ShaderNodeSeparateXYZ")
at = n.new("ShaderNodeMath"); at.operation = "ARCTAN2"
u = n.new("ShaderNodeMath"); u.operation = "MULTIPLY_ADD"; u.inputs[1].default_value = 1 / (2 * math.pi); u.inputs[2].default_value = 0.5
v = n.new("ShaderNodeMath"); v.operation = "MULTIPLY_ADD"; v.inputs[1].default_value = 1 / 0.15; v.inputs[2].default_value = 0.5
comb = n.new("ShaderNodeCombineXYZ")
l.new(tc.outputs["Object"], sep.inputs["Vector"])
l.new(sep.outputs["Y"], at.inputs[0]); l.new(sep.outputs["X"], at.inputs[1])
l.new(at.outputs["Value"], u.inputs[0]); l.new(sep.outputs["Z"], v.inputs[0])
l.new(u.outputs["Value"], comb.inputs["X"]); l.new(v.outputs["Value"], comb.inputs["Y"])
l.new(comb.outputs["Vector"], tex.inputs["Vector"])
l.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Metallic"].default_value = 0.4
bsdf.inputs["Roughness"].default_value = 0.3
bsdf.inputs["Coat Weight"].default_value = 0.9
# gotas de condensação: ruído fino como relevo
noise = n.new("ShaderNodeTexNoise"); noise.inputs["Scale"].default_value = 420; noise.inputs["Detail"].default_value = 2
ramp = n.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].position = 0.62; ramp.color_ramp.elements[1].position = 0.7
bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35
l.new(noise.outputs["Fac"], ramp.inputs["Fac"]); l.new(ramp.outputs["Color"], bump.inputs["Height"])
l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
body.data.materials.append(m)

drop_m, dn, dl = mat("Gota")
db = dn["Principled BSDF"]; db.inputs["Transmission Weight"].default_value = 1.0
db.inputs["Roughness"].default_value = 0.02; db.inputs["IOR"].default_value = 1.33
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0009, location=(0, 0, -5))
drop = bpy.context.object; drop.scale.z = 1.25; drop.data.materials.append(drop_m); bpy.ops.object.shade_smooth()
ps = body.modifiers.new("gotas", "PARTICLE_SYSTEM").particle_system.settings
ps.type = "HAIR"; ps.count = 1400; ps.hair_length = 0.001; ps.emit_from = "FACE"; ps.use_emit_random = True
ps.render_type = "OBJECT"; ps.instance_object = drop; ps.particle_size = 1.0; ps.size_random = 0.7
ps.use_rotations = True; ps.rotation_mode = "NOR"

alu, an, al = mat("Aluminio")
an["Principled BSDF"].inputs["Metallic"].default_value = 1.0
an["Principled BSDF"].inputs["Roughness"].default_value = 0.18
an["Principled BSDF"].inputs["Base Color"].default_value = (0.82, 0.82, 0.86, 1)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.0268, depth=0.008, location=(0, 0, 0.154))
lid = bpy.context.object; lid.data.materials.append(alu); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_torus_add(major_radius=0.0268, minor_radius=0.002, location=(0, 0, 0.1575))
rim = bpy.context.object; rim.data.materials.append(alu); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.0255, depth=0.006, location=(0, 0, -0.002))
base = bpy.context.object; base.data.materials.append(alu); bpy.ops.object.shade_smooth()

can = bpy.data.objects.new("LataRig", None); sc.collection.objects.link(can)
for o in (body, lid, rim, base):
    o.parent = can
can.location = (0, 0, 0.02)
def spin(z0, z1, f1, tilt=(-4, 7)):
    can.rotation_euler = (math.radians(tilt[0]), math.radians(tilt[1]), math.radians(z0)); can.keyframe_insert("rotation_euler", frame=1)
    can.rotation_euler = (math.radians(tilt[0]), math.radians(tilt[1]), math.radians(z1)); can.keyframe_insert("rotation_euler", frame=f1)
if SHOT == "A":
    sc.frame_end = 60; spin(-35, -5, 60, (0, 0))
elif SHOT == "B":
    sc.frame_end = 90; spin(-120, -8, 90)
else:
    sc.frame_end = 1; spin(-8, -8, 2, (0, 0))

# --- Gelo: cubos de vidro em volta -------------------------------------------
ice, inn, il = mat("Gelo")
ib = inn["Principled BSDF"]
ib.inputs["Transmission Weight"].default_value = 1.0
ib.inputs["Roughness"].default_value = 0.08
ib.inputs["IOR"].default_value = 1.31
ib.inputs["Base Color"].default_value = (0.95, 0.9, 1.0, 1)
ice_spots = [(0.075, -0.03, 0.13, 0.016), (-0.07, 0.02, 0.17, 0.013), (0.065, 0.03, 0.03, 0.012), (-0.075, -0.04, 0.05, 0.015), (0.02, -0.06, 0.24, 0.012), (-0.03, -0.07, 0.3, 0.014)]
for i, (x, y, z, sz) in enumerate(ice_spots if SHOT == "B" else ice_spots[:2] if SHOT == "D" else []):
    bpy.ops.mesh.primitive_cube_add(size=sz * 2, location=(x, y, z + (0.25 if SHOT == "B" else 0)), rotation=(i * 0.7, i * 1.1, i * 0.4))
    c = bpy.context.object
    bev = c.modifiers.new("b", "BEVEL"); bev.width = sz * 0.25; bev.segments = 3
    c.data.materials.append(ice)
    if SHOT == "B":
        start = 1 + i * 8
        c.keyframe_insert("location", frame=start); c.keyframe_insert("rotation_euler", frame=start)
        c.location.z -= 0.45; c.rotation_euler.x += 2.2; c.rotation_euler.z += 1.4
        c.keyframe_insert("location", frame=start + 80); c.keyframe_insert("rotation_euler", frame=start + 80)

# --- Estúdio: fundo roxo infinito + luzes de recorte ---------------------------
bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0.6, 0.5), rotation=(math.radians(90), 0, 0))
bg = bpy.context.object
bgm, bn, bl = mat("Fundo")
grad = bn.new("ShaderNodeTexGradient"); grad.gradient_type = "SPHERICAL"
mapn = bn.new("ShaderNodeMapping"); coord = bn.new("ShaderNodeTexCoord")
mapn.inputs["Location"].default_value = (0, -0.25, 0); mapn.inputs["Scale"].default_value = (1.2, 1.2, 1)
cr = bn.new("ShaderNodeValToRGB")
cr.color_ramp.elements[0].color = (0.02, 0.0, 0.05, 1)
cr.color_ramp.elements[1].color = (0.55, 0.05, 0.42, 1)
em = bn.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 1.2
bl.new(coord.outputs["Object"], mapn.inputs["Vector"]); bl.new(mapn.outputs["Vector"], grad.inputs["Vector"])
bl.new(grad.outputs["Fac"], cr.inputs["Fac"]); bl.new(cr.outputs["Color"], em.inputs["Color"])
out = bn["Material Output"]; bl.new(em.outputs["Emission"], out.inputs["Surface"])
bg.data.materials.append(bgm)

def area(name, loc, rot, color, power, size):
    ld = bpy.data.lights.new(name, "AREA"); ld.color = color; ld.energy = power; ld.size = size
    o = bpy.data.objects.new(name, ld); o.location = loc; o.rotation_euler = rot; sc.collection.objects.link(o)
    return o
area("Chave", (-0.35, -0.35, 0.3), (math.radians(60), 0, math.radians(-45)), (1.0, 0.95, 0.88), 12, 0.35)
strip = area("Faixa", (-0.12, -0.3, 0.09), (math.radians(90), 0, math.radians(-20)), (1, 1, 1), 18, 0.02)
strip.data.shape = "RECTANGLE"; strip.data.size = 0.015; strip.data.size_y = 0.4
area("RecorteMagenta", (0.25, 0.25, 0.2), (math.radians(-70), 0, math.radians(135)), (1.0, 0.2, 0.7), 22, 0.2)
area("RecorteLaranja", (-0.25, 0.22, 0.25), (math.radians(-65), 0, math.radians(-140)), (1.0, 0.55, 0.1), 18, 0.2)
area("Topo", (0, 0, 0.45), (0, 0, 0), (1, 1, 1), 6, 0.3)
w = bpy.data.worlds.new("Mundo"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.0, 0.06, 1)

# --- Câmera: 85 mm, foco na lata, empurrão lento ------------------------------
cd = bpy.data.cameras.new("Cam"); cd.lens = 85; cd.dof.use_dof = True; cd.dof.aperture_fstop = 2.8
cam = bpy.data.objects.new("Cam", cd); sc.collection.objects.link(cam); sc.camera = cam
if SHOT == "A":
    cd.lens = 60; cd.dof.aperture_fstop = 2.0
    cam.location = (0.01, -0.2, 0.3); cam.rotation_euler = (math.radians(57), 0, math.radians(3)); cam.keyframe_insert("location", frame=1)
    cam.location = (0.0, -0.17, 0.28); cam.keyframe_insert("location", frame=60)
elif SHOT == "B":
    cam.location = (0, -0.82, 0.095); cam.rotation_euler = (math.radians(88), 0, 0); cam.keyframe_insert("location", frame=1)
    cam.location = (0, -0.68, 0.095); cam.keyframe_insert("location", frame=90)
    sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5
else:
    cam.location = (0, -0.74, 0.095); cam.rotation_euler = (math.radians(88), 0, 0)
cd.dof.focus_object = lid if SHOT == "A" else body

if SEQ:
    sc.render.filepath = os.path.join(HERE, SEQ, "f_")
    sc.render.image_settings.file_format = "PNG"
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    bpy.ops.render.render(animation=True)
else:
    sc.frame_set(FRAME)
    sc.render.filepath = os.path.join(HERE, OUT)
    bpy.ops.render.render(write_still=True)
print("RENDER", sc.render.filepath)
