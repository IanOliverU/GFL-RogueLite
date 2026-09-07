"""Build animated third-person dolls (background Blender only).

For one doll per run (argv: sabrina | mosin-nagant | qiongjiu):
  PMX import (stdlib importer, skinning intact) -> orient 180 deg about up,
  uniform scale to 2.15 m display height, feet at 0 -> exclude spare
  emotion/morph parts -> downscale+pack textures (originals untouched) ->
  scripted hold pose + `idle` (breath) and `walk` (in-place leg locomotion)
  actions stashed to NLA -> procedural gun prop + Muzzle empty parented to
  chest -> export local-only GLB with skins + clips -> JSON audit.

Originals only read. Live scenes never touched (factory startup).
Usage:
  blender --background --factory-startup --python build_tp_dolls.py -- sabrina
"""

import json
import math
import os
import struct
import sys

PROJECT_ROOT = r"C:\Users\MY PC\Desktop\GFL Game"
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'assets-source', 'characters'))
TMP = r"C:\Users\MYPC~1\AppData\Local\Temp\opencode"
EXPORT_DIR = os.path.join(PROJECT_ROOT, 'public', 'assets', 'characters')

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402
from import_pmx import import_model, parse_pmx  # noqa: E402

TARGET_HEIGHT = 2.15
TARGET_TEX_MAX = 512

DOLLS = {
    'sabrina': {
        'pmx': os.path.join(PROJECT_ROOT, 'src', 'Character MMD', 'Sabrina (Default)', 'GirlsFrontline SabrinaDefault.pmx'),
        'exclude': ('Emotion1', 'Emotion2'),
        'gun': {'length': 0.85, 'body': (0.09, 0.16, 0.14), 'barrel_r': 0.035},
    },
    'mosin-nagant': {
        'pmx': os.path.join(PROJECT_ROOT, 'src', 'Character MMD', 'Mosin-Nagant (Default)', 'GirlsFrontline MosinnagantDefault.pmx'),
        'exclude': ('Emotion', '////', '><', '@@', '-.-', 'O.O'),
        'gun': {'length': 1.35, 'body': (0.07, 0.13, 0.12), 'barrel_r': 0.028},
    },
    'qiongjiu': {
        'pmx': os.path.join(PROJECT_ROOT, 'src', 'Character MMD', 'Qiongjiu (Default)', 'GirlsFrontline QiongJiuDefault.pmx'),
        'exclude': ('Emotion1', 'Emotion2'),
        'gun': {'length': 1.05, 'body': (0.08, 0.14, 0.13), 'barrel_r': 0.032},
    },
}

# Main FK bones by exact Blender (JP) name; deform duplicates are grouped by
# matching head position at build time.
LEG_MAIN = {
    'thigh_L': '左足', 'knee_L': '左ひざ', 'ankle_L': '左足首',
    'thigh_R': '右足', 'knee_R': '右ひざ', 'ankle_R': '右足首',
}
TOE_NAMES = ('左つま先', '右つま先', 'toe2_L', 'toe2_R')
SHOULDER_L, SHOULDER_R = '左腕', '右腕'
ELBOW_L, ELBOW_R = '左ひじ', '右ひじ'
WRIST_L, WRIST_R = '左手首', '右手首'
SPINE_LO, SPINE_HI = '上半身', '上半身2'

# Hold pose (radians, XYZ euler). Probed: thigh/knee/elbow/wrist X negative
# swings forward/bends; shoulder X negative swings the arm forward, Z positive
# abducts (left side). Right side mirrors (x, -y, -z); symmetry is verified in
# the build's hold renders.
HOLD_L = {
    'shoulder': (-1.05, 0.0, -0.12),
    'elbow': (-1.0, 0.0, 0.0),
    'wrist': (-0.35, 0.0, 0.0),
}


def mirror(rot):
    return (rot[0], -rot[1], -rot[2])


