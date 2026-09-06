# Decisions, assumptions and sources

## Agreed direction

- Ian acts as director/producer and playtester.
- Browser-first solo game; new local folder is the intended working location.
- GFL-inspired fan-game identity with the six selected dolls: Sabrina, Qiongjiu, Tololo, Mosin-Nagant, Peritya, Vepley.
- 2D characters in stylized 3D environments; fixed elevated view.
- Mouse-cursor aiming, independent from WASD movement.
- Guns retain doll identity while upgrades/evolutions change behavior.
- AI-assisted implementation and art production with human review.

## Baseline implementation choices

These are practical defaults from the planning discussion, adjustable through playtesting:

- Vite + React + TypeScript + R3F + Three.js; Phaser superseded by the 3D-environment direction.
- Automatic fire toward cursor, gated by a live enemy within weapon range. No target snapping. Exact firing interaction remains worth an early playtest.
- Dash first; a proper roll waits for a usable animation pipeline.
- Original Sabrina-first/Mosin-Nagant-second basic-weapon rollout is superseded by the approved expanded M2 scope: all six basic weapons and character selection now belong to M2. Full skill kits remain later work.
- One three-to-five-minute arena prototype, later approximately ten-minute runs.
- Fixed-step simulation; local-only saves; no backend initially.
- Full doll kit eventually has automatic skill, conditional skill and manual ultimate. This is our real-time adaptation, not verified official skill behavior.

## Open items that do not block M0/M1

### Expanded M2 scope and implementation baseline — 2026-09-06

- Ian explicitly authorized six selectable playable dolls in M2: Sabrina, Qiongjiu, Tololo, Mosin-Nagant, Peritya and Vepley. No three-skill kits, ultimates, evolutions, polished animation or later milestone systems. Stop at M2 and keep acceptance pending.
- Use the weapon descriptions and tunable stat table in GAME_DESIGN as prototype fan-game adaptations. Do not claim they are verified official kits. Data in `src/game/data/characters.ts`, `weapons.ts` and `arena.ts` is authoritative for runtime values; shared systems implement all six without character-specific combat branches.
- Preserve automatic firing along cursor aim, gated by any live enemy in weapon range. No aim snapping; no firing while in UI, paused, out of range or after death. Losing the firing gate cancels pending burst rounds. Empty magazines reload automatically, including with no enemy/aim, while all combat timers freeze when paused.
- Sample aim after movement and camera translation before each simulation combat step; refresh presentation on render frames with no fixed step as well. The simulation accepts a projection callback without importing browser/Three objects. Shared direction controls both indicator and projectile initialization.
- Use swept segment/circle and segment/box projectile tests sorted by earliest contact; cover wins ties. Sniper shots hit up to three distinct enemies, never the same enemy twice, and cannot pierce cover. Knockback refreshes (not sums) pellet impulses and obeys the same bounds/cover as movement. One pursuer type, up to eight active; projectiles capped at 192. Fixed-capacity render batches avoid projectile React state.
- Replace world state completely on retry/switch: HP, ammo, burst/reload/cooldown timers, hurt timers, projectiles, enemies, spawn cursor, entity IDs, aim, input, counters and elapsed time. Explicit selection/playing/paused/game_over states prevent Escape/focus from starting a run or reviving a dead one.
- Preserve M1's no-combat playground at `?mode=playground` using the same simulation/rendering foundation. M1 browser checks retain all assertions and use that route. M0/M1 and relocation evidence remains historical; Git was clean on `main` at the start of M2. No dependency changes required.

### M0/M1 implementation decisions — 2026-09-06

- Original location decision (superseded by Ian's relocation instruction on 2026-09-06): initially keep the starter subfolder as the application root. The current application root is `C:\Users\MY PC\Desktop\GFL Game`; the existing implementation, tests and records were moved there intact. No Git repository was present, and none was initialized or committed.
- Verified React 19.2.8 / R3F 9.7.0 / Three 0.185.1, Vite 8.2.2, React plugin 6.1.1 and TypeScript 5.9.3. Use ESLint 10.10.0 (the initially tried ESLint 9 reported deprecation and was replaced). Package metadata and official R3F/Vite documentation checked; exact dependencies and one npm lockfile retained. Node 24.x is the documented local baseline. TypeScript 7 was not selected because installed typescript-eslint's peer support is below 6.1.
- Provisional movement: 6 units/second, radius 0.4, arena half-size 12; 60 Hz simulation capped at six catch-up steps per frame. Camera offset Y=22/Z=18, fixed yaw/tilt, 28-unit vertical view and 45% player translation follow. No interpolation yet; director should assess feel.
- Frame order: advance simulation, update camera and matrices from current canvas bounds, project stationary or moved pointer onto Y=0, update authoritative shared aim direction, synchronize render transforms. Targets outside arena bounds remain valid on the same floor plane; player movement alone is bounded.
- Only playing and paused run states are implemented. More run states, typed roster/content data, storage, audio, combat, dash and progression await their milestones; no empty future directories.
- Upright procedural flat character shapes and simple arena geometry avoid asset dependencies. No Blender connection or official art required for M1. Rendering and browser lifecycle remain separate from simulation; React receives infrequent lifecycle notifications.
- `?inspect=1` enables read-only canvas snapshots for production browser checks; no diagnostics are written during ordinary play. Browser tests run installed Chrome with software WebGL. Real OS focus transitions, zoom/DPR, graphics reset and human feel remain manual checks.

### Remaining nonblocking items

- Final title, visual reference sheet and sprite source/permission.
- Exact skill translations and canonical weapon/alias metadata.
- Reference desktop hardware and measured performance budget.
- Camera framing, dodge timings, enemy counts and progression tuning.
- Final audio sources and distribution host.

Use placeholders and record provisional values. Ask focused questions only when a decision materially blocks the active task. Do not invent approval or canonical facts to close an open item.

## Scope changes require a recorded design update

Connected-room dungeon structure, fully 3D characters, mobile support, multiplayer, accounts, cloud saves, monetization, or replacing the engine are beyond this baseline. This is a scope record, not a requirement for repeated approval of routine reversible fixes.

## Reference sources used during planning

These are reference links from the planning conversation, not a fresh audit of package versions or permissions. Verify current documentation during setup and applicable asset terms before release.

- [React Three Fiber](https://github.com/pmndrs/react-three-fiber): React renderer for Three.js; R3F and Three.js are used together.
- [Three.js documentation](https://threejs.org/docs/): renderer and graphics APIs.
- [Octopath developer interview](https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true): 2D characters combined with 3D environments.
- [Enter the Gungeon](https://enterthegungeon.com/): action-shooter inspiration.
- [HoloCure](https://store.steampowered.com/app/2420510/HoloCure__Save_the_Fans/): character builds and survivor progression inspiration.
- [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/): escalating survival progression inspiration.
- [Megabonk](https://store.steampowered.com/app/3405340/Megabonk/): 3D survivor/exploration inspiration.
- [Blender MCP community project](https://github.com/ahujasid/blender-mcp): inspect actual installed capabilities before relying on them.
- [HAOPLAY creative activity guidelines](https://gf2.haoplay.com/services/en.html): activity submission rules; not established blanket permission for independently redistributing official game assets.
