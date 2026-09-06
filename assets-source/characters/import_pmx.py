"""Minimal PMX 2.x importer for Blender (stdlib only, no add-ons).

Reads mesh/material/armature data from a .pmx file into the current scene:
- one mesh object per material range, with UVs and BDEF skinning weights,
- a rest-pose armature parented with Armature modifiers,
- Principled materials wired to local diffuse textures where present.

Skipped by design (recorded by the caller, not silently dropped): morphs,
rigid-body physics, joints, toon ramps, sphere maps, soft bodies.
Original PMX/texture files are only read, never modified.
"""

import os
import struct


def _read_text(buf, offset, encoding):
    (length,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    raw = buf[offset:offset + length]
    offset += length
    # Some tools emit lone surrogates or mixed encodings despite the header
    # flag; fall back gracefully instead of aborting the whole import.
    for candidate in (encoding, 'utf-8', 'shift-jis'):
        try:
            return raw.decode(candidate), offset
        except (UnicodeDecodeError, LookupError):
            continue
    return raw.decode(encoding, errors='replace'), offset


def parse_pmx(path):
    with open(path, 'rb') as fh:
        buf = fh.read()
    offset = 0
    magic = buf[offset:offset + 4]
    offset += 4
    if magic != b'PMX ':
        raise ValueError('not a PMX file: %r' % path)
    (version,) = struct.unpack_from('<f', buf, offset)
    offset += 4
    (global_count,) = struct.unpack_from('<B', buf, offset)
    offset += 1
    glob = struct.unpack_from('<%dB' % global_count, buf, offset)
    offset += global_count
    text_encoding = 'utf-16-le' if glob[0] == 0 else 'utf-8'
    append_uvs = glob[1]
    vertex_index_size = glob[2]
    texture_index_size = glob[3]
    material_index_size = glob[4]
    bone_index_size = glob[5]
    morph_index_size = glob[6]
    rigidbody_index_size = glob[7]

    def index_fmt(size):
        if size == 1:
            return '<b'
        if size == 2:
            return '<h'
        return '<i'

    vfmt = index_fmt(vertex_index_size)
    tfmt = index_fmt(texture_index_size)
    mfmt = index_fmt(material_index_size)
    bfmt = index_fmt(bone_index_size)

    model = {'version': version, 'path': path}
    info = []
    for _ in range(4):
        text, offset = _read_text(buf, offset, text_encoding)
        info.append(text)
    model['info'] = info

    (vertex_count,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    vertices = []
    for _ in range(vertex_count):
        pos = struct.unpack_from('<3f', buf, offset)
        offset += 12
        normal = struct.unpack_from('<3f', buf, offset)
        offset += 12
        uv = struct.unpack_from('<2f', buf, offset)
        offset += 8
        for _ in range(append_uvs):
            offset += 16
        (wtype,) = struct.unpack_from('<B', buf, offset)
        offset += 1
        bones, weights = [], []
        if wtype == 0:  # BDEF1
            (b0,) = struct.unpack_from(bfmt, buf, offset)
            offset += bone_index_size
            bones, weights = [b0], [1.0]
        elif wtype == 1:  # BDEF2
            b0, b1 = struct.unpack_from(bfmt + bfmt[1:], buf, offset)
            offset += 2 * bone_index_size
            (w,) = struct.unpack_from('<f', buf, offset)
            offset += 4
            bones, weights = [b0, b1], [w, 1.0 - w]
        elif wtype == 2:  # BDEF4
            bones = list(struct.unpack_from(bfmt[0] + str(4) + bfmt[1], buf, offset))
            offset += 4 * bone_index_size
            weights = list(struct.unpack_from('<4f', buf, offset))
            offset += 16
        elif wtype == 3:  # SDEF: treat as BDEF2 for import
            b0, b1 = struct.unpack_from(bfmt + bfmt[1:], buf, offset)
            offset += 2 * bone_index_size
            (w,) = struct.unpack_from('<f', buf, offset)
            offset += 4
            offset += 36  # C, R0, R1
            bones, weights = [b0, b1], [w, 1.0 - w]
        elif wtype == 4:  # QDEF
            bones = list(struct.unpack_from(bfmt[0] + str(4) + bfmt[1], buf, offset))
            offset += 4 * bone_index_size
            weights = list(struct.unpack_from('<4f', buf, offset))
            offset += 16
        else:
            raise ValueError('unknown weight deform type %r' % wtype)
        (edge,) = struct.unpack_from('<f', buf, offset)
        offset += 4
        vertices.append({'pos': pos, 'normal': normal, 'uv': uv,
                         'bones': bones, 'weights': weights, 'edge': edge})
    model['vertices'] = vertices

    (face_count,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    faces = []
    for _ in range(face_count // 3):
        tri = struct.unpack_from(vfmt[0] + str(3) + vfmt[1], buf, offset)
        offset += 3 * vertex_index_size
        faces.append(tri)
    model['faces'] = faces

    (texture_count,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    textures = []
    for _ in range(texture_count):
        text, offset = _read_text(buf, offset, text_encoding)
        textures.append(text.replace('\\', '/'))
    model['textures'] = textures

    (material_count,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    materials = []
    for _ in range(material_count):
        name_jp, offset = _read_text(buf, offset, text_encoding)
        name_en, offset = _read_text(buf, offset, text_encoding)
        diffuse = struct.unpack_from('<4f', buf, offset)
        offset += 16
        specular = struct.unpack_from('<3f', buf, offset)
        offset += 12
        (shininess,) = struct.unpack_from('<f', buf, offset)
        offset += 4
        ambient = struct.unpack_from('<3f', buf, offset)
        offset += 12
        (flags,) = struct.unpack_from('<B', buf, offset)
        offset += 1
        edge_color = struct.unpack_from('<4f', buf, offset)
        offset += 16
        (edge_size,) = struct.unpack_from('<f', buf, offset)
        offset += 4
        (tex_idx,) = struct.unpack_from(tfmt, buf, offset)
        offset += texture_index_size
        (sph_idx,) = struct.unpack_from(tfmt, buf, offset)
        offset += texture_index_size
        (sph_mode,) = struct.unpack_from('<B', buf, offset)
        offset += 1
        (toon_flag,) = struct.unpack_from('<B', buf, offset)
        offset += 1
        if toon_flag == 0:
            (toon_idx,) = struct.unpack_from(tfmt, buf, offset)
            offset += texture_index_size
        else:
            (toon_idx,) = struct.unpack_from('<b', buf, offset)
            offset += 1
        memo, offset = _read_text(buf, offset, text_encoding)
        (face_vertices,) = struct.unpack_from('<i', buf, offset)
        offset += 4
        materials.append({
            'name_jp': name_jp, 'name_en': name_en, 'diffuse': diffuse,
            'specular': specular, 'shininess': shininess, 'ambient': ambient,
            'flags': flags, 'edge_color': edge_color, 'edge_size': edge_size,
            'tex_idx': tex_idx, 'sph_idx': sph_idx, 'sph_mode': sph_mode,
            'toon_flag': toon_flag, 'toon_idx': toon_idx, 'memo': memo,
            'face_vertices': face_vertices,
        })
    model['materials'] = materials

    (bone_count,) = struct.unpack_from('<i', buf, offset)
    offset += 4
    bones = []
    for _ in range(bone_count):
        name_jp, offset = _read_text(buf, offset, text_encoding)
        name_en, offset = _read_text(buf, offset, text_encoding)
        pos = struct.unpack_from('<3f', buf, offset)
        offset += 12
        (parent,) = struct.unpack_from(bfmt, buf, offset)
        offset += bone_index_size
        (depth,) = struct.unpack_from('<i', buf, offset)
        offset += 4
        (flags,) = struct.unpack_from('<H', buf, offset)
        offset += 2
        tail = None
        if flags & 0x0001:
            (tail,) = struct.unpack_from(bfmt, buf, offset)
            offset += bone_index_size
        else:
            tail = struct.unpack_from('<3f', buf, offset)
            offset += 12
        if flags & 0x0100 or flags & 0x0200:
            offset += bone_index_size + 4  # inherit parent + rate
        if flags & 0x0400:
            offset += 12  # fixed axis
        if flags & 0x0800:
            offset += 24  # local deform X/Z
        if flags & 0x2000:
            offset += 4  # external parent key
        if flags & 0x0020:
            offset += bone_index_size + 4 + 4  # IK target, loops, angle limit
            (link_count,) = struct.unpack_from('<i', buf, offset)
            offset += 4
            for _ in range(link_count):
                offset += bone_index_size + 1  # link bone + has-limit flag
                (has_limit,) = struct.unpack_from('<B', buf, offset - 1)
                if has_limit:
                    offset += 24  # min/max rotation
        bones.append({'name_jp': name_jp, 'name_en': name_en, 'pos': pos,
                      'parent': parent, 'depth': depth, 'flags': flags,
                      'tail': tail})
    model['bones'] = bones
    model['tail_offset'] = offset
    model['tail_bytes'] = len(buf) - offset
    return model


def _pmx_to_blender(p):
    # PMX is Y-up; Blender is Z-up. Rotation, no mirror.
    return (p[0], -p[2], p[1])


def import_model(model, collection_name='PMX_Import', base_dir=''):
    import bpy
    from mathutils import Vector
    if collection_name in bpy.data.collections:
        collection = bpy.data.collections[collection_name]
    else:
        collection = bpy.data.collections.new(collection_name)
        bpy.context.scene.collection.children.link(collection)

    # Armature first so mesh vertex groups can reference bone names.
    arm_data = bpy.data.armatures.new(collection_name + '_Arm')
    arm = bpy.data.objects.new(collection_name + '_Root', arm_data)
    collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for index, bone in enumerate(model['bones']):
        name = bone['name_en'] or bone['name_jp'] or ('bone_%d' % index)
        if name in arm_data.edit_bones:
            name = '%s.%03d' % (name, index)
        edit = arm_data.edit_bones.new(name)
        edit.head = Vector(_pmx_to_blender(bone['pos']))
        if isinstance(bone['tail'], (list, tuple)):
            tail = Vector(_pmx_to_blender(bone['tail']))
            edit.tail = tail if (tail - edit.head).length > 1e-5 else edit.head + Vector((0, 0, 0.05))
        else:
            edit.tail = edit.head + Vector((0, 0, 0.05))
        bone['blender_name'] = edit.name
    for index, bone in enumerate(model['bones']):
        if bone['parent'] >= 0:
            parent_name = model['bones'][bone['parent']]['blender_name']
            arm_data.edit_bones[bone['blender_name']].parent = arm_data.edit_bones[parent_name]
    bpy.ops.object.mode_set(mode='OBJECT')

    # One mesh object per material range.
    objects = []
    face_cursor = 0
    for mat_index, material in enumerate(model['materials']):
        tri_count = material['face_vertices'] // 3
        tris = model['faces'][face_cursor:face_cursor + tri_count]
        face_cursor += tri_count
        used = {}
        for tri in tris:
            for vi in tri:
                used.setdefault(vi, len(used))
        remap = used
        mesh = bpy.data.meshes.new('%s_%02d' % (collection_name, mat_index))
        mesh.from_pydata(
            [_pmx_to_blender(model['vertices'][vi]['pos']) for vi in remap],
            [],
            [[remap[vi] for vi in tri] for tri in tris],
        )
        mesh.update()
        uv_layer = mesh.uv_layers.new(name='UVMap')
        inverse = [0] * len(remap)
        for original, local in remap.items():
            inverse[local] = original
        mesh_uv = uv_layer.data
        for poly in mesh.polygons:
            for loop_index in poly.loop_indices:
                vert_index = mesh.loops[loop_index].vertex_index
                u, v = model['vertices'][inverse[vert_index]]['uv']
                mesh_uv[loop_index].uv = (u, 1.0 - v)
        # Normals: PMX smooth normals per loop; fall back to flat shading.
        loop_normals = []
        for poly in mesh.polygons:
            for loop_index in poly.loop_indices:
                vert_index = mesh.loops[loop_index].vertex_index
                n = model['vertices'][inverse[vert_index]]['normal']
                loop_normals.append((n[0], -n[2], n[1]))
        try:
            mesh.normals_split_custom_set(loop_normals)
            for poly in mesh.polygons:
                poly.use_smooth = True
        except (AttributeError, TypeError, RuntimeError):
            for poly in mesh.polygons:
                poly.use_smooth = False
        obj = bpy.data.objects.new('%s_%02d' % (collection_name, mat_index), mesh)
        collection.objects.link(obj)
        # Skinning weights (mesh-local vertex indices).
        for original, local in remap.items():
            bones = model['vertices'][original]['bones']
            weights = model['vertices'][original]['weights']
            for bone_idx, weight in zip(bones, weights):
                if weight <= 0.0 or bone_idx < 0 or bone_idx >= len(model['bones']):
                    continue
                group_name = model['bones'][bone_idx]['blender_name']
                group = obj.vertex_groups.get(group_name)
                if group is None:
                    group = obj.vertex_groups.new(name=group_name)
                group.add([local], weight, 'ADD')
        modifier = obj.modifiers.new('PMX Skin', 'ARMATURE')
        modifier.object = arm
        obj.parent = arm
        objects.append((obj, material))

    _assign_materials(objects, model, base_dir)
    return {'armature': arm, 'objects': [o for o, _ in objects]}


def _assign_materials(objects, model, base_dir):
    import bpy
    for obj, material in objects:
        name = material['name_en'] or material['name_jp'] or 'pmx_mat'
        mat = bpy.data.materials.get(name)
        if mat is None:
            mat = bpy.data.materials.new(name)
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            diffuse = material['diffuse']
            bsdf.inputs['Base Color'].default_value = (diffuse[0], diffuse[1], diffuse[2], 1.0)
            bsdf.inputs['Roughness'].default_value = 0.75
            bsdf.inputs['Metallic'].default_value = 0.0
            bsdf.inputs['Alpha'].default_value = diffuse[3]
            tex_idx = material['tex_idx']
            if 0 <= tex_idx < len(model['textures']):
                image_path = os.path.normpath(os.path.join(base_dir, model['textures'][tex_idx]))
                # Some materials reference a folder, not a file: treat as untextured.
                if os.path.isfile(image_path):
                    try:
                        image = bpy.data.images.load(image_path, check_existing=True)
                    except RuntimeError:
                        image = None
                    if image is not None:
                        image_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
                        image_node.image = image
                        mat.node_tree.links.new(image_node.outputs['Color'], bsdf.inputs['Base Color'])
                        if diffuse[3] < 0.99 or (image.depth == 32):
                            mat.blend_method = 'CLIP'
                            mat.alpha_threshold = 0.5
                            mat.node_tree.links.new(image_node.outputs['Alpha'], bsdf.inputs['Alpha'])
            if material['flags'] & 0x01:
                mat.use_backface_culling = False
            else:
                mat.use_backface_culling = True
        obj.data.materials.append(mat)
