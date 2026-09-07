# Art, animation and map pipeline

## Current visual target (2026-09-07 reconciliation; overrides older notes in this file)

Fully 3D anime characters in grounded urban/industrial environments, viewed through the existing Angled camera (Classic preserved as a selectable fallback).

- Match environmental proportions to Sabrina (2.15 m display height); measure scale rather than enlarging the character to hide oversized scenery.
- Distinguish asphalt, concrete, painted metal, glass, and masonry through texture scale, roughness, color, and geometry. Use restrained wear and localized dirt; avoid covering everything with procedural noise, cracks, or oversized labels.
- Controlled palette: cool neutral architecture, readable pavement, limited warm lighting/safety accents. Create depth through building mass, recesses, foreground/background relationships, and lighting. Keep open maneuvering space for horde combat.
- The next authorized preview is approximately one to two Angled-camera screens of finished urban space (roughly 24–32 units across): an asphalt street corner/short intersection, sidewalks with convincing curb edges, two substantial building facades with depth (recessed doors/windows, structural divisions, roof/parapet details), a service entrance/small loading recess, a few substantial cover objects (parked utility vehicle, concrete barriers), and purposeful secondary details (drains, utility boxes, bollards, restrained signage, grouped service equipment).
- The attached street reference guides spatial composition, scale, material quality, and lighting; local GFL2 screenshots guide character compatibility only. Create an original composition; do not embed screenshots into runtime.
- Prioritize architecture, proportions, ground materials, and composition before small clutter. Preserve gameplay: Classic/Angled selection and framing, screen-relative controls, cursor-ground aiming, movement/dash/weapons/damage/XP/upgrades/evolution/spawn tuning, pause/focus handling, level-up freezes, retry, and doll switching. Sabrina stays as currently integrated; skeletal animation and weapon presentation are separate follow-ups. No sprite pipeline, engine migration, state-management replacement, or new combat mechanics in the preview.

## Visual target (historical — superseded by the current target above)

2D characters in a stylized 3D military checkpoint courtyard, with fixed elevated view, readable silhouettes and restrained lighting. Use one coherent character resolution/proportion style. Do not mix detailed chibi artwork and unrelated pixel sprites without a deliberate art decision. This is a visual direction, not a claim to reproduce a named game's complete production quality.

## First map workflow (historical baseline — layout/collision redesign is explicitly permitted for the urban preview)

1. Graybox a courtyard with code geometry: open central combat space, walkable perimeter and a few obstacles.
2. Test movement, bullet blocking, escape paths and enemy navigation before decorating.
3. Create a modular Blender kit with consistent units and origin conventions.
4. Export optimized GLB props and reusable materials; retain editable sources separately.
5. Place pieces using typed map data. Give each placement a stable ID, asset ID, position, rotation, scale and separate collision definition.
6. Add atmosphere and limited lighting; repeat combat readability and performance checks.

Proposed 12-piece kit: ground tile, road tile, straight wall, wall corner, building facade, crate, concrete barrier, fence panel, gate, lamp post, sandbag group, rubble group. Pieces can share textures and materials. Decorative rubble must not silently become invisible collision.

Fixed authored layout first. Randomize rewards and waves before terrain. Random obstacle variations must preserve reachable paths. Enemy spawn points must be reachable and outside an exclusion radius around the player. Use open layouts with simple obstacle steering initially; introduce a small navigation grid if agents become stuck. Hide/fade foreground walls when necessary, or avoid occluding placements altogether. No upper walkable floors.

Unlike the previous decoration-only task, the authorized urban preview may redesign its preview area and create matching collision footprints. Solid-looking buildings, vehicles, and barriers must block movement consistently; traversable ground stays compatible with the flat-ground simulation; sidewalk elevation is visual treatment consistent with player grounding. Provide connected routes around cover, valid reachable spawn points, and no traps for pursuing enemies; projectiles must not pass through solid cover. Prefer the existing collision system. Avoid tall foreground structures that permanently hide combat; adjust composition first and add narrowly scoped occlusion handling only if necessary.

## Asset conventions (current — sprite notes below are historical)

Use a consistent one-unit-to-one-meter convention for 3D assets and record the chosen doll display height during import (Sabrina: 2.15 m). Runtime GLB uses Y-up conventions; verify Blender export orientation rather than assuming it. Apply scale deliberately. Prop origin is its ground placement anchor; keep exports clean (correct axes, grounded origins, transforms, named roots, embedded or reliably referenced textures, no preview-object leakage). Bake unsupported Blender shading where needed and ensure textures/materials survive export. Runtime assets live in public/assets; editable sources live outside that deploy directory. Save an editable task-specific .blend and reproducible export scripts.

