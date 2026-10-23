"""FAÍSCA v2: estúdio escuro, lata realista, líquido em espiral, respingos e frutas.

blender -b -P cena.py -- --shot HERO --frame 40 --out teste.png [--res W H] [--samples N]
blender -b -P cena.py -- --shot SPLASH --seq splash        (renderiza a tomada inteira)

Tomadas: MACRO (50 q), SPLASH (90 q), FRUTA (80 q), HERO (60 q, depois congela).
"""
import bpy, bmesh, sys, math, os, random
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default, n=1, cast=str):
    if name in argv:
        i = argv.index(name)
        vals = [cast(v) for v in argv[i + 1:i + 1 + n]]
        return vals if n > 1 else vals[0]
    return default
SHOT = arg("--shot", "HERO")
OUT = arg("--out", "teste.png")
FRAME = arg("--frame", 1, cast=int)
RES = arg("--res", [864, 1536], 2, int)
SAMPLES = arg("--samples", 48, cast=int)
SEQ = arg("--seq", "")
HERE = os.path.dirname(os.path.abspath(__file__))
LEN = {"MACRO": 50, "SPLASH": 90, "FRUTA": 80, "HERO": 60}[SHOT]
rnd = random.Random(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.fps = 30
sc.frame_start, sc.frame_end = 1, LEN
sc.render.engine = "CYCLES"
cy = sc.cycles
cy.device = "CPU"; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.05
cy.use_denoising = True; cy.denoiser = "OPENIMAGEDENOISE"
cy.max_bounces = 10; cy.transmission_bounces = 10; cy.glossy_bounces = 4; cy.diffuse_bounces = 2
cy.transparent_max_bounces = 8; cy.caustics_reflective = False; cy.caustics_refractive = False
cy.blur_glossy = 1.0
sc.render.use_persistent_data = True
sc.view_settings.view_transform = "Khronos PBR Neutral"
sc.view_settings.exposure = -0.4
sc.render.film_transparent = False


def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links, m.node_tree.nodes["Principled BSDF"]

def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

def link(o):
    sc.collection.objects.link(o); return o

def key_series(obj, path, values, start=1):
    for i, v in enumerate(values):
        setattr(obj, path, v); obj.keyframe_insert(path, frame=start + i)


# ------------------------------------------------------------------ materiais
alu, an, al, ab = mat("Aluminio")
ab.inputs["Base Color"].default_value = (0.7, 0.7, 0.74, 1)
ab.inputs["Metallic"].default_value = 1.0; ab.inputs["Roughness"].default_value = 0.16
ab.inputs["Anisotropic"].default_value = 0.6

# Rótulo: tinta sobre alumínio (metálico) + verniz; fora da faixa do rótulo vira alumínio.
lab, n, l, b = mat("Rotulo")
tex = n.new("ShaderNodeTexImage"); tex.image = bpy.data.images.load(os.path.join(HERE, "..", "3d", "rotulo.png"))
tex.interpolation = "Cubic"
tc = n.new("ShaderNodeTexCoord"); sep = n.new("ShaderNodeSeparateXYZ")
at = n.new("ShaderNodeMath"); at.operation = "ARCTAN2"
u = n.new("ShaderNodeMath"); u.operation = "MULTIPLY_ADD"; u.inputs[1].default_value = 1 / (2 * math.pi); u.inputs[2].default_value = 0.5
v = n.new("ShaderNodeMapRange"); v.inputs["From Min"].default_value = 0.010; v.inputs["From Max"].default_value = 0.131
comb = n.new("ShaderNodeCombineXYZ")
l.new(tc.outputs["Object"], sep.inputs["Vector"])
l.new(sep.outputs["Y"], at.inputs[0]); l.new(sep.outputs["X"], at.inputs[1])
l.new(at.outputs["Value"], u.inputs[0]); l.new(sep.outputs["Z"], v.inputs["Value"])
l.new(u.outputs["Value"], comb.inputs["X"]); l.new(v.outputs["Result"], comb.inputs["Y"])
l.new(comb.outputs["Vector"], tex.inputs["Vector"])
# máscara: 1 dentro da altura do rótulo
lo = n.new("ShaderNodeMath"); lo.operation = "GREATER_THAN"; lo.inputs[1].default_value = 0.010
hi = n.new("ShaderNodeMath"); hi.operation = "LESS_THAN"; hi.inputs[1].default_value = 0.131
mk = n.new("ShaderNodeMath"); mk.operation = "MULTIPLY"
l.new(sep.outputs["Z"], lo.inputs[0]); l.new(sep.outputs["Z"], hi.inputs[0])
l.new(lo.outputs[0], mk.inputs[0]); l.new(hi.outputs[0], mk.inputs[1])
col = n.new("ShaderNodeMix"); col.data_type = "RGBA"
col.inputs["A"].default_value = (0.86, 0.86, 0.9, 1)
l.new(mk.outputs[0], col.inputs["Factor"]); l.new(tex.outputs["Color"], col.inputs["B"])
l.new(col.outputs["Result"], b.inputs["Base Color"])
b.inputs["Metallic"].default_value = 0.55
rough = n.new("ShaderNodeMapRange"); rough.inputs["To Min"].default_value = 0.16; rough.inputs["To Max"].default_value = 0.32
l.new(mk.outputs[0], rough.inputs["Value"]); l.new(rough.outputs["Result"], b.inputs["Roughness"])
coat = n.new("ShaderNodeMath"); coat.operation = "MULTIPLY"; coat.inputs[1].default_value = 1.0
l.new(mk.outputs[0], coat.inputs[0]); l.new(coat.outputs[0], b.inputs["Coat Weight"])
b.inputs["Coat Roughness"].default_value = 0.04
# condensação fina (névoa) só no relevo
nz = n.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 900; nz.inputs["Detail"].default_value = 1
rp = n.new("ShaderNodeValToRGB"); rp.color_ramp.elements[0].position = 0.55; rp.color_ramp.elements[1].position = 0.75
bm_ = n.new("ShaderNodeBump"); bm_.inputs["Strength"].default_value = 0.12
l.new(nz.outputs["Fac"], rp.inputs["Fac"]); l.new(rp.outputs["Color"], bm_.inputs["Height"])
l.new(bm_.outputs["Normal"], b.inputs["Normal"]); l.new(bm_.outputs["Normal"], b.inputs["Coat Normal"])

agua, n, l, b = mat("Gota")
b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["Roughness"].default_value = 0.0
b.inputs["IOR"].default_value = 1.33

liq, n, l, b = mat("Refri")
b.inputs["Base Color"].default_value = (1.0, 0.78, 0.18, 1)
b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["Roughness"].default_value = 0.0
b.inputs["IOR"].default_value = 1.34
vol = n.new("ShaderNodeVolumeAbsorption"); vol.inputs["Color"].default_value = (1.0, 0.82, 0.25, 1); vol.inputs["Density"].default_value = 10
l.new(vol.outputs[0], n["Material Output"].inputs["Volume"])

gelo, n, l, b = mat("Gelo")
b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["Roughness"].default_value = 0.04
b.inputs["IOR"].default_value = 1.31
gn = n.new("ShaderNodeTexNoise"); gn.inputs["Scale"].default_value = 60
gb = n.new("ShaderNodeBump"); gb.inputs["Strength"].default_value = 0.25
l.new(gn.outputs["Fac"], gb.inputs["Height"]); l.new(gb.outputs["Normal"], b.inputs["Normal"])


# ------------------------------------------------------------------ lata (perfil girado)
prof = [(0.0, 0.0055), (0.012, 0.0045), (0.019, 0.0015), (0.0225, 0.0), (0.0262, 0.0012),
        (0.0285, 0.0055), (0.029, 0.010), (0.029, 0.1300), (0.0284, 0.1345), (0.0268, 0.1385),
        (0.0252, 0.1418), (0.0247, 0.1440), (0.0251, 0.1462), (0.0246, 0.1476), (0.0236, 0.1468),
        (0.0230, 0.1445), (0.0222, 0.1432), (0.0, 0.1432)]
me = bpy.data.meshes.new("perfil")
me.from_pydata([(r, 0, z) for r, z in prof], [(i, i + 1) for i in range(len(prof) - 1)], [])
body = link(bpy.data.objects.new("Lata", me))
scr = body.modifiers.new("giro", "SCREW"); scr.steps = 128; scr.render_steps = 128; scr.use_merge_vertices = True; scr.use_smooth_shade = True
body.data.materials.append(lab)
sub = body.modifiers.new("sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 1

# lacre (anel + língua) em cima da tampa
tab_parts = []
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.006, 0.1437))
tab = bpy.context.object; tab.scale = (0.009, 0.019, 0.0007)
bv = tab.modifiers.new("b", "BEVEL"); bv.width = 0.0035; bv.segments = 6; bv.affect = "EDGES"
tab.data.materials.append(alu); tab_parts.append(tab)
bpy.ops.mesh.primitive_torus_add(major_radius=0.0028, minor_radius=0.0006, location=(0, -0.0095, 0.1442))
hole = bpy.context.object; hole.scale = (1.0, 1.5, 1); hole.data.materials.append(alu); tab_parts.append(hole)
bpy.ops.mesh.primitive_cylinder_add(radius=0.0016, depth=0.001, location=(0, 0.0, 0.1438))
rivet = bpy.context.object; rivet.data.materials.append(alu); tab_parts.append(rivet)
for o in tab_parts: smooth(o)

