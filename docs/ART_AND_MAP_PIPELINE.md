# Art, animation and map pipeline

## Visual target

2D characters in a stylized 3D military checkpoint courtyard, with fixed elevated view, readable silhouettes and restrained lighting. Use one coherent character resolution/proportion style. Do not mix detailed chibi artwork and unrelated pixel sprites without a deliberate art decision. This is a visual direction, not a claim to reproduce a named game's complete production quality.

## First map workflow

1. Graybox a courtyard with code geometry: open central combat space, walkable perimeter and a few obstacles.
2. Test movement, bullet blocking, escape paths and enemy navigation before decorating.
3. Create a modular Blender kit with consistent units and origin conventions.
4. Export optimized GLB props and reusable materials; retain editable sources separately.
5. Place pieces using typed map data. Give each placement a stable ID, asset ID, position, rotation, scale and separate collision definition.
6. Add atmosphere and limited lighting; repeat combat readability and performance checks.

Proposed 12-piece kit: ground tile, road tile, straight wall, wall corner, building facade, crate, concrete barrier, fence panel, gate, lamp post, sandbag group, rubble group. Pieces can share textures and materials. Decorative rubble must not silently become invisible collision.

Fixed authored layout first. Randomize rewards and waves before terrain. Random obstacle variations must preserve reachable paths. Enemy spawn points must be reachable and outside an exclusion radius around the player. Use open layouts with simple obstacle steering initially; introduce a small navigation grid if agents become stuck. Hide/fade foreground walls when necessary, or avoid occluding placements altogether. No upper walkable floors.

## Asset conventions

Use a consistent one-unit-to-one-meter convention for 3D assets and record the chosen doll display height during import. Runtime GLB uses Y-up conventions; verify Blender export orientation rather than assuming it. Apply scale deliberately. Prop origin is its ground placement anchor. Sprite pivot is bottom-center with fixed frame dimensions and padding. Runtime assets live in public/assets; editable sources live outside that deploy directory.

Transparent character art needs clean edges and consistent pixel density. Start with a simple blob shadow to anchor the doll. Lit sprite planes can respond to lights but do not acquire true volumetric shading automatically. Review transparency sorting and overlap in the actual camera view.

## Animation plan

Inventory available permitted assets before choosing animation technology. Minimal set: idle, run, fire, hit reaction, death. For each: document directions, frame count, frame rate, looping, pivot and event timing. Two facings with horizontal flip can be an explicit placeholder; not a promise of final all-direction fidelity. A separately aimed gun may simplify the prototype but must be checked against the art and layering.

Begin with dash using motion and afterimages; do not fake a convincing roll by spinning an upright sprite. Skills reuse a firing/casting pose plus separate effects initially. Character sprites generated independently may drift between frames; inspect them at game scale and playback speed. Alternatives are permitted existing animations, a single rigged 2D asset, or sprite frames rendered from a consistent rigged 3D model. None guarantees production-ready animation without review.

## AI workflow

Codex can script simple geometry, build import tools and implement animation playback. Blender MCP performs supported Blender actions only when connected. Generate one reference prop/character sample, review it in the game, then reuse its specifications. Do not generate an entire roster before proving one doll's animation pipeline. Keep generation prompts, source assets and export settings when useful for reproduction.