Historical sprite notes (superseded — no sprite pipeline): sprite pivot is bottom-center with fixed frame dimensions and padding. Transparent character art needs clean edges and consistent pixel density. Start with a simple blob shadow to anchor the doll. Lit sprite planes can respond to lights but do not acquire true volumetric shading automatically. Review transparency sorting and overlap in the actual camera view.

## Animation plan (current — fully 3D, Sabrina procedural only)

Sabrina is integrated as a real-time 3D model with procedural feedback only (travel/idle bob, volley recoil + muzzle flash, dash lean, hurt flash, game-over fall). Current GLB: 0 skins and 0 animation clips; the exporter bakes armature modifiers into static meshes. Skeletal animation and weapon presentation remain separate follow-ups requiring a revised export path. Procedural feedback is not completed locomotion. The other five dolls remain placeholders. Do not create a sprite pipeline.

Historical sprite animation notes (superseded): inventory available permitted assets before choosing animation technology. Minimal set: idle, run, fire, hit reaction, death. For each: document directions, frame count, frame rate, looping, pivot and event timing. Two facings with horizontal flip can be an explicit placeholder; not a promise of final all-direction fidelity. A separately aimed gun may simplify the prototype but must be checked against the art and layering.

Begin with dash using motion and afterimages; do not fake a convincing roll by spinning an upright sprite. Skills reuse a firing/casting pose plus separate effects initially. Character sprites generated independently may drift between frames; inspect them at game scale and playback speed. Alternatives are permitted existing animations, a single rigged 2D asset, or sprite frames rendered from a consistent rigged 3D model. None guarantees production-ready animation without review.

## AI workflow

Codex can script simple geometry, build import tools and implement animation playback. Live Blender MCP supports ordinary scene inspection and modeling; background Blender isolates audits and scripts that reset scenes (including the export-audit and Sabrina finalize/prepare scripts). Current-session MCP availability is unverified/unavailable; prior connectivity does not establish current connectivity. Do not change MCP configuration in this task. Generate one reference prop/character sample, review it in the game, then reuse its specifications. Do not generate an entire roster before proving one doll's animation pipeline. Keep generation prompts, source assets and export settings when useful for reproduction.

## M5 industrial-district art pass (appearance rejected 2026-09-07 — retained as development fallback only)

The first complete art pass uses a cool charcoal road network over muted gravel, joined pale-concrete aprons, small ochre safety marks and faded teal equipment. The authored districts are checkpoint/inspection in the north-west, the open central junction, east freight service, west maintenance works and a less-developed south utility field. Large non-colliding silhouettes sit beyond the 120 × 96 boundary; every solid-looking item inside it is contained by one of the ten unchanged collision rectangles.

`assets-source/environment-kit/generate_ground_surfaces.py` deterministically writes the runtime SVG atlas. Its image left/right map to world X −60/+60 and image top/bottom map to Z −48/+48. The browser rasterizes the 4096 × 3277 source once. It contains the road shoulders, asphalt repairs, concrete seams, loading bays, cracks, drainage and wayfinding, with no reference image embedded.

`assets-source/environment-kit/generate_industrial_kit.py` must run in a separate background Blender process. It factory-starts, creates only the task kit, saves `m5_industrial_district.blend`, exports isolated GLBs to `.tmp/m5-art-pass/exports`, audits them, and renders the source-only overview. Add `-- --publish` only when reviewed exports should replace runtime files. Asset origins are ground-centre, dimensions are metres, Blender is Z-up and the audited GLB contract is Three.js Y-up. The runtime groups nearby placements for culling and instancing, reunifies the eight-material palette copied across GLBs, and follows the camera with one 1024 px directional shadow map.

Director verdict (2026-09-07): this full-map pass was visually unsatisfactory — repeated primitive props, large flat surfaces, and ground markings did not produce the intended appearance. It is preserved as a development fallback only and is not the acceptance path. Do not expand beyond this scene style until the urban preview below reads convincingly from the gameplay camera.

## Next authorized task: urban combat street-corner preview (M5 active — layout/collision redesign permitted)

Build one convincing fully 3D urban combat street corner (roughly 24–32 units across, roughly one to two Angled-camera screens) featuring the existing Sabrina model. Preserve the current stage as a selectable development fallback; add an isolated urban-preview stage option using the existing stage architecture where possible (a development URL option is sufficient). Do not duplicate the combat engine or overwrite the whole map. Task-scoped Blender modeling, asset preparation, exports, code changes, local layout/collision changes, and documentation updates are authorized. Complete implementation and verification, then stop for Ian's visual review. Do not commit, push, deploy, or mark M5 accepted.
