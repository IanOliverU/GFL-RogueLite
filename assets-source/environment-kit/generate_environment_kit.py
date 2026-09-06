"""Create and export the first M5 reusable checkpoint environment kit.

Run from Blender's Text Editor or with Blender's Python interpreter.  This only
rebuilds the named M5_EnvironmentKit collection, preserves all other scene
objects, saves the editable source file and emits browser-ready GLB exports.

Blender convention used throughout: (x, y_forward, z_up). Prop origin is the
ground placement anchor. glTF export converts Z-up to Y-up for three.js.
"""

from pathlib import Path
import math
import bpy


PROJECT_ROOT = Path(r"C:\\Users\\MY PC\\Desktop\\GFL Game")
SOURCE_FILE = PROJECT_ROOT / "assets-source" / "environment-kit" / "m5_environment_kit.blend"
EXPORT_DIR = PROJECT_ROOT / "public" / "assets" / "environment-kit"
COLLECTION_NAME = "M5_EnvironmentKit"
PREVIEW_COLLECTION_NAME = "M5_EnvironmentKit_Preview"


def material(name, color, metallic=0.0, roughness=0.8):
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    return mat


def make_box(name, size, location, mat, bevel=0.0, rotation=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if rotation:
        obj.rotation_euler = rotation
    if bevel:
        modifier = obj.modifiers.new("Edge softening", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
    return obj


def make_cylinder(name, radius, depth, location, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Rim softening", "BEVEL")
    bevel.width = 0.025
    bevel.segments = 1
    return obj


def move_to_collection(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def parent_parts(parts, asset_name, collection):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    root = bpy.context.object
    root.name = asset_name
    move_to_collection(root, collection)
    for part in parts:
        move_to_collection(part, collection)
        part.parent = root
    return root


def clear_kit():
    collection = bpy.data.collections.get(COLLECTION_NAME)
    if collection is None:
        collection = bpy.data.collections.new(COLLECTION_NAME)
        bpy.context.scene.collection.children.link(collection)
        return collection
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    return collection


def clear_preview():
    preview = bpy.data.collections.get(PREVIEW_COLLECTION_NAME)
    if preview is None:
        preview = bpy.data.collections.new(PREVIEW_COLLECTION_NAME)
        bpy.context.scene.collection.children.link(preview)
        return preview
    for obj in [item for item in bpy.data.objects if item.get("m5_preview")]:
        bpy.data.objects.remove(obj, do_unlink=True)
    for obj in list(preview.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for child in list(preview.children):
        preview.children.unlink(child)
        bpy.data.collections.remove(child)
    return preview


def add_preview_instances(assets):
    """Spaced source-only previews; never selected by export_asset()."""
    preview = clear_preview()
    placements = [(-9, -5, 0), (-3, -5, 0), (3, -5, 0),
(9, -5, 0), (-7, 4, 0), (-1, 4, 0), (5, 4, 0), (15, -5, 0), (11, 4, 0)]
    for root, location in zip(assets, placements):
        instance = bpy.data.objects.new(f"PREVIEW_{root.name}", None)
        instance.instance_type = "COLLECTION"
        single = bpy.data.collections.new(f"PREVIEW_SOURCE_{root.name}")
        preview.children.link(single)
        for child in [root, *root.children_recursive]:
            duplicate = child.copy()
            if getattr(child, "data", None):
                duplicate.data = child.data
            duplicate.parent = None
            duplicate["m5_preview"] = True
            single.objects.link(duplicate)
        instance.instance_collection = single
        instance.location = location
        instance["m5_preview"] = True
        preview.objects.link(instance)


def build_kit():
    kit = clear_kit()
    concrete = material("M5_Concrete_Worn", (0.29, 0.27, 0.23), 0.0, 0.96)
    concrete_edge = material("M5_Concrete_Edge", (0.43, 0.39, 0.31), 0.0, 0.88)
    concrete_patch = material("M5_Concrete_Patch", (0.24, 0.23, 0.20), 0.0, 0.98)
    metal = material("M5_Metal_Weathered", (0.12, 0.16, 0.15), 0.68, 0.62)
    plate = material("M5_Metal_Plate", (0.22, 0.25, 0.23), 0.5, 0.78)
    crate_wood = material("M5_Crate_Wood", (0.28, 0.18, 0.10), 0.0, 0.93)
    crate_band = material("M5_Crate_Band", (0.45, 0.30, 0.12), 0.55, 0.62)
    barrel_paint = material("M5_Barrel_DesaturatedTeal", (0.08, 0.20, 0.20), 0.55, 0.6)
    hazard = material("M5_Hazard_Yellow", (0.55, 0.34, 0.05), 0.1, 0.68)
    dusty = material("M5_Dusty_Ground", (0.32, 0.25, 0.16), 0.0, 1.0)
    dust_light = material("M5_Dust_Light", (0.45, 0.35, 0.22), 0.0, 1.0)
    crack = material("M5_Crack_Dark", (0.12, 0.10, 0.075), 0.0, 1.0)

    # Ground/concrete module: 6 x 6 m, origin at its ground-centre placement anchor.
    # Sizes/locations are (x, y_forward, z_up).
    ground = parent_parts([
        make_box("Ground_Slab", (6, 6, 0.12), (0, 0, 0.06), dusty, 0.015),
        make_box("Concrete_Patch", (4.35, 1.25, 0.025), (0, -0.8, 0.132), concrete, 0.006),
        make_box("Concrete_Wear", (1.1, 0.56, 0.012), (-1.25, -0.78, 0.151), concrete_patch),
        make_box("Concrete_Seam", (4.28, 0.055, 0.012), (0, -0.25, 0.149), concrete_edge),
        make_box("Dust_Patch_A", (1.4, 0.75, 0.011), (1.65, 1.45, 0.141), dust_light, 0.0, (0, 0, 0.15)),
        make_box("Dust_Patch_B", (0.95, 0.52, 0.011), (-1.75, 1.75, 0.141), dust_light, 0.0, (0, 0, -0.22)),
        make_box("Crack_A", (1.25, 0.035, 0.009), (-1.3, 0.75, 0.147), crack, 0.0, (0, 0, -0.28)),
        make_box("Crack_B", (0.7, 0.03, 0.009), (-0.55, 0.95, 0.147), crack, 0.0, (0, 0, 0.48)),
        make_box("Route_Mark", (1.28, 0.14, 0.012), (0, 1.15, 0.151), hazard),
    ], "ENV_GroundConcrete_Module", kit)

    # Low, broad cover, designed to exactly suit checkpoint collision visual scale.
    barricade = parent_parts([
        make_box("Barrier_Main", (3.0, 0.55, 0.92), (0, 0, 0.46), concrete, 0.055),
        make_box("Barrier_Cap", (3.12, 0.68, 0.13), (0, 0, 0.95), concrete_edge, 0.025),
        make_box("Barrier_Inset", (2.45, 0.025, 0.12), (0, -0.29, 0.48), plate),
        make_box("Barrier_Patch", (0.72, 0.026, 0.18), (-0.82, -0.292, 0.3), concrete_patch),
        make_box("Barrier_Hazard", (0.92, 0.028, 0.10), (0, -0.30, 0.72), hazard),
        make_box("Barrier_Groove_A", (0.025, 0.03, 0.48), (-1.05, -0.294, 0.42), concrete_edge),
        make_box("Barrier_Groove_B", (0.025, 0.03, 0.48), (1.05, -0.294, 0.42), concrete_edge),
    ], "ENV_ConcreteBarricade_Low", kit)

    # 5.5 m fence, solid lower plate and a clear open upper silhouette.
    fence_parts = [
        make_box("Fence_LowerPlate", (5.5, 0.11, 0.58), (0, 0, 0.34), plate, 0.015),
        make_box("Fence_TopRail", (5.5, 0.11, 0.11), (0, 0, 1.72), metal, 0.01),
        make_box("Fence_MidRail", (5.2, 0.08, 0.07), (0, 0, 1.15), metal),
    ]
    for x in (-2.65, 0, 2.65):
        fence_parts.append(make_box(f"Fence_Post_{x}", (0.13, 0.13, 1.9), (x, 0, 0.95), metal, 0.012))
    for x in (-2.1, -1.4, -0.7, 0.7, 1.4, 2.1):
        fence_parts.append(make_box(f"Fence_Slat_{x}", (0.045, 0.045, 0.83), (x, 0, 1.3), metal))
    for x, angle in ((-1.5, -0.35), (1.5, 0.35)):
        fence_parts.append(make_box(f"Fence_Brace_{x}", (1.35, 0.055, 0.055), (x, -0.07, 0.8), metal, 0.0, (0, angle, 0)))
    fence_parts.append(make_box("Fence_PanelWear", (1.15, 0.018, 0.08), (1.45, -0.066, 0.28), concrete_patch))
    fence = parent_parts(fence_parts, "ENV_FencePanel_Plated", kit)

    crate = parent_parts([
        make_box("Crate_Body", (1.55, 1.28, 1.08), (0, 0, 0.54), crate_wood, 0.04),
        make_box("Crate_Top", (1.65, 1.38, 0.10), (0, 0, 1.12), crate_band, 0.018),
        make_box("Crate_FrontBand", (1.22, 0.035, 0.12), (0, -0.657, 0.55), crate_band),
        make_box("Crate_SideBand", (0.035, 1.0, 0.12), (0.795, 0, 0.55), crate_band),
        make_box("Crate_Brace_Left", (0.10, 0.04, 0.75), (-0.48, -0.66, 0.54), crate_band, 0.0, (0, -0.5, 0)),
        make_box("Crate_Brace_Right", (0.10, 0.04, 0.75), (0.48, -0.66, 0.54), crate_band, 0.0, (0, 0.5, 0)),
        make_box("Crate_Wear", (0.35, 0.02, 0.055), (-0.2, -0.67, 0.82), dust_light),
    ], "ENV_SupplyCrate", kit)

    barrel = parent_parts([
        make_cylinder("Barrel_Body", 0.34, 0.94, (0, 0, 0.47), barrel_paint),
        make_cylinder("Barrel_TopRim", 0.35, 0.075, (0, 0, 0.89), metal),
        make_cylinder("Barrel_MidRim", 0.355, 0.065, (0, 0, 0.48), metal),
        make_cylinder("Barrel_BottomRim", 0.35, 0.075, (0, 0, 0.08), metal),
        make_box("Barrel_Wear", (0.18, 0.018, 0.32), (-0.20, -0.335, 0.61), dust_light, 0.01),
    ], "ENV_Barrel", kit)

    # Gatepost pair marking the inspection entrance. Placard faces the
    # southern approach (+y). Thin and placed clear of the walk line.
    gatepost = parent_parts([
        make_box("Gatepost_Base", (0.5, 0.5, 0.18), (0, 0, 0.09), concrete, 0.02),
        make_box("Gatepost_Post", (0.24, 0.24, 1.7), (0, 0, 0.85), concrete, 0.015),
        make_box("Gatepost_Cap", (0.34, 0.34, 0.10), (0, 0, 1.75), plate, 0.01),
        make_box("Gatepost_Placard", (0.95, 0.06, 0.55), (0, 0.18, 1.15), plate, 0.008),
        make_box("Gatepost_Stripe", (0.95, 0.02, 0.12), (0, 0.215, 1.00), hazard),
    ], "ENV_Gatepost", kit)

    # Low perimeter debris. Clearly non-colliding scatter, kept off lanes.
    debris = parent_parts([
        make_box("Debris_Stone_A", (0.40, 0.30, 0.18), (-0.30, 0.20, 0.09), concrete_patch, 0.03, (0, 0, 0.4)),
        make_box("Debris_Stone_B", (0.28, 0.22, 0.12), (0.35, -0.15, 0.06), concrete_edge, 0.02, (0, 0, -0.7)),
        make_box("Debris_Plate", (0.55, 0.40, 0.03), (0.05, 0.35, 0.035), metal, 0.0, (0, 0, 0.2)),
        make_box("Debris_Slat", (0.50, 0.09, 0.07), (-0.10, -0.35, 0.035), crate_wood, 0.0, (0, 0, 1.1)),
    ], "ENV_DebrisSmall", kit)

    # Concrete wall section: 4 m landmark piece for yard edges. Decorative;
    # collision, where needed, stays in the typed obstacle data.
    wall = parent_parts([
        make_box("Wall_Foot", (4.1, 0.6, 0.12), (0, 0, 0.06), concrete_patch, 0.02),
        make_box("Wall_Main", (4.0, 0.4, 1.5), (0, 0, 0.75), concrete, 0.03),
        make_box("Wall_Cap", (4.2, 0.55, 0.14), (0, 0, 1.55), concrete_edge, 0.02),
        make_box("Wall_Inset", (3.2, 0.03, 0.5), (0, -0.215, 0.8), plate),
        make_box("Wall_Stripe", (1.2, 0.032, 0.14), (-1.0, -0.216, 0.35), hazard),
    ], "ENV_WallSection", kit)

    # Industrial pipe rack: twin pipes on feet with a valve box. Distinct
    # service-yard silhouette; decorative only.
    pipe_a = make_cylinder("Rack_Pipe_A", 0.16, 3.0, (0, -0.18, 0.55), metal, vertices=10)
    pipe_a.rotation_euler = (0, math.pi / 2, 0)
    pipe_b = make_cylinder("Rack_Pipe_B", 0.16, 3.0, (0, 0.18, 0.55), metal, vertices=10)
    pipe_b.rotation_euler = (0, math.pi / 2, 0)
    rack = parent_parts([
        pipe_a,
        pipe_b,
        make_box("Rack_Foot_A", (0.25, 0.7, 0.5), (-1.2, 0, 0.25), metal, 0.01),
        make_box("Rack_Foot_B", (0.25, 0.7, 0.5), (1.2, 0, 0.25), metal, 0.01),
        make_box("Rack_Valve", (0.3, 0.3, 0.4), (0.5, -0.18, 0.85), plate, 0.01),
    ], "ENV_PipeRack", kit)
    assets = [ground, barricade, fence, crate, barrel, gatepost, debris, wall, rack]
    add_preview_instances(assets)
    return assets


def export_asset(root):
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    filepath = EXPORT_DIR / f"{root.name}.glb"
    # Blender 5.2 registers the built-in exporter under export_scene.gltf.
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_materials="EXPORT",
        export_apply=True,
    )
    return filepath


EXPORT_DIR.mkdir(parents=True, exist_ok=True)
assets = build_kit()
exported = [str(export_asset(asset)) for asset in assets]
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_FILE))
result = {"source": str(SOURCE_FILE), "exports": exported, "assets": [asset.name for asset in assets]}
