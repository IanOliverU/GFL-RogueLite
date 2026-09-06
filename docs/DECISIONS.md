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

### M4 progression baseline — 2026-09-06

- Approved M4 subset implements XP/levels/choices, gun ranks 1–5 (+15% damage each), three rank-3 equipment items (Plated Vest, Drum Magazine, Trigger Unit; at most 3 distinct), one Sabrina evolution (Shockwave Barrage: gun rank 5 + Plated Vest rank 3; every 4th volley ×2 damage/knockback +4 pellets), and Sabrina's automatic 6-second knockback pulse. XP: pursuer 2, ranged 4; level need 3 + (level−1) × 2, cap 20. All provisional; data in `src/game/data/progression.ts` is authoritative at runtime.
- No elite enemy in M4: the design doc's elite evolution opportunity is deferred because Ian's approved M4 scope lists the evolution without elites. Evolution requirements stay visible on the level-up screen as a progress line. A dev-only `?devxp=N` URL bonus exists for testing the evolution quickly; it applies only on selection-screen start, never on retry, and is not production progression.
- One `levelup` run state freezes the fixed-step simulation; the modal dialog offers exactly 3 distinct eligible choices with gun/evolution priority and deterministic equipment rotation; Field Rations (heal 30) is the always-eligible fallback so exhausted pools cannot trap the player. Upgrades derive stats per volley and never reset loaded ammo, cooldowns, bursts or reloads.
- Browser choice automation must settle (~400 ms) after each applied pick before deciding the next click; deciding against the pre-commit DOM loses clicks. Recorded after the M4 evolution spec stalled twice on this race with no gameplay defect.

### M4 survival-layout/arena/pacing baseline — 2026-09-06

- Full-window view with overlaid slim top/bottom bars (translucent, `position: absolute`, no page scroll, no fullscreen). HUD keeps its overlay position with the XP row intact; selection scrolls internally; dialogs center over the full view. Camera math is unchanged, so aiming and resize behavior carry over.
- Arena 40 × 40 (half-size 20), four scattered cover blocks with open lanes; the original east block is untouched so M2/M3 cover geometry tests still apply. Camera half-height stays 14 for readability. Spawn points moved to eight edge positions with an 8-unit minimum and a 16-unit out-of-view preference (two-pass pick, still no banking).
- Pressure phases 3.0 s/6/1r, 2.4 s/10/2r @20 s, 2.0 s/14/2r @60 s, 1.6 s/18/2r @120 s; hard cap 8 → 20; ranged stays ≤ 2. Level need 5 + (level−1) × 3 (drops unchanged) so the ~2.5× kill throughput yields a level every ~30–45 s and evolution in ~2–3 min. Measured: soak bot evolved at ~116 s and survived 240 s. No simulation bottleneck found (240 s sim ≈ 1 s Node); no new rendering abstractions added — instanced batches already cover the higher counts.
- After level-up choices, auto-fire waits for fresh mouse movement (pointer clears with inputs, same as pause/resume). Flagged for the playtest notes rather than changed.

### M4 selection-screen palette — 2026-09-06

- Provisional menu palette from Ian's GFL2 references (reference only; no official assets): #121316 background, #1E2024 cards, #3B3E44 borders, #FF7800 primary accent, #FF952E hover accent, #F4EFE7 main text, #B8B5AF secondary text, #231303 dark on-accent text. Named `--menu-*` variables on `.app-shell`, consumed only by topbar/selection rules; combat visuals untouched. Hover lifts the surface without an orange border so it never mimics selection; global focus outline kept. Six doll placeholder colors unchanged.

### M4 run-chrome cleanup — 2026-09-06 (accepted by Ian)

- Header renders only in selection; the footer is removed and its instructions moved into a `control-hints` section of the pause dialog (dash row only in combat). Pause is an absolute top-right overlay with the same label/Escape hint, enabled only while playing; the HUD sits below it with the XP row intact. No gameplay, camera, spawn, XP, evolution, or input changes.
- Test fallout from the full-window canvas (no game defects): corner-aim death setups no longer starve fire, so death tests park on the Pause overlay (canvas `pointerleave` clears aim) and walk into contact; the Tololo focus assertion polls because the canvas inspect snapshot trails React by one frame.

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