# gotas de condensação (instâncias numa casca invisível)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.0291, depth=0.112, location=(0, 0, 0.07), end_fill_type="NOTHING")
casca = bpy.context.object; casca.name = "Casca"
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.0012, location=(0, 0, -5))
gota = bpy.context.object; gota.scale = (1, 1, 0.55); gota.data.materials.append(agua); smooth(gota)
ps = casca.modifiers.new("gotas", "PARTICLE_SYSTEM").particle_system
ps.seed = 3
pst = ps.settings
pst.type = "HAIR"; pst.count = 4200; pst.hair_length = 1.0; pst.emit_from = "FACE"; pst.use_emit_random = True
pst.render_type = "OBJECT"; pst.instance_object = gota; pst.particle_size = 1.0; pst.size_random = 0.75
pst.use_rotations = True; pst.rotation_mode = "NOR"; pst.phase_factor_random = 2.0
casca.show_instancer_for_render = False

rig = link(bpy.data.objects.new("LataRig", None))
for o in [body, casca] + tab_parts:
    o.parent = rig


# ------------------------------------------------------------------ estúdio
cyc = [(-3, -0.002)] + [(0.5 + 0.35 * math.sin(a), 0.35 - 0.35 * math.cos(a)) for a in [i * math.pi / 32 for i in range(17)]] + [(0.85, 3)]
cyc = [(-3, -0.002)] + [(0.5 + 0.35 * math.sin(a), -0.002 + 0.35 - 0.35 * math.cos(a)) for a in [i * math.pi / 32 for i in range(1, 17)]] + [(0.85, 3)]
cv = []; cf = []
for j, (y, z) in enumerate(cyc):
    cv += [(-3, y, z), (3, y, z)]
    if j: cf.append((2 * j - 2, 2 * j - 1, 2 * j + 1, 2 * j))