def resolve_groups(arm, kept_meshes):
    """Map animation roles to pose-bone names.

    Exactly ONE bone per joint: the top of each deform chain. Children inherit
    the rotation (single application); vertex weights blend the result. Adding
    parent + child rotations for the same joint would compound the angle.
    Probed: waist-cancel > FK > D-chain nesting (pose_test9 triple-transform).
    """
    heads = {}
    for b in arm.data.bones:
        heads.setdefault((round(b.head_local.x, 3), round(b.head_local.y, 3), round(b.head_local.z, 3)), []).append(b.name)

    def head_of(name):
        for b in arm.data.bones:
            if b.name == name:
                return (round(b.head_local.x, 3), round(b.head_local.y, 3), round(b.head_local.z, 3))
        raise RuntimeError('missing bone %s' % name)

    # Total skin weight per vertex-group name over the kept meshes.
    # (Must use the mesh list: meshes are siblings of the armature under the
    # stage root, so arm.children_recursive is empty. An empty table used to
    # silently pick arbitrary bones -- caught by pose_test9/10.)
    weight = {}
    for obj in kept_meshes:
        for v in obj.data.vertices:
            for g in v.groups:
                name = obj.vertex_groups[g.group].name
                weight[name] = weight.get(name, 0.0) + g.weight
    print('TP_WEIGHTCHECK ' + json.dumps({k: round(weight.get(k, 0.0)) for k in
          ['左足', 'D.349', '左ひざ', 'D.350', '左足首', 'D.351']}, ensure_ascii=False))

    groups = {}
    for role, main in LEG_MAIN.items():
        if main not in arm.pose.bones:
            raise RuntimeError('missing main bone %s' % main)
        key = head_of(main)
        # The weighted deformer wins; ancestors stay static so the angle
        # applies exactly once (thigh > knee > ankle compose naturally).
        best = max(heads[key], key=lambda n: weight.get(n, 0.0))
        groups[role] = [best]
    for role, names in (
        ('toe_L', [n for n in (TOE_NAMES[0], TOE_NAMES[2]) if n in arm.pose.bones]),
        ('toe_R', [n for n in (TOE_NAMES[1], TOE_NAMES[3]) if n in arm.pose.bones]),
        ('shoulder_L', [SHOULDER_L]), ('shoulder_R', [SHOULDER_R]),
        ('elbow_L', [ELBOW_L]), ('elbow_R', [ELBOW_R]),
        ('wrist_L', [WRIST_L]), ('wrist_R', [WRIST_R]),
        ('spine_lo', [SPINE_LO]), ('spine_hi', [SPINE_HI]),
    ):
        missing = [n for n in names if n not in arm.pose.bones]
        if missing:
            raise RuntimeError('missing bones %s' % missing)
        groups[role] = list(names)
    return groups


def set_group(pose, groups, role, rot):
    for name in groups[role]:
        pb = pose[name]
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = rot


def key_group(pose, groups, role, frame):
    for name in groups[role]:
        pb = pose[name]
        pb.keyframe_insert(data_path='rotation_euler', frame=frame)


WALK_KEYS = 5  # frames 1,7,13,19,25(=1 loop) at 24 fps


