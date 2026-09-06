"""Prepare Sabrina from the local MMD download (background Blender only).

Phase 1: import the PMX into a separate working file and report contents.
The original download is only read. Run:
  blender --background --factory-startup --python prepare_sabrina.py
"""

import json
import os
import sys

PROJECT_ROOT = r"C:\Users\MY PC\Desktop\GFL Game"
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'assets-source', 'characters'))
sys.path.insert(0, r"C:\Users\MY PC\AppData\Local\uv\cache\archive-v0\41V97udmMh2iKSjw\Lib\site-packages")

import bpy  # noqa: E402
from import_pmx import import_model, parse_pmx  # noqa: E402

SABRINA_DIR = os.path.join(PROJECT_ROOT, 'src', 'Character MMD', 'Sabrina (Default)')
PMX_PATH = os.path.join(SABRINA_DIR, 'GirlsFrontline SabrinaDefault.pmx')
WORK_PATH = os.path.join(PROJECT_ROOT, 'assets-source', 'characters', 'sabrina_work.blend')


def main():
    # Fresh working scene; the live environment .blend is never touched.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.name not in ('Scene Collection',):
            bpy.data.collections.remove(collection)

    model = parse_pmx(PMX_PATH)
    imported = import_model(model, collection_name='Sabrina', base_dir=SABRINA_DIR)

    # Measurements for scale/anchor decisions.
    corners = []
    for obj in imported['objects']:
        if obj.type != 'MESH':
            continue
        for corner in obj.bound_box:
            corners.append(obj.matrix_world @ Vector(corner))
    xs = [c[0] for c in corners]
    ys = [c[1] for c in corners]
    zs = [c[2] for c in corners]
    total_verts = sum(len(o.data.vertices) for o in imported['objects'] if o.type == 'MESH')
    total_tris = sum(len(o.data.polygons) for o in imported['objects'] if o.type == 'MESH')
    report = {
        'info': model['info'],
        'version': model['version'],
        'vertices': len(model['vertices']),
        'faces': len(model['faces']),
        'materials': len(model['materials']),
        'bones': len(model['bones']),
        'trailing_bytes': model['tail_bytes'],
        'mesh_objects': len(imported['objects']),
        'total_verts': total_verts,
        'total_tris': total_tris,
        'bbox_min': [round(min(xs), 3), round(min(ys), 3), round(min(zs), 3)],
        'bbox_max': [round(max(xs), 3), round(max(ys), 3), round(max(zs), 3)],
        'textures': model['textures'],
        'material_names': [m['name_en'] or m['name_jp'] for m in model['materials']],
        'material_alpha': [m['diffuse'][3] for m in model['materials']],
    }
    os.makedirs(os.path.dirname(WORK_PATH), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)
    print('SABRINA_REPORT_BEGIN')
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print('SABRINA_REPORT_END')


from mathutils import Vector  # noqa: E402

main()