cme = bpy.data.meshes.new("cyc"); cme.from_pydata(cv, [], cf)
bg = link(bpy.data.objects.new("Ciclorama", cme)); smooth(bg)
bgm, n, l, b = mat("Fundo")
n.remove(b)
grad = n.new("ShaderNodeTexGradient"); grad.gradient_type = "SPHERICAL"
mp = n.new("ShaderNodeMapping"); co = n.new("ShaderNodeTexCoord")
mp.inputs["Location"].default_value = (0, -0.75, -0.12); mp.inputs["Scale"].default_value = (1.6, 1.6, 1.6)
cr = n.new("ShaderNodeValToRGB")
cr.color_ramp.elements[0].color = (0.002, 0.0, 0.006, 1)
cr.color_ramp.elements[1].color = (0.30, 0.015, 0.26, 1)
cr.color_ramp.elements.new(0.6).color = (0.03, 0.0, 0.05, 1)
em = n.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 1.0
# brilho só na parede: a parte do chão fica escura e brilhante (reflete a lata)
gl = n.new("ShaderNodeBsdfPrincipled"); gl.inputs["Base Color"].default_value = (0.004, 0.0, 0.01, 1); gl.inputs["Roughness"].default_value = 0.14
sepz = n.new("ShaderNodeSeparateXYZ"); fz = n.new("ShaderNodeMapRange"); fz.inputs["From Min"].default_value = 0.02; fz.inputs["From Max"].default_value = 0.2
mix = n.new("ShaderNodeMixShader")
l.new(co.outputs["Object"], sepz.inputs[0]); l.new(sepz.outputs["Z"], fz.inputs["Value"]); l.new(fz.outputs["Result"], mix.inputs[0])
l.new(gl.outputs[0], mix.inputs[1]); l.new(em.outputs[0], mix.inputs[2])
l.new(co.outputs["Object"], mp.inputs["Vector"]); l.new(mp.outputs["Vector"], grad.inputs["Vector"])
l.new(grad.outputs["Fac"], cr.inputs["Fac"]); l.new(cr.outputs["Color"], em.inputs["Color"])
l.new(mix.outputs[0], n["Material Output"].inputs["Surface"])
bg.data.materials.append(bgm)