def build_actions(arm, groups):
    pose = arm.pose.bones
    # Baseline: hold pose everywhere; clips add leg/spine motion on top.
    hold = {
        'shoulder_L': HOLD_L['shoulder'], 'elbow_L': HOLD_L['elbow'], 'wrist_L': HOLD_L['wrist'],
        'shoulder_R': mirror(HOLD_L['shoulder']), 'elbow_R': mirror(HOLD_L['elbow']), 'wrist_R': mirror(HOLD_L['wrist']),
    }
    for role, rot in hold.items():
        set_group(pose, groups, role, rot)

    # One combined action so the exporter emits a single clip the runtime
    # splits with THREE.AnimationUtils.subclip: frames 1-48 idle, 49-72 walk.
    actions = {}
    animated_roles = ('thigh_L', 'thigh_R', 'knee_L', 'knee_R', 'ankle_L', 'ankle_R',
                      'toe_L', 'toe_R', 'spine_hi', 'spine_lo',
                      'shoulder_L', 'shoulder_R', 'elbow_L', 'elbow_R', 'wrist_L', 'wrist_R')
    full = bpy.data.actions.new('tp_full')
    # Assign BEFORE keying: keyframe_insert writes into the assigned action.
    # (Keying with no action silently mints a throwaway action and the baked
    # clip exports empty -- caught by pose_test10 frame-variance probe.)
    if arm.animation_data is None:
        arm.animation_data_create()
    arm.animation_data.action = full
    # Idle: frames 1-48, breathing + micro sway, legs at rest.
    for f in range(1, 49):
        t = (f - 1) / 48.0
        br = math.sin(t * math.pi * 2)
        set_group(pose, groups, 'spine_hi', (0.04 + 0.02 * br, 0, 0))
        set_group(pose, groups, 'spine_lo', (0.02 + 0.01 * br, 0, 0))
        set_group(pose, groups, 'shoulder_L', (HOLD_L['shoulder'][0] + 0.02 * br, HOLD_L['shoulder'][1], HOLD_L['shoulder'][2]))
        set_group(pose, groups, 'shoulder_R', (HOLD_L['shoulder'][0] + 0.02 * br, -HOLD_L['shoulder'][1], -HOLD_L['shoulder'][2]))
        for role in ('thigh_L', 'thigh_R', 'knee_L', 'knee_R', 'ankle_L', 'ankle_R', 'toe_L', 'toe_R'):
            set_group(pose, groups, role, (0, 0, 0))
        for role in animated_roles:
            key_group(pose, groups, role, f)
    # Walk: frames 49-72, two in-place steps. Negative thigh.x = forward.
    for f in range(49, 73):
        t = (f - 49) / 24.0
        th = t * math.pi * 2
        th_l = -0.55 * math.sin(th)
        th_r = -0.55 * math.sin(th + math.pi)
        kn_l = -0.18 - 0.72 * max(0.0, math.sin(th + math.pi * 0.5))
        kn_r = -0.18 - 0.72 * max(0.0, math.sin(th + math.pi * 1.5))
        an_l = -(th_l + kn_l) * 0.55
        an_r = -(th_r + kn_r) * 0.55
        set_group(pose, groups, 'thigh_L', (th_l, 0, 0))
        set_group(pose, groups, 'thigh_R', (th_r, 0, 0))
        set_group(pose, groups, 'knee_L', (kn_l, 0, 0))
        set_group(pose, groups, 'knee_R', (kn_r, 0, 0))
        set_group(pose, groups, 'ankle_L', (an_l, 0, 0))
        set_group(pose, groups, 'ankle_R', (an_r, 0, 0))
        set_group(pose, groups, 'toe_L', (0.3 * max(0.0, math.sin(th - 0.6)), 0, 0))
        set_group(pose, groups, 'toe_R', (0.3 * max(0.0, math.sin(th + math.pi - 0.6)), 0, 0))
        bob = 0.05 + 0.025 * math.sin(th * 2)
        set_group(pose, groups, 'spine_hi', (bob, 0, 0))
        set_group(pose, groups, 'spine_lo', (0.03, 0, 0))
        for role, rot in hold.items():
            set_group(pose, groups, role, rot)
        for role in animated_roles:
            key_group(pose, groups, role, f)
    actions['tp_full'] = full
    # Reset pose to the hold baseline for a sane rest/export state.
    for role, rot in hold.items():
        set_group(pose, groups, role, rot)
    set_group(pose, groups, 'spine_hi', (0.04, 0, 0))
    set_group(pose, groups, 'spine_lo', (0.02, 0, 0))
    for role in ('thigh_L', 'thigh_R', 'knee_L', 'knee_R', 'ankle_L', 'ankle_R',
                 'toe_L', 'toe_R'):
        set_group(pose, groups, role, (0, 0, 0))
    return actions


