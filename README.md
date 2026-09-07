# GFL2 Exilium Fan Game — M5 visual prototype (M0–M3 accepted, M4 baseline accepted)

Independent Girls' Frontline-inspired browser fan-game prototype. Ian is director/producer and playtester. M0–M3 are accepted and committed; M4 baseline is accepted for progression to M5 (evolution refinement deferred pending clarification); M5 is the single active milestone. The expanded M2 added six selectable dolls with distinct basic weapons and shared combat, and M3 added dash evasion, ranged-enemy pressure, pause-menu options and a run timer. M4 adds XP levels, upgrade choices, gun/equipment ranks and one Sabrina evolution. These are prototype fan-game adaptations, not verified official kits.

Current direction (2026-09-07 reconciliation; overrides older visual notes below): fully 3D anime characters in grounded urban/industrial environments. The street reference guides composition, scale, material quality, and lighting; local GFL2 screenshots guide character compatibility only (original composition; no screenshots embedded at runtime). Sabrina is integrated as a real-time 3D model at 2.15 m display height with procedural feedback only; skeletal animation and weapon presentation are separate follow-ups with no sprite pipeline. Both Classic and Angled cameras are accepted and selectable; Angled is the default. The previous full-map environment pass was visually unsatisfactory and is retained as a development fallback only. The next authorized task is one convincing urban combat street-corner preview (roughly 24–32 units across) with explicit permission to redesign its layout and matching collision; placeholders never count as finished M5 art. Do not mark M5 accepted without Ian's visual review.

## Run locally

The application root is **`C:\Users\MY PC\Desktop\GFL Game`**. Open this folder directly in VS Code; the project no longer uses a nested starter folder. Use Node.js 24.x (verified with **24.12.0**) and npm (verified with **11.7.0**).

```powershell
cd "C:\Users\MY PC\Desktop\GFL Game"
npm ci
npm run dev
```

Open the URL printed by Vite, normally **http://127.0.0.1:5173/**. If already in the application root, omit `cd`. The server binds to loopback only. Stop it with Ctrl+C in its terminal.

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
npm run preview
```

`preview` serves the production build locally, normally at http://127.0.0.1:4173/. Build again after source edits before previewing or running browser tests.

```powershell
npm run build
npm run test:browser
```

The browser suite uses installed Google Chrome in headless mode and starts a local production preview (or reuses an existing preview on port 4173). If Chrome is absent, install Google Chrome first. Tests use software WebGL for repeatability; these are correctness checks, not GPU performance measurements. Screenshots and test output go into ignored `test-results/`. Add `?inspect=1` to a local game URL to expose read-only frame snapshots on the canvas for automated checks; normal play does not write this diagnostic data.

## Playable behavior

The default screen lets you choose Sabrina, Qiongjiu, Tololo, Mosin-Nagant, Peritya or Vepley, with a weapon summary, selected state and labeled placeholder art. Select a doll, then **Start run**. After game over, **Retry with [doll]** resets the same doll, or **Return to selection** lets you switch.

| Doll | Basic weapon comparison |
| --- | --- |
| Sabrina | Broad, close-range seven-pellet shotgun; heavier volleys |
| Qiongjiu | Three-round assault-rifle bursts with a recovery gap |
| Tololo | Faster sustained rifle fire |
| Mosin-Nagant | Slow, powerful sniper shots; up to three distinct enemy hits |
| Peritya | Fast sustained machine gun; 60-round magazine, 3.2-second reload |
| Vepley | Faster, lighter five-pellet shotgun; stronger knockback |

 Automatic firing follows cursor aim when any live enemy is in weapon range. It never aims at enemies for you. Move the mouse onto the canvas to aim; leaving the canvas or entering an overlay clears aim input. Empty magazines reload automatically. HP, ammo/reload status, dash status and defeats appear in the HUD. Pursuers deal contact damage; the cover block stops movement and bullets, including sniper shots. Every retry/switch resets the whole world: health, ammo, weapon/hurt/spawn timers, dash, projectiles (friendly and hostile), enemies, counters, aim and held input.

M3 adds: **Space** dashes 4 units over 0.20 s toward held movement (or cursor aim when stationary), with invulnerability only during the dash and a 1.20 s cooldown from activation; dash stops at cover/perimeter. One ranged enemy type (50 HP, purple placeholder) holds near 7 units, warns 0.90 s with a red beam toward the position locked at warning onset, then fires a slow (7 u/s) orange projectile. Spawns escalate over time (first pressure spawn at 4 s, up to 8 alive, at most 2 ranged, no spawn within 6 units of the player); enemies keep bounded soft separation.

The pause menu offers **Resume run**, **Restart run** (fresh run with the same doll) and **Change character** (back to selection), with a note that restarting or changing discards the current run. The combat HUD shows a readable **TIME** display (MM:SS) driven by the same run clock as spawn pressure; it freezes on pause/focus loss/game over and resets to 00:00 on every new or restarted run.

Detailed provisional weapon values are in [GAME_DESIGN.md](docs/GAME_DESIGN.md) and typed definitions in `src/game/data/`. There is no manual reload, click-to-fire or aim assistance. The preserved M1 no-combat playground is available via its selection-screen link or `http://127.0.0.1:5173/?mode=playground`.