w = bpy.data.worlds.new("Mundo"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.008, 0.0, 0.016, 1)

def area(name, loc, target, color, power, sx, sy=None):
    ld = bpy.data.lights.new(name, "AREA"); ld.color = color; ld.energy = power
    if sy: ld.shape = "RECTANGLE"; ld.size = sx; ld.size_y = sy
    else: ld.size = sx
    o = link(bpy.data.objects.new(name, ld)); o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o
C = (0, 0, 0.075)
# duas faixas altas em recorte: desenham as linhas de brilho verticais da lata
area("FaixaEsq", (-0.30, 0.10, 0.09), C, (1.0, 0.92, 0.82), 30, 0.04, 0.6)
area("FaixaDir", (0.30, 0.12, 0.09), C, (1.0, 0.4, 0.85), 35, 0.04, 0.6)
ch_ = area("Chave", (-0.25, -0.4, 0.6), C, (1.0, 0.96, 0.9), 7, 0.5); ch_.visible_glossy = False
area("Preenche", (0.4, -0.4, 0.05), C, (0.55, 0.35, 1.0), 6, 0.6)
area("Topo", (0.0, 0.05, 0.5), C, (1.0, 0.85, 0.6), 5, 0.25)
area("ContraLaranja", (-0.12, 0.35, 0.25), C, (1.0, 0.5, 0.05), 22, 0.15)


# ------------------------------------------------------------------ elementos por tomada
def cubo_gelo(loc, sz, rot):
    bpy.ops.mesh.primitive_cube_add(size=sz, location=loc, rotation=rot)
    c = bpy.context.object
    bv = c.modifiers.new("b", "BEVEL"); bv.width = sz * 0.22; bv.segments = 4
    c.modifiers.new("s", "SUBSURF").levels = 1
    c.data.materials.append(gelo); smooth(c)
    return c

def respingos(origin, count, f0, speed, spread_up, seed, rmin=0.0012, rmax=0.004, flen=60, grav=-2.2, slow=0.35):
    """Gotas de refrigerante em balística, em câmera lenta (slow < 1)."""
    r = random.Random(seed)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1, location=(0, 0, -5))
    proto = bpy.context.object; proto.data.materials.append(liq); smooth(proto)
    for k in range(count):
        a = r.uniform(0, 2 * math.pi)
        vh = speed * r.uniform(0.4, 1.0); vz = speed * spread_up * r.uniform(0.3, 1.2)
        rad = r.uniform(rmin, rmax)
        o = link(bpy.data.objects.new(f"resp{seed}_{k}", proto.data)); o.scale = (rad, rad, rad * 1.15)
        start = f0 + r.randint(0, 6)
        o.location = (0, 0, -5); o.keyframe_insert("location", frame=start - 1)
        for f in range(start, min(LEN, start + flen) + 1, 2):
            t = (f - start) / 30 * slow
            o.location = (origin[0] + math.cos(a) * vh * t, origin[1] + math.sin(a) * vh * t, origin[2] + vz * t + 0.5 * grav * t * t)
            o.keyframe_insert("location", frame=f)
    return proto