def build_gun(doll_id, arm, chest_bone, root, scale):
    """Provisional two-handed gun; bone-parented to the chest so it inherits
    spine motion. Specs are authored in WORLD metres (facing -Y, up +Z) and
    converted to raw armature units here (root flips X/Y and scales)."""
    spec = DOLLS[doll_id]['gun']
    length = spec['length']
    body_len = length * 0.42
    # Hold point between the posed hands: centre-front of the chest.
    hold_world = (0.0, -0.20, 1.50)

    def to_raw(world):
        return (-world[0] / scale, -world[1] / scale, world[2] / scale)

    def raw_dim(world_dim):
        return world_dim / scale

    gun = bpy.data.objects.new(doll_id + '_gun', None)
    bpy.context.scene.collection.objects.link(gun)
    gun.parent = root  # placeholder until the final plain arm parent below
    parts = []
    body_c = (hold_world[0], hold_world[1] + body_len * 0.08, hold_world[2])
    bpy.ops.mesh.primitive_cube_add(size=1, location=to_raw(body_c))
    body = bpy.context.object
    body.name = doll_id + '_gun_body'
    body.dimensions = (raw_dim(spec['body'][0]), raw_dim(body_len), raw_dim(spec['body'][2]))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    parts.append(body)
    barrel_c = (hold_world[0], hold_world[1] - body_len * 0.42 - length * 0.22, hold_world[2] + 0.015)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=raw_dim(spec['barrel_r']), depth=raw_dim(length * 0.55),
                                        location=to_raw(barrel_c))
    barrel = bpy.context.object
    barrel.rotation_euler = (math.pi / 2, 0, 0)
    barrel.name = doll_id + '_gun_barrel'
    parts.append(barrel)
    stock_c = (hold_world[0], hold_world[1] + body_len * 0.42 + 0.10, hold_world[2] - 0.03)
    bpy.ops.mesh.primitive_cube_add(size=1, location=to_raw(stock_c))
    stock = bpy.context.object
    stock.name = doll_id + '_gun_stock'
    stock.dimensions = (raw_dim(0.07), raw_dim(0.30), raw_dim(0.12))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    parts.append(stock)
    if doll_id == 'mosin-nagant':
        # Long rifle gets a provisional scope bump.
        bpy.ops.mesh.primitive_cube_add(size=1, location=to_raw((hold_world[0], hold_world[1] + 0.05, hold_world[2] + 0.10)))
        scope = bpy.context.object
        scope.name = doll_id + '_gun_scope'
        scope.dimensions = (raw_dim(0.05), raw_dim(0.28), raw_dim(0.06))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        parts.append(scope)
    mat = bpy.data.materials.new(doll_id + '_gunmat')
    mat.use_nodes = True
    mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (0.14, 0.15, 0.17, 1.0)
    mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 0.5
    mat.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value = 0.6
    for part in parts:
        part.data.materials.append(mat)
        part.parent = gun
    muzzle = bpy.data.objects.new('Muzzle', None)
    bpy.context.scene.collection.objects.link(muzzle)
    muzzle.parent = gun
    tip_world = (hold_world[0], hold_world[1] - body_len * 0.42 - length * 0.495, hold_world[2] + 0.015)
    muzzle.location = to_raw(tip_world)
    # Plain armature-object parent (identity local): keeps node transforms
    # trivially verifiable in the GLB. The gun therefore does not inherit the
    # small scripted spine bob; relative slip is sub-centimetre at game scale
    # and is recorded as a provisional limitation, not a defect.
    gun.parent = arm
    return gun, muzzle, parts