- WASD moves on the XZ floor at 6 units/second with equal diagonal speed. Opposing keys cancel.
- The game view fills the browser window with no header, footer, or page scroll during runs (selection keeps the normal header). A compact Pause overlay sits top-right, clear of the combat HUD; full control instructions live in the pause dialog. Classic and Angled orthographic cameras are selectable in the pause menu (Angled is the default); both follow 45% of player translation. Movement is screen-relative and aiming uses cursor-ground projection for either preset. The 120 × 96 stage bounds the 0.4-unit-radius player collider, with ten gameplay cover rectangles and open lanes between them (development fallback layout; the authorized urban preview will define its own smaller layout and matching collision).
- Sabrina renders as a real-time 3D model at 2.15 m display height; the other five dolls use upright placeholders. Every doll uses a bottom-center foot origin. The foot ring marks the ground position.
- Move the mouse over the arena view: the gold direction marker follows the shared aim direction; the target ring marks the cursor projected onto Y=0. Projection uses the actual canvas rectangle after camera movement and on every frame, including resize with a stationary cursor.
- Aim can extend outside the bounded arena onto the same floor plane. A missing or near-zero target preserves the last valid direction. Leaving the canvas hides the cursor target.
- Escape or Pause opens the pause interface. Escape or Resume deliberately resumes. Focus loss/hidden tabs pause, clear input and require a deliberate resume with fresh movement keys.
- WebGL startup errors show a fallback message; context loss pauses and offers recovery/reload guidance.
- Space dashes (movement direction, else aim); HUD shows READY, countdown or DASHING. Dash trail/ring placeholders are visible only during the 0.20 s invulnerability interval. Pause/focus freezes dash, warning, projectile, weapon and spawn timers, clears held keys/aim/queued dash, and resume needs a deliberate action with no catch-up jump.

M3 includes one pursuer type plus one ranged type with telegraph/projectiles and phased spawn pressure. Survival pacing for the larger arena:

| Phase (starts) | Spawn interval | Max alive | Max ranged |
| --- | --- | --- | --- |
| 0 s | 3.0 s | 6 | 1 |
| 20 s | 2.4 s | 10 | 2 |
| 60 s | 2.0 s | 14 | 2 |
| 120 s | 1.6 s | 18 | 2 |

First spawn at 4 s, no spawn within 8 units of the player (out-of-view points at 16+ units preferred), capped populations never bank missed spawns. Level need steepened to 5 + (level−1) × 3 so upgrades land ~30–45 s apart at the higher kill rate; XP drops unchanged. Before: 24 × 24 arena, phases 3.5 s/4, 3.0 s/6, 2.6 s/8, spawn distance 6, level need 3 + (level−1) × 2.