def espiral(z0, z1, voltas, r0, r1, grossura, f_in, f_dur, seed):
    """Fita de refrigerante subindo em espiral em volta da lata."""
    cu = bpy.data.curves.new("espiral", "CURVE"); cu.dimensions = "3D"
    cu.extrude = grossura * 1.1; cu.bevel_depth = grossura * 0.75; cu.bevel_resolution = 4; cu.resolution_u = 24; cu.use_fill_caps = True; cu.twist_mode = "MINIMUM"
    sp = cu.splines.new("NURBS"); N = 60; sp.points.add(N - 1)
    r = random.Random(seed)
    for i in range(N):
        t = i / (N - 1)
        ang = t * voltas * 2 * math.pi - math.pi / 2
        rad = r0 + (r1 - r0) * t + 0.002 * math.sin(t * 11 + seed)
        sp.points[i].co = (math.cos(ang) * rad, math.sin(ang) * rad, z0 + (z1 - z0) * t, 1)
        sp.points[i].radius = 0.2 + 1.2 * math.sin(math.pi * t) ** 0.6 * (1 + 0.15 * math.sin(t * 19 + seed))
        sp.points[i].tilt = math.pi / 2 + 0.5 * math.sin(t * 7 + seed)
    sp.order_u = 4; sp.use_endpoint_u = True
    o = link(bpy.data.objects.new("Espiral", cu)); o.data.materials.append(liq)
    cu.bevel_factor_mapping_end = "SPLINE"; cu.bevel_factor_mapping_start = "SPLINE"
    cu.bevel_factor_end = 0.0; cu.keyframe_insert("bevel_factor_end", frame=f_in)
    cu.bevel_factor_end = 1.0; cu.keyframe_insert("bevel_factor_end", frame=f_in + f_dur)
    return o