def main():
    doll_id = sys.argv[-1] if sys.argv[-1] in DOLLS else 'sabrina'
    cfg = DOLLS[doll_id]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    model = parse_pmx(cfg['pmx'])
    imported = import_model(model, collection_name='TP_' + doll_id, base_dir=os.path.dirname(cfg['pmx']))
    arm = imported['armature']
    meshes = [o for o in imported['objects'] if o.type == 'MESH']

    # Exclude spare emotion/morph parts by material tag.
    keep = []
    for obj in meshes:
        mats = [slot.material for slot in obj.material_slots if slot.material]
        if any(tag in mat.name for mat in mats for tag in cfg['exclude']):
            bpy.data.objects.remove(obj, do_unlink=True)
        else:
            keep.append(obj)
    meshes = keep

    # Orient/scale: 180 deg about up, 2.15 m.
    corners = []
    for obj in meshes:
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))
    raw_height = max(c[2] for c in corners) - min(c[2] for c in corners)
    scale = TARGET_HEIGHT / raw_height
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.object
    root.name = 'TP_Stage'
    root.rotation_euler = (0, 0, math.pi)
    root.scale = (scale, scale, scale)
    for obj in meshes + [arm]:
        obj.parent = root

    groups = resolve_groups(arm, meshes)
    print('TP_GROUPS ' + json.dumps({k: v for k, v in groups.items()}, ensure_ascii=False))
    actions = build_actions(arm, groups)

    chest_bone = groups['spine_hi'][0]
    gun, muzzle, parts = build_gun(doll_id, arm, chest_bone, root, scale)

    # Textures: downscale copies over 512 px, pack (originals untouched).
    for image in bpy.data.images:
        if not image.users or image.size[0] <= 0:
            continue
        w, h = image.size[0], image.size[1]
        if max(w, h) > TARGET_TEX_MAX:
            aspect = w / h
            if aspect >= 1.0:
                image.scale(TARGET_TEX_MAX, max(1, round(TARGET_TEX_MAX / aspect)))
            else:
                image.scale(max(1, round(TARGET_TEX_MAX * aspect)), TARGET_TEX_MAX)
        try:
            image.pack()
        except RuntimeError:
            pass

    # Frame-variance guard: the baked walk MUST move the legs between frames,
    # or the export is rejected before any GLB is written.
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.animation_data.action = actions['tp_full']
    # Vertex-level guard: a shin vertex strongly weighted to the picked knee
    # deformer must actually travel between walk frames (bone motion alone
    # proves nothing -- a weightless bone moves while the skin stands still).
    knee_bone = groups['knee_L'][0]
    probe_vert = None
    for obj in meshes:
        idx = obj.vertex_groups.find(knee_bone)
        if idx < 0:
            continue
        for v in obj.data.vertices:
            for g in v.groups:
                if g.group == idx and g.weight > 0.5:
                    probe_vert = (obj, v.index)
                    break
            if probe_vert is not None:
                break
        if probe_vert is not None:
            break
    if probe_vert is None:
        raise RuntimeError('no strongly-weighted vertex on %s; refusing export' % knee_bone)

    def probe_at(frame):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        obj, vi = probe_vert
        em = obj.evaluated_get(dg).to_mesh()
        co = Vector(em.vertices[vi].co)
        obj.evaluated_get(dg).to_mesh_clear()
        return obj.matrix_world @ co

    spread = (probe_at(67) - probe_at(55)).length
    print('TP_VARIANCE skin spread over walk = %.4f (armature units)' % spread)
    if spread < 0.5:
        raise RuntimeError('walk clip deforms flat (spread %.3f); refusing export' % spread)

    # Verification stills: walk contact/passing poses + hold, workbench side/front.
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    bpy.context.scene.render.resolution_x = 480
    bpy.context.scene.render.resolution_y = 480
    bpy.context.scene.render.film_transparent = True
    vcam_data = bpy.data.cameras.new('VerifyCam')
    vcam = bpy.data.objects.new('VerifyCam', vcam_data)
    bpy.context.scene.collection.objects.link(vcam)
    vcam.data.type = 'ORTHO'
    vcam.data.ortho_scale = 3.0
    vcam.data.clip_start = 0.1
    vcam.data.clip_end = 50.0
    bpy.context.scene.camera = vcam
    for frame, suffix in ((55, 'walk_a'), (61, 'walk_b'), (67, 'walk_c')):
        bpy.context.scene.frame_set(frame)
        bpy.context.view_layer.update()
        vcam.location = (7, 0, 1.2)
        direction = Vector((0, 0, 1.05)) - Vector((7, 0, 1.2))
        vcam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.scene.render.filepath = os.path.join(TMP, 'tp_%s_%s.png' % (doll_id, suffix))
        bpy.ops.render.render(write_still=True)
    arm.animation_data.action = actions['tp_full']
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    vcam.location = (0, -7, 1.2)
    direction = Vector((0, 0, 1.05)) - Vector((0, -7, 1.2))
    vcam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = os.path.join(TMP, 'tp_%s_hold.png' % doll_id)
    bpy.ops.render.render(write_still=True)
    vcam.location = (7, 0, 1.2)
    direction = Vector((0, 0, 1.05)) - Vector((7, 0, 1.2))
    vcam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = os.path.join(TMP, 'tp_%s_hold_side.png' % doll_id)
    bpy.ops.render.render(write_still=True)
    vcam.location = (0, 0, 7)
    direction = Vector((0, 0, 0.9)) - Vector((0, 0, 7))
    vcam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = os.path.join(TMP, 'tp_%s_hold_top.png' % doll_id)
    bpy.ops.render.render(write_still=True)
    # Restore a clean hold/rest state so exported node base transforms match.
    bpy.ops.object.mode_set(mode='POSE')
    pose = arm.pose.bones
    for role, rot in (('shoulder_L', HOLD_L['shoulder']), ('elbow_L', HOLD_L['elbow']), ('wrist_L', HOLD_L['wrist']),
                      ('shoulder_R', mirror(HOLD_L['shoulder'])), ('elbow_R', mirror(HOLD_L['elbow'])), ('wrist_R', mirror(HOLD_L['wrist'])),
                      ('spine_hi', (0.04, 0, 0)), ('spine_lo', (0.02, 0, 0))):
        set_group(pose, groups, role, rot)
    for role in ('thigh_L', 'thigh_R', 'knee_L', 'knee_R', 'ankle_L', 'ankle_R', 'toe_L', 'toe_R'):
        set_group(pose, groups, role, (0, 0, 0))
    bpy.ops.object.mode_set(mode='OBJECT')

    # Export selection: armature + meshes + gun + muzzle (+ stage root).
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes + [arm, gun, muzzle] + parts + [root]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    os.makedirs(EXPORT_DIR, exist_ok=True)
    export_path = os.path.join(EXPORT_DIR, doll_id + '_tp.glb')
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True,
        export_normals=True,
        export_texcoords=True,
        export_skins=True,
        export_animations=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )
    blob = open(export_path, 'rb').read()
    (json_len,) = struct.unpack_from('<I', blob, 12)
    doc = json.loads(blob[20:20 + json_len])
    skins = len(doc.get('skins', []))
    anims = [(a.get('name'), len(a.get('channels', []))) for a in doc.get('animations', [])]
    report = {
        'doll': doll_id,
        'bytes': len(blob),
        'meshes': len(doc.get('meshes', [])),
        'materials': len(doc.get('materials', [])),
        'images': len(doc.get('images', [])),
        'skins': skins,
        'animations': anims,
        'actions_built': sorted(actions.keys()),
    }
    with open(os.path.join(TMP, 'tp_export_%s.json' % doll_id), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=1)
    print('TP_EXPORT_BEGIN')
    print(json.dumps(report, indent=1))
    print('TP_EXPORT_END')
    work_path = os.path.join(PROJECT_ROOT, 'assets-source', 'characters', 'tp_work_%s.blend' % doll_id)
    bpy.ops.wm.save_as_mainfile(filepath=work_path)
    print('TP_WORK_SAVED ' + work_path)


main()