M4 adds per-run progression: defeated enemies drop one green XP gem each (pursuer 2, ranged 4; larger octahedrons for ranged drops). Walk over gems to collect them — nearby gems drift toward you. The HUD shows LV, an XP bar, HP against the run's max HP, derived magazine size and an EVO tag once evolved. Level need is 5 + (level−1) × 3 up to level 20 (current pacing formula); excess XP carries and each earned level queues one choice. Level-ups freeze the whole run and offer 3 distinct eligible upgrades: gun ranks 1–5 (+15% damage each), Plated Vest (+25 max HP, heals 25), Drum Magazine (+30% magazine on next reload), Trigger Unit (fire interval ×0.88), or the gold Shockwave Barrage evolution. Sabrina automatically pulses knockback every 6 seconds and is the only doll with an evolution: Broad shotgun rank 5 + Plated Vest rank 3 makes every 4th volley empowered (double damage/knockback, +4 pellets). The dialog always shows the evolution requirements for Sabrina. Field Rations (heal 30) is always available so you can never get stuck. Retry, restart and character switching wipe all progression. Dev-only: start a run at `?devxp=N` (e.g. `http://127.0.0.1:5173/?devxp=150`) to grant N XP for testing builds; retries never grant it.

No three-skill kits, ultimates beyond the pulse/evolution above, audio, storage, skeletal animation, or finished weapon presentation is implemented. Sabrina's real-time model uses procedural feedback only; the other five dolls remain placeholders. Blender sources live in `assets-source/` and optimized runtime GLB/SVG outputs live in `public/assets/`; reference screenshots are direction only and are never embedded at runtime. No official sprites are included. Placeholders never count as finished M5 art.

## Actual structure

```text
src/
  app/              React shell, entry point, layout styles
  game/
    core/           World state/reset, run status, fixed 60 Hz simulation
    data/           Typed character, weapon, pursuer and cover definitions
    systems/        Movement, targeting, weapons, swept collision, enemies/projectiles
  render/           Arena/district stages, Sabrina 3D model, camera presets/aim, batched combat visuals
  platform/         Browser input, focus/visibility and graphics lifecycle
  ui/               Selection, HUD, pause, level-up, game over and render-error boundary
tests/
  core/             Simulation timing and pause lifecycle
  systems/          Movement, targeting, weapon timing/collision/combat/progression lifecycle
  browser/          Production Chrome checks for all six dolls and preserved M1
docs/               Design baseline, decisions, provenance and evidence
```

Simulation contains no React, browser or Three.js imports. React subscribes to lifecycle and changed HUD values, never per-projectile state. Each fixed step moves the player, samples current camera/cursor projection, then runs combat. Rendering refreshes projection even on frames with no fixed step and synchronizes visual transforms after simulation. Shared systems handle all six weapons; fixed-capacity render batches handle enemies and projectiles. Catch-up is bounded to six simulation steps per frame; long stalls intentionally discard excess time. Rendering currently uses the latest fixed-step position without interpolation.

`public/assets/` holds optimized runtime GLB/SVG outputs and `assets-source/` holds editable Blender/generation sources. Keep runtime assets separate from editable art sources. `.gitignore` excludes dependencies, builds, test captures, temporary files, secrets, reference screenshots, MMD sources, local-only character outputs, and Blender backup files while allowing useful `.blend` source files.

## M5 status: industrial fallback retained, urban preview is the acceptance path (2026-09-07 reconciliation)

The finite fallback playfield remains **120 × 96 units** (X × Z) with ten gameplay cover rectangles. The industrial-district art pass (baked surface, inspection kiosk, barriers, service equipment, pipe banks, freight containers, workshop silhouettes, fencing, grouped supplies) is technically integrated, but its appearance was visually unsatisfactory — repeated primitive props, large flat surfaces, and ground markings did not produce the intended appearance — and it is **not** the acceptance path. It is retained as a development fallback only. Source, export and review details are in [ART_AND_MAP_PIPELINE.md](docs/ART_AND_MAP_PIPELINE.md), with preserved checks in [PLAYTEST_CHECKLIST.md](docs/PLAYTEST_CHECKLIST.md).