def maracuja(loc, rot, s=1.0):
    """Meio maracujá: casca amarela enrugada, polpa com sementes."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.034 * s, location=(0, 0, 0))
    o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_outer=True)
    bm.to_mesh(o.data); bm.free(); smooth(o)
    m, n, l, b = mat("Casca")
    b.inputs["Base Color"].default_value = (0.75, 0.42, 0.01, 1); b.inputs["Roughness"].default_value = 0.42
    b.inputs["Subsurface Weight"].default_value = 0.1
    nz = n.new("ShaderNodeTexVoronoi"); nz.inputs["Scale"].default_value = 90
    bp = n.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.3
    l.new(nz.outputs["Distance"], bp.inputs["Height"]); l.new(bp.outputs["Normal"], b.inputs["Normal"])
    o.data.materials.append(m)
    # face cortada: miolo branco (anel) + polpa
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=0.0338 * s, fill_type="NGON", location=(0, 0, 0.0001))
    face = bpy.context.object
    m2, n, l, b = mat("Miolo")
    b.inputs["Base Color"].default_value = (0.95, 0.9, 0.72, 1); b.inputs["Roughness"].default_value = 0.6
    face.data.materials.append(m2)
    # polpa: domo de gel alaranjado com relevo de bolsinhas e sementes pretas meio afundadas
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.0278 * s, location=(0, 0, 0))
    polpa = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(polpa.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, -1), clear_outer=True)
    bm.to_mesh(polpa.data); bm.free(); smooth(polpa); polpa.scale.z = 0.22
    m3, n, l, b = mat("Polpa")
    b.inputs["Base Color"].default_value = (1.0, 0.6, 0.04, 1); b.inputs["Roughness"].default_value = 0.06
    b.inputs["Subsurface Weight"].default_value = 1.0; b.inputs["Subsurface Radius"].default_value = (0.006, 0.003, 0.0005)
    b.inputs["Coat Weight"].default_value = 1.0; b.inputs["Coat Roughness"].default_value = 0.02
    vo = n.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 70 / s; vo.feature = "SMOOTH_F1"
    bp = n.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.6; bp.invert = True
    l.new(vo.outputs["Distance"], bp.inputs["Height"]); l.new(bp.outputs["Normal"], b.inputs["Normal"]); l.new(bp.outputs["Normal"], b.inputs["Coat Normal"])
    polpa.data.materials.append(m3)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0027 * s, location=(0, 0, -5))
    sem = bpy.context.object; sem.scale = (1, 0.7, 2.0); smooth(sem)
    m5, n, l, b = mat("Semente"); b.inputs["Base Color"].default_value = (0.05, 0.03, 0.015, 1); b.inputs["Roughness"].default_value = 0.05; b.inputs["Coat Weight"].default_value = 1.0
    sem.data.materials.append(m5)
    p = polpa.modifiers.new("p", "PARTICLE_SYSTEM").particle_system; p.seed = 11
    st = p.settings; st.type = "HAIR"; st.count = 75; st.hair_length = 1.0; st.emit_from = "FACE"
    st.use_emit_random = True; st.render_type = "OBJECT"; st.instance_object = sem; st.particle_size = 1.0
    st.size_random = 0.4; st.use_rotations = True; st.rotation_mode = "NOR"; st.phase_factor_random = 2.0
    polpa.show_instancer_for_render = True
    piv = link(bpy.data.objects.new("Maracuja", None))
    for c in (o, face, polpa): c.parent = piv
    piv.location = loc; piv.rotation_euler = rot
    return piv

def gengibre(loc, rot, seed, s=1.0):
    """Rodela de gengibre: casca marrom fina, miolo fibroso amarelo-claro."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.017 * s, depth=0.006 * s, location=(0, 0, 0))
    o = bpy.context.object
    r = random.Random(seed)
    for vx in o.data.vertices:
        ang = math.atan2(vx.co.y, vx.co.x)
        k = 1 + 0.12 * math.sin(3 * ang + seed) + 0.06 * math.sin(7 * ang + 2 * seed) + r.uniform(-0.02, 0.02)
        vx.co.x *= k; vx.co.y *= k
    bv = o.modifiers.new("b", "BEVEL"); bv.width = 0.0012 * s; bv.segments = 3
    smooth(o)
    m, n, l, b = mat(f"Gengibre{seed}")
    b.inputs["Base Color"].default_value = (0.96, 0.84, 0.48, 1); b.inputs["Roughness"].default_value = 0.55
    b.inputs["Subsurface Weight"].default_value = 0.3; b.inputs["Subsurface Radius"].default_value = (0.004, 0.003, 0.001)
    wv = n.new("ShaderNodeTexWave"); wv.wave_type = "RINGS"; wv.inputs["Scale"].default_value = 18; wv.inputs["Distortion"].default_value = 6
    tco = n.new("ShaderNodeTexCoord"); l.new(tco.outputs["Object"], wv.inputs["Vector"])
    bp = n.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.2
    l.new(wv.outputs["Fac"], bp.inputs["Height"]); l.new(bp.outputs["Normal"], b.inputs["Normal"])
    # borda marrom: pela normal (lados horizontais)
    geo = n.new("ShaderNodeNewGeometry"); sp = n.new("ShaderNodeSeparateXYZ")
    ab_ = n.new("ShaderNodeMath"); ab_.operation = "ABSOLUTE"
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.45, 0.3, 0.17, 1); ramp.color_ramp.elements[1].color = (0.96, 0.84, 0.48, 1)
    ramp.color_ramp.elements[0].position = 0.55; ramp.color_ramp.elements[1].position = 0.8
    vm = n.new("ShaderNodeVectorTransform"); vm.vector_type = "NORMAL"; vm.convert_from = "WORLD"; vm.convert_to = "OBJECT"
    l.new(geo.outputs["Normal"], vm.inputs[0]); l.new(vm.outputs[0], sp.inputs[0])
    l.new(sp.outputs["Z"], ab_.inputs[0]); l.new(ab_.outputs[0], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], b.inputs["Base Color"])
    o.data.materials.append(m)
    o.location = loc; o.rotation_euler = rot
    return o


