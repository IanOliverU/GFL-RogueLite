"""Finalize Sabrina for gameplay (background Blender only).

Opens assets-source/characters/sabrina_work.blend, anchors/orients/scales the
model, optimizes derived texture copies (originals untouched), exports the
runtime GLB plus front/side reference sprites, and saves the working file.
Derived outputs stay local (see .gitignore); originals are only read.

  blender --background <work.blend> --python finalize_sabrina.py
"""

import json
import os
import sys

PROJECT_ROOT = r"C:\Users\MY PC\Desktop\GFL Game"
WORK_PATH = os.path.join(PROJECT_ROOT, 'assets-source', 'characters', 'sabrina_work.blend')
EXPORT_DIR = os.path.join(PROJECT_ROOT, 'public', 'assets', 'characters')
EXPORT_PATH = os.path.join(EXPORT_DIR, 'sabrina.glb')
SPRITE_DIR = r"C:\Users\MYPC~1\AppData\Local\Temp\opencode"

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

TARGET_HEIGHT = 2.15
TARGET_TEX_MAX = 512
EXCLUDE_PARTS = ('Emotion1', 'Emotion2')


def main():
    # Idempotent re-runs: drop previous export duplicates, stage root, sprite cam.
    # NOTE: the armature object is also named *_Root by the importer; the
    # stage empty deliberately uses a different name so it is never removed.
    for obj in list(bpy.data.objects):
        if obj.name.endswith('_export') or obj.name in ('Sabrina_Stage', 'SpriteCam'):
            bpy.data.objects.remove(obj, do_unlink=True)
    collection = bpy.data.collections.get('Sabrina')
    meshes = [o for o in collection.objects if o.type == 'MESH'] if collection else []
    armatures = [o for o in collection.objects if o.type == 'ARMATURE'] if collection else []

    # Measure raw height before transform.
    corners = []
    for obj in meshes:
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))
    raw_height = max(c[2] for c in corners) - min(c[2] for c in corners)
    scale = TARGET_HEIGHT / raw_height

    # Root: 180 degrees about up (PMX front lands on three.js +Z), uniform scale.
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    root = bpy.context.object
    root.name = 'Sabrina_Stage'
    root.rotation_euler = (0, 0, 3.141592653589793)
    root.scale = (scale, scale, scale)
    for obj in list(meshes) + list(armatures):
        obj.parent = root

    # Export set: duplicates with armature modifiers baked, spares excluded.
    bpy.ops.object.select_all(action='DESELECT')
    export_names = []
    for obj in meshes:
        used_materials = [slot.material for slot in obj.material_slots if slot.material]
        if any(tag in mat.name for mat in used_materials for tag in EXCLUDE_PARTS):
            continue
        base = obj.name
        dup = obj.copy()
        dup.data = obj.data.copy()
        bpy.context.scene.collection.objects.link(dup)
        bpy.context.view_layer.objects.active = dup
        for modifier in list(dup.modifiers):
            try:
                modifier.show_viewport = True
                modifier.show_render = True
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            except RuntimeError:
                pass
        dup.name = base + '_export'
        dup.select_set(True)
        export_names.append(dup.name)
    bpy.context.view_layer.objects.active = bpy.data.objects[export_names[0]]

    # Derived texture optimization (originals on disk untouched).
    image_report = []
    for image in bpy.data.images:
        if not image.users or image.size[0] <= 0:
            continue
        w, h = image.size[0], image.size[1]
        entry = {'name': image.name, 'src': '%dx%d' % (w, h)}
        if max(w, h) > TARGET_TEX_MAX:
            aspect = w / h
            if aspect >= 1.0:
                image.scale(TARGET_TEX_MAX, max(1, round(TARGET_TEX_MAX / aspect)))
            else:
                image.scale(max(1, round(TARGET_TEX_MAX * aspect)), TARGET_TEX_MAX)
            entry['dst'] = '%dx%d' % (image.size[0], image.size[1])
        else:
            entry['dst'] = entry['src']
        image_report.append(entry)

    os.makedirs(EXPORT_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=EXPORT_PATH,
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True,
        export_normals=True,
        export_texcoords=True,
        export_cameras=False,
        export_lights=False,
    )

    # Reference sprites: workbench front/side at gameplay scale.
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512
    bpy.context.scene.render.film_transparent = True
    bpy.context.scene.render.filepath = os.path.join(SPRITE_DIR, 'sabrina_sprite_front.png')
    camera_data = bpy.data.cameras.new('SpriteCam')
    camera = bpy.data.objects.new('SpriteCam', camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 2.8
    camera.data.clip_start = 0.1
    camera.data.clip_end = 50.0
    for location, suffix in (((0, -6, 1.3), 'front'), ((6, 0, 1.3), 'side')):
        camera.location = location
        direction = Vector((0, 0, 1.05)) - Vector(location)
        camera.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.scene.camera = camera
        bpy.context.scene.render.filepath = os.path.join(SPRITE_DIR, 'sabrina_sprite_%s.png' % suffix)
        bpy.ops.render.render(write_still=True)

    bpy.ops.wm.save_mainfile()
    report = {
        'raw_height': round(raw_height, 3),
        'scale': round(scale, 5),
        'target_height': TARGET_HEIGHT,
        'export_meshes': len(export_names),
        'export_bytes': os.path.getsize(EXPORT_PATH),
        'images': image_report,
        'excluded': list(EXCLUDE_PARTS),
    }
    print('SABRINA_FINALIZE_BEGIN')
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print('SABRINA_FINALIZE_END')


main()
