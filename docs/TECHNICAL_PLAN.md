# Technical plan

## Stack and responsibilities

| Component | Use |
| --- | --- |
| Vite + TypeScript | Local tooling, typed application and simulation |
| React | Menus, settings, results, upgrade interface |
| React Three Fiber + Three.js | 3D scene and rendering |
| Blender + Blender MCP | Optional environment creation and asset processing |
| Typed data definitions | Dolls, guns, skills, enemies, waves, upgrades |
| Browser storage | Small versioned settings and unlock saves |

Use compatible stable package versions checked during M0; record them, do not assume a version from these docs. Choose npm unless the existing project dictates otherwise. Commit a single matching lockfile. No Next.js/SSR, Phaser, backend, full physics engine, or ECS library is required initially. Add dependencies only to solve an actual problem.

## Suggested source organization

- `src/app/`: React application shell and screen state.
- `src/game/core/`: loop, world state, RNG, run-state transitions.
- `src/game/systems/`: input, movement, targeting, weapons, projectiles, damage, enemies, XP, progression.
- `src/game/data/`: typed content definitions with stable IDs.
- `src/render/`: world, camera, character planes, effects and synchronization.
- `src/ui/`: HUD, pause, upgrades, results and settings.
- `src/platform/`: focus, storage and audio lifecycle.
- `public/assets/`: optimized runtime assets.
- `assets-source/`: editable Blender or art source, separate from deployed assets.
- `tests/`: focused simulation and critical lifecycle tests.

Create folders when used, not as empty scaffolding for the entire release.

## Coordinates and aiming

M2 implementation: typed basic doll/weapon/enemy/cover definitions live in `src/game/data/`. Shared `weapons`, `projectiles`, `enemies` and `collision` systems operate on the core world. Simulation accepts a renderer-supplied floor-projection callback after movement, before combat, so shots use the current camera and cursor even during follow. Rendering synchronizes fixed-capacity enemy/projectile batches after simulation. React receives lifecycle and changed HUD values (HP/ammo/reload/kill/shot counters), not per-projectile updates. Selection and game-over screens own screen UI; retry or switching creates a fresh authoritative world. M1 playground remains an optional no-combat route.

XZ is the gameplay plane at Y=0, with Y up. Character position and collision are anchored at the feet. Sprites are upright planes with a consistent bottom-center pivot. Camera yaw/tilt are fixed; translation may follow the player. Do not reorient sprites toward each translated camera position, which can cause jitter; align them consistently with the fixed view direction.

Convert pointer coordinates relative to the actual canvas rectangle into normalized device coordinates. Project through the current camera and intersect the gameplay plane. Normalize target-minus-player in XZ. Handle a missing intersection or near-zero vector by retaining the last valid direction. Apply that direction to all aiming presentation and projectile initialization. Recompute after camera movement and resize even when the mouse is stationary. UI pointer events do not reach combat.

## Simulation and lifecycle

Use a fixed 60 Hz simulation step as an initial choice with an accumulator and bounded catch-up; interpolate render positions if needed. Pause clears accumulator and held inputs. Avoid a giant resumed delta after tab suspension. Run states: menu, playing, paused, level_up, victory, game_over. Mutually exclusive run state is authoritative for timers, input, damage and audio.

Use a single authoritative entity collection. Queue removals and spawns safely rather than mutating iteration inconsistently. Never hold stale copies in delayed callbacks. Clear simulation entities, listeners, timers, effects and pending upgrades on restart. Dispose owned render resources on teardown, while preserving deliberately cached shared assets.

## Collision, targeting and effects

Circle-based player/enemy collision on the ground, simple obstacle shapes, and segment/swept projectile collision are sufficient initially. Resolve earliest projectile hits; apply piercing limits and per-projectile hit records to avoid repeated damage to one entity. Wall collision and damage rules must agree with visuals. Use a spatial grid once crowds make broad collision scans costly. Limit pool sizes, projectile lifetime and effect counts.

Gameplay damage is authoritative. Effects subscribe to damage/shot events; deleting a visual particle cannot change damage. Do not put per-frame entity updates through React state. Apply event provenance and cooldowns to follow-up attacks; define which damage can trigger which skill.

## Content and saving

Definitions need stable ID, display name, ranks, caps, tags and effect references. Runtime state tracks acquired ranks separately from immutable definitions. Seeded RNG is useful for repeatable wave and upgrade debugging. Validate missing references and impossible evolution recipes.

Small saves can use localStorage behind an adapter: schema version, settings and unlock IDs. Catch storage failures, validate loaded data, recover from corruption, and migrate known old versions. Never execute imported save content. Local saves do not sync across browsers/devices and can be cleared. Export/import belongs to the first playable polish stage if feasible, otherwise record deferral explicitly.

## Browser performance and delivery

Provisional target: 60 FPS at 1080p on a director-named reference desktop. This is a goal, not a measured guarantee. Record hardware, browser, resolution, DPR, enemy/projectile counts and frame times. Cap rendering DPR and offer reduced effects/shadows. Start with a few lights, blob shadows for characters, reusable textures/materials and modest bloom. Avoid dynamic lights for every bullet and full-scene blur that obscures combat.

Load only the selected doll and map; retain a small initial payload. Start audio after a user gesture. Handle resize, focus loss and graphics-context loss with a recoverable message. Produce static deployable assets; deployment is a separate requested action, not implied by creating a successful build.