# ------------------------------------------------------------------ câmera
cd = bpy.data.cameras.new("Cam"); cd.sensor_width = 36; cd.dof.use_dof = True
cam = link(bpy.data.objects.new("Cam", cd)); sc.camera = cam
alvo = link(bpy.data.objects.new("Alvo", None))
foco = link(bpy.data.objects.new("Foco", None))
tr = cam.constraints.new("TRACK_TO"); tr.target = alvo; tr.track_axis = "TRACK_NEGATIVE_Z"; tr.up_axis = "UP_Y"
cd.dof.focus_object = foco

def orbita(f, ang_deg, dist, z):
    a = math.radians(ang_deg) - math.pi / 2
    cam.location = (math.cos(a) * dist, math.sin(a) * dist, z); cam.keyframe_insert("location", frame=f)

def ease_keys(o, path, f0, v0, f1, v1):
    setattr(o, path, v0); o.keyframe_insert(path, frame=f0)
    setattr(o, path, v1); o.keyframe_insert(path, frame=f1)

def spin(f0, z0, f1, z1, tilt=(0, 0)):
    rig.rotation_euler = (math.radians(tilt[0]), math.radians(tilt[1]), math.radians(z0)); rig.keyframe_insert("rotation_euler", frame=f0)
    rig.rotation_euler = (math.radians(tilt[0]), math.radians(tilt[1]), math.radians(z1)); rig.keyframe_insert("rotation_euler", frame=f1)

sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5

if SHOT == "MACRO":
    # Gotas escorrendo no rótulo, foco desliza das gotas até o logo.
    cd.lens = 100; cd.dof.aperture_fstop = 3.2
    spin(1, 18, LEN, 6)
    orbita(1, -6, 0.27, 0.06); orbita(LEN, 4, 0.235, 0.072)
    ease_keys(alvo, "location", 1, (0.004, -0.02, 0.058), LEN, (0, -0.02, 0.07))
    ease_keys(foco, "location", 1, (0.012, -0.029, 0.05), LEN, (0.0, -0.029, 0.072))
    for i in range(5):  # gotas maiores descendo
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=0.0022, location=(0, 0, 0))
        g = bpy.context.object; g.scale = (1, 0.45, 1.5); g.data.materials.append(agua); smooth(g); g.parent = rig
        a = math.radians(-90 + (i - 2) * 9); rr = 0.0291
        z0 = 0.11 - i * 0.008
        for f, z in ((1 + i * 3, z0), (LEN, z0 - 0.02 - i * 0.004)):
            g.location = (math.cos(a) * rr, math.sin(a) * rr, z); g.keyframe_insert("location", frame=f)
        g.rotation_euler = (0, 0, a + math.pi / 2)

elif SHOT == "SPLASH":
    # Lata girando, refrigerante sobe em espiral, explosão de gotas e gelo em câmera lenta.
    cd.lens = 50; cd.dof.aperture_fstop = 5.6
    spin(1, -70, LEN, 0, (0, 0))
    orbita(1, -20, 0.52, 0.11); orbita(LEN, 4, 0.42, 0.085)
    ease_keys(alvo, "location", 1, (0, 0, 0.09), LEN, (0, 0, 0.078))
    foco.location = (0, -0.03, 0.08)
    espiral(-0.01, 0.2, 2.3, 0.05, 0.043, 0.0042, 4, 46, 2)
    respingos((0, 0, 0.17), 70, 18, 0.9, 0.9, 5)
    respingos((0, 0, 0.03), 40, 8, 0.7, 0.6, 9, rmax=0.003)
    for i, (x, y, z, s) in enumerate([(0.07, -0.04, 0.3, 0.022), (-0.08, -0.02, 0.36, 0.02), (0.05, 0.03, 0.42, 0.018)]):
        c = cubo_gelo((x, y, z), s, (i, i * 1.3, i * 0.7))
        st = 1 + i * 12
        c.keyframe_insert("location", frame=st); c.keyframe_insert("rotation_euler", frame=st)
        c.location.z -= 0.32; c.rotation_euler.x += 1.6; c.rotation_euler.y += 0.9
        c.keyframe_insert("location", frame=st + 88); c.keyframe_insert("rotation_euler", frame=st + 88)