Enemy pressure retains its phase pacing/caps/ranged limits but chooses from distributed, safe spawn positions across the larger map (12-unit minimum, 22-unit preferred distance). An enemy that remains more than 52 units away for 10 seconds is removed without a kill or XP drop, so an abandoned distant group cannot indefinitely consume the live cap. Normal defeats and their XP rewards are unchanged.

The current editable kit is `assets-source/environment-kit/m5_industrial_district.blend`; repeatable kit and ground generators sit beside it, and runtime GLBs/SVG live in `public/assets/environment-kit/`. The earlier `m5_environment_kit.blend` is retained untouched as prior-work source.

## Pinned toolchain

`package-lock.json` pins the full install; do not replace it with a second package-manager lockfile.

| Package | Verified version |
| --- | --- |
| React / React DOM | 19.2.8 |
| React Three Fiber | 9.7.0 |
| Three.js / Three types | 0.185.1 / 0.185.4 |
| Vite / React plugin | 8.2.2 / 6.1.1 |
| TypeScript | 5.9.3 |
| ESLint / typescript-eslint | 10.10.0 / 8.69.0 |
| Vitest / Playwright | 5.0.0 / 1.63.0 |

Compatibility was checked against official [R3F documentation](https://github.com/pmndrs/react-three-fiber/blob/master/docs/getting-started/introduction.mdx), [Vite requirements](https://vite.dev/guide/), [Three.js raycasting documentation](https://threejs.org/docs/pages/Raycaster.html), and npm peer/engine metadata. R3F 9 uses React 19; TypeScript 5.9 fits the lint tooling's supported range.

## Verification and known limitations

M4 verification (2026-09-06): build (incl. typecheck), standalone typecheck, lint and `git diff --check` passed; **98 unit tests passed in 7 files** (13 M1 + 25 M2 combat + 28 M3 + 5 follow-up + 27 M4 incl. a 240 s pressure soak holding per-step caps); **19 production Chrome browser tests passed** in ~4.7 min (existing 18 + 1 sustained pressure run to 60 s+ with density and readable ranged counts). The 240 s soak (kiting evolving Sabrina) survived, reached evolution, and never exceeded live phase caps; no simulation-side bottleneck observed (soak runs in ~1 s of Node time). Screenshots `test-results/m4-gems.png`, `m4-levelup.png`, `m4-evolution.png`, `m4-hud-desktop/narrow.png` and `m4-pressure.png` (LV 7, 16 kills at 01:05, 9+ enemies, covers, gems) were visually inspected. Environment: headless Chrome + software WebGL — correctness checks, not GPU performance. See [M4 evidence](docs/MILESTONES.md). No commit, push or deployment performed.

M4 limitations: provisional balance (measured soak bot evolved naturally at ~2 min/level 9/48 kills and survived the full 240 s; director feel check still needed, including level-up frequency of roughly one per 15–30 s); gems read small in stills; pulse feedback is enemy hit-flash only; focus-loss coverage still synthetic. After choosing upgrades, auto-fire needs the mouse to move over the canvas again (pointer clears with inputs, as with pause/resume). Real browser zoom/DPR, other browsers, graphics-context recovery, reference-GPU performance and human upgrade feel remain manual. The rendering bundle is ~1.11 MB minified / ~307 KB gzip and still triggers Vite's size warning.

M3 verification: core mechanics were manually playtested by Ian (dash, collision, ranged attacks, enemy pressure, pause/real Alt-Tab, reset, all six dolls) and **accepted**, as was the pause-menu/timer follow-up (committed as `cbafbdc`); remaining limitations from the automated checks still apply. Automated checks: build (incl. typecheck), standalone typecheck, lint and `git diff --check` passed; **71 unit tests passed in 6 files**; **13 production Chrome browser tests passed**. Screenshots `test-results/m3-dash.png`, `m3-warning.png`, `m3-projectile.png` and `m3-pause-menu.png` were visually inspected. See [M3 evidence](docs/MILESTONES.md).

M3 limitations: provisional tuning throughout; static placeholder doll silhouettes; at most 2 ranged enemies; software-WebGL correctness checks do not establish GPU performance. Real browser zoom/DPR, other browsers, graphics-context recovery and human dash/weapon feel still need manual review (real Alt-Tab covered by Ian's playtest). The rendering bundle is ~1.11 MB minified / ~304 KB gzip and still triggers Vite's size warning. M3 fully accepted by Ian.

M2 limitations: provisional balance, static placeholder doll silhouettes, one enemy type, no enemy-to-enemy separation, no audio or later systems. Sustained knockback can pin a pursuer, and the sniper can kill a basic pursuer in one shot; director feedback should guide tuning. Software-WebGL correctness checks do not establish GPU performance. Real Alt-Tab/visibility changes, browser zoom/DPR, other browsers, graphics-context recovery and human movement/weapon feel still need manual review. The current rendering bundle is ~1.10 MB minified / ~302 KB gzip and still triggers Vite's size warning. Acceptance remains pending.

Relocation verified on 2026-09-06 from **`C:\Users\MY PC\Desktop\GFL Game`**: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test` (13 passed), and the existing `npm run test:browser` suite (3 passed) all completed successfully. Existing dependencies worked after the move; no package or lockfile changes/reinstall were needed. Production output was regenerated. Checksums confirm the application, tests and configuration were preserved unchanged. The old folder was removed only after transfer verification and an empty-directory check. Previous browser captures and the transfer manifest are preserved in ignored `.tmp/relocation-before/`. Director acceptance remains pending; the original M0/M1 evidence and manual limitations below still apply.

On 2026-09-06, build (including typecheck), standalone typecheck, lint, 13 unit tests, and 3 production Chrome browser tests passed. M0's minimal scene was also built, checked, and visually inspected before M1 implementation. The final scene screenshots were inspected at 1280 × 800 and 960 × 700; browser assertions measured cursor projection error below 0.1 CSS pixel. See [milestone evidence](docs/MILESTONES.md).

Vite reports a bundle-size warning: the main JavaScript bundle is approximately 1.08 MB minified / 298 KB gzip, primarily the rendering stack. It is not a build failure. Browser coverage is headless Chrome with software WebGL; no 60 FPS or reference-GPU claim is made. Real OS Alt-Tab, browser zoom/DPR changes, other browsers, context recovery on a real graphics reset, and subjective movement feel remain manual checks. Native browser-control connection was unavailable; automated Chrome tests were available. No Git repository existed; no commit, push or deployment was performed.

## Director playtest

M4 director results (2026-09-06, baseline accepted for progression to M5): XP collection/drops, level-up flow, upgrades and restart/retry/switching all good. Evolution works but needs refinement — desired changes still need clarification, so it is deferred and not redesigned yet. The XP-bar layout fix is accepted. Larger arena approved as the M5 baseline; density and spawn pressure feel good after one minute. Header/footer removal, Pause overlay, and pause-dialog instructions tested well and are accepted. Selection-screen palette (charcoal/orange/warm-white provisional) is implemented and verified, pending Ian's visual review. The separate pause/timer/dash/warning/separation/pressure regression check still requires matching evidence. Remaining checks (try Sabrina first, then one rifle and one shotgun doll):
- Kill enemies, watch green gems drop, walk over them: LV, XP bar and xp fill; larger gems come from purple ranged enemies.
- Earn a level: the run freezes with 3 ranked choices; pick a gun rank and confirm stronger shots; pick Plated Vest and confirm higher max HP.
- Queue check: with `?devxp=150`, pick through several queued levels; choices stay distinct and the run resumes after the last one.
- Evolution (Sabrina): take Broad shotgun to rank 5 and Plated Vest to rank 3, then take the gold Shockwave Barrage; confirm the EVO tag and empowered volleys every 4th shot.
- Open a level-up, Alt-Tab away and return: the choice screen is intact, nothing advanced, no drift after resuming.
- Restart mid-build and switch dolls: LV 1, empty XP, base weapon, no EVO, no leftover gems.

Pacing follow-up checklist (pending; play normally — no shortcut needed, though `?devxp=` still works for build testing):
- Survive past 01:00 and 02:00: density should clearly step up; ranged count stays readable.
- Confirm kills feel rewarded but level-ups don't interrupt constantly.
- Check spawns arrive from off-view, never beside you.
- Resize the window mid-run and try a narrow width: full-window view, true aim, usable HUD and dialogs.

M3 and its pause-menu/timer follow-up are accepted by Ian. Earlier checklists retained below.

M3 checklist (all six dolls preserved; try at least Sabrina plus one rifle and one shotgun):
- Dash west/east with a held key; dash stationary and check it follows cursor aim.
- Dash through an incoming orange shot or a pursuer touch: no damage during the 0.20 s dash; damage returns immediately after.
- Spam Space: the second dash must not fire until the 1.20 s HUD countdown ends.
- Dash into the east cover block and the arena edge: the dash must stop, never cross.
- Wait for a purple ranged enemy: confirm the 0.90 s red beam, sidestep after it appears (the shot must land where you were, not follow you), and confirm the slow orange projectile.
- Pause mid-dash and mid-warning: timers freeze, keys clear, resume needs a button/Escape with fresh keys.
- Die, retry with the same doll, then return to selection and switch: fresh HP/ammo/dash/counters, no leftover warnings or orange shots.

M2 comparison retained: Compare Sabrina's broad/heavier shotgun with Vepley's fast/lighter knockback volleys; Qiongjiu's three-round bursts with Tololo's steady rifle; Mosin-Nagant's slow piercing line shots with Peritya's large magazine and long reload. For each doll: get a kill, aim away or leave the canvas to take damage, die, retry, then return to selection and switch. Check fresh HP/ammo/counters and no leftover projectiles. Pause/Alt-Tab during a burst and reload, then deliberately resume. Try shooting across the cover block and away from in-range enemies. The full unchecked director checklist is in [PLAYTEST_CHECKLIST.md](docs/PLAYTEST_CHECKLIST.md).

- Move with each key, then diagonally; check responsiveness and equal speed.
- Walk every edge/corner; feet must stay inside the gold boundary and slide along edges.
- Aim around all sides and near the feet. The gold marker should point toward the cursor's floor position.
- Hold movement with a stationary mouse; targeting should remain under the cursor as the camera follows.
- Resize the window and try browser zoom, then repeat aiming.
- Pause while holding a key; Alt-Tab away while moving. Return and deliberately resume: no drift, held key or catch-up jump should remain.

Report what you tried, expected, and observed. Director feedback is recorded separately from technical checks.

## Documentation and next scope

- [Agent instructions](AGENTS.md)
- [Original kickoff and local setup](START_HERE.md)
- [Game design](docs/GAME_DESIGN.md)
- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Milestones and status](docs/MILESTONES.md)
- [Art and map pipeline](docs/ART_AND_MAP_PIPELINE.md)
- [Asset manifest](docs/ASSET_MANIFEST.md)
- [Playtest and verification](docs/PLAYTEST_CHECKLIST.md)
- [Decisions and sources](docs/DECISIONS.md)

The approved M2 scope includes all six basic weapons and selection. M3 added dash evasion, ranged pressure, pause options and the run timer. M4 adds XP levels, upgrade choices, gun/equipment ranks, Sabrina's auto-pulse and one evolution. Full doll skill kits and a paced three-to-five-minute encounter remain later milestones. M5 is the single active milestone: the next authorized task is one convincing urban combat street-corner preview with explicit permission to redesign its layout and matching collision (see `docs/MILESTONES.md`). Pause new environment implementation until that brief is used; do not mark M5 accepted without Ian's visual review.