elif SHOT == "FRUTA":
    # Maracujá e gengibre caindo em câmera lenta na frente da lata desfocada.
    cd.lens = 70; cd.dof.aperture_fstop = 2.8
    rig.location = (0.05, 0.25, -0.03); spin(1, -20, LEN, -5)
    cam.location = (0, -0.5, 0.08)
    alvo.location = (0, 0, 0.08); foco.location = (0, -0.02, 0.08)
    m1 = maracuja((0.0, -0.02, 0.2), (math.radians(50), 0, math.radians(-15)), 1.15)
    ease_keys(m1, "location", 1, (-0.015, -0.02, 0.17), LEN, (0.0, -0.02, 0.01))
    ease_keys(m1, "rotation_euler", 1, (math.radians(38), 0, math.radians(-20)), LEN, (math.radians(58), math.radians(14), math.radians(-5)))
    m2 = maracuja((0.07, 0.05, 0.3), (math.radians(-110), 0, 0), 0.9)
    ease_keys(m2, "location", 1, (0.075, 0.06, 0.25), LEN, (0.06, 0.06, 0.07))
    ease_keys(m2, "rotation_euler", 1, (math.radians(150), 0.3, 0), LEN, (math.radians(120), 0.6, 0.4))
    for i, (x, y, z) in enumerate([(-0.065, -0.05, 0.2), (0.055, -0.07, 0.24), (-0.04, 0.02, 0.3)]):
        gg = gengibre((x, y, z), (0.5 + i, 0.3 * i, 0), i + 1, 1.0 - 0.1 * i)
        ease_keys(gg, "location", 1 + i * 5, (x, y, z), LEN, (x * 1.1, y, z - 0.2))
        ease_keys(gg, "rotation_euler", 1 + i * 5, (0.5 + i, 0.3 * i, 0), LEN, (1.6 + i, 0.9 + 0.3 * i, 0.5))
    respingos((0, -0.02, 0.17), 45, 1, 0.5, 0.5, 13, rmax=0.0035, slow=0.25, grav=-1.0, flen=90)
    for i in range(2):
        cubo_gelo((-0.08 + 0.16 * i, 0.1, 0.03 + 0.06 * i), 0.022, (i, 0.4, 0.8))

else:  # HERO: arco + aproximação, assenta de frente para o logo e congela.
    cd.lens = 85; cd.dof.aperture_fstop = 5.6
    spin(1, -35, 48, 0)
    orbita(1, 22, 0.66, 0.035); orbita(54, 0, 0.56, 0.07)
    ease_keys(alvo, "location", 1, (0, 0, 0.085), 54, (0, 0, 0.083))
    foco.location = (0, -0.029, 0.08)
    respingos((0, 0, 0.0), 30, 6, 0.45, 0.8, 21, rmax=0.003, flen=50)
    for i, (x, y, s) in enumerate([(-0.06, -0.02, 0.026), (0.065, 0.01, 0.024), (0.03, -0.055, 0.018)]):
        cubo_gelo((x, y, s / 2 - 0.003), s, (0.2 * i, 0.3, 0.6 * i))
    # chão espelhado escuro (reflexo da lata)

if SEQ:
    os.makedirs(os.path.join(HERE, SEQ), exist_ok=True)
    sc.render.filepath = os.path.join(HERE, SEQ, "f_")
    sc.render.image_settings.file_format = "PNG"
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    bpy.ops.render.render(animation=True)
else:
    sc.frame_set(FRAME)
    sc.render.filepath = os.path.join(HERE, OUT)
    bpy.ops.render.render(write_still=True)
print("RENDER", sc.render.filepath)
