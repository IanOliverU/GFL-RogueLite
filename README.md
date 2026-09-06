# GFL2 Exilium Fan Game — M3 dash and pressure prototype

Independent Girls' Frontline-inspired browser fan-game prototype. Ian is director/producer and playtester. M0/M1 are preserved, the expanded M2 added six selectable dolls with distinct basic weapons and shared combat (accepted, committed as `e8bb217`), and M3 adds dash evasion plus ranged-enemy pressure. These are prototype fan-game adaptations, not verified official kits. M3 acceptance is pending Ian's review; stop here before M4.

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
- A fixed elevated orthographic camera follows 45% of player translation without rotating. The 24 × 24 arena bounds the entire 0.4-unit-radius player collider.
- The upright placeholder uses a bottom-center foot origin. The foot ring marks its ground position.
- Move the mouse over the arena view: the gold direction marker follows the shared aim direction; the target ring marks the cursor projected onto Y=0. Projection uses the actual canvas rectangle after camera movement and on every frame, including resize with a stationary cursor.
- Aim can extend outside the bounded arena onto the same floor plane. A missing or near-zero target preserves the last valid direction. Leaving the canvas hides the cursor target.
- Escape or Pause opens the pause interface. Escape or Resume deliberately resumes. Focus loss/hidden tabs pause, clear input and require a deliberate resume with fresh movement keys.
- WebGL startup errors show a fallback message; context loss pauses and offers recovery/reload guidance.
- Space dashes (movement direction, else aim); HUD shows READY, countdown or DASHING. Dash trail/ring placeholders are visible only during the 0.20 s invulnerability interval. Pause/focus freezes dash, warning, projectile, weapon and spawn timers, clears held keys/aim/queued dash, and resume needs a deliberate action with no catch-up jump.

M3 includes one pursuer type plus one ranged type with telegraph/projectiles and phased spawn pressure. No XP, three-skill kits, ultimates, weapon evolution, audio, storage or polished art is implemented. All visible assets are project-created procedural geometry/flat planes or labeled CSS silhouettes; Blender was not needed or used. No official sprites are included.

## Actual structure

```text
src/
  app/              React shell, entry point, layout styles
  game/
    core/           World state/reset, run status, fixed 60 Hz simulation
    data/           Typed character, weapon, pursuer and cover definitions
    systems/        Movement, targeting, weapons, swept collision, enemies/projectiles
  render/           Arena, foot-anchored planes, camera/aim, batched combat visuals
  platform/         Browser input, focus/visibility and graphics lifecycle
  ui/               Selection, HUD, pause, game over and render-error boundary
tests/
  core/             Simulation timing and pause lifecycle
  systems/          Movement, targeting, weapon timing/collision/combat lifecycle
  browser/          Production Chrome checks for all six dolls and preserved M1
docs/               Design baseline, decisions, provenance and evidence
```

Simulation contains no React, browser or Three.js imports. React subscribes to lifecycle and changed HUD values, never per-projectile state. Each fixed step moves the player, samples current camera/cursor projection, then runs combat. Rendering refreshes projection even on frames with no fixed step and synchronizes visual transforms after simulation. Shared systems handle all six weapons; fixed-capacity render batches handle enemies and projectiles. Catch-up is bounded to six simulation steps per frame; long stalls intentionally discard excess time. Rendering currently uses the latest fixed-step position without interpolation.

`public/assets/` and `assets-source/` will be created when actual asset files require them. No empty future-system folders are scaffolded. Source geometry lives in `src/render/`. Keep optimized runtime assets separate from editable art sources when introduced. `.gitignore` excludes dependencies, builds, test captures, temporary files, secrets, and Blender backup files while allowing useful `.blend` source files.

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

M3 verification: core mechanics were manually playtested by Ian (dash, collision, ranged attacks, enemy pressure, pause/real Alt-Tab, reset, all six dolls) and **accepted**; remaining limitations from the automated checks still apply. Automated checks (finishing agent; M2 `e8bb217` preserved): build (incl. typecheck), standalone typecheck, lint and `git diff --check` passed; **71 unit tests passed in 6 files** (13 M1 + 25 M2 combat + 28 M3 + 5 follow-up); **13 production Chrome browser tests passed** (6 doll lifecycles, 1 selection/switch, 2 M3 dash/ranged, 1 follow-up pause-menu/timer, 3 M1 regressions). Dash cooldown timing was re-checked at the step level (1.20 s from activation). Screenshots `test-results/m3-dash.png`, `m3-warning.png`, `m3-projectile.png` and `m3-pause-menu.png` (three pause options, discard note, TIME 00:02) were visually inspected. See [M3 evidence](docs/MILESTONES.md). No commit, push or deployment performed.

M3 limitations: provisional tuning throughout; static placeholder doll silhouettes; at most 2 ranged enemies; software-WebGL correctness checks do not establish GPU performance. Real browser zoom/DPR, other browsers, graphics-context recovery and human dash/weapon feel still need manual review (real Alt-Tab covered by Ian's playtest). The rendering bundle is ~1.11 MB minified / ~304 KB gzip and still triggers Vite's size warning. Core M3 accepted by Ian; the pause-menu/timer follow-up is pending his review.

M2 limitations: provisional balance, static placeholder doll silhouettes, one enemy type, no enemy-to-enemy separation, no audio or later systems. Sustained knockback can pin a pursuer, and the sniper can kill a basic pursuer in one shot; director feedback should guide tuning. Software-WebGL correctness checks do not establish GPU performance. Real Alt-Tab/visibility changes, browser zoom/DPR, other browsers, graphics-context recovery and human movement/weapon feel still need manual review. The current rendering bundle is ~1.10 MB minified / ~302 KB gzip and still triggers Vite's size warning. Acceptance remains pending.

Relocation verified on 2026-09-06 from **`C:\Users\MY PC\Desktop\GFL Game`**: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test` (13 passed), and the existing `npm run test:browser` suite (3 passed) all completed successfully. Existing dependencies worked after the move; no package or lockfile changes/reinstall were needed. Production output was regenerated. Checksums confirm the application, tests and configuration were preserved unchanged. The old folder was removed only after transfer verification and an empty-directory check. Previous browser captures and the transfer manifest are preserved in ignored `.tmp/relocation-before/`. Director acceptance remains pending; the original M0/M1 evidence and manual limitations below still apply.

On 2026-09-06, build (including typecheck), standalone typecheck, lint, 13 unit tests, and 3 production Chrome browser tests passed. M0's minimal scene was also built, checked, and visually inspected before M1 implementation. The final scene screenshots were inspected at 1280 × 800 and 960 × 700; browser assertions measured cursor projection error below 0.1 CSS pixel. See [milestone evidence](docs/MILESTONES.md).

Vite reports a bundle-size warning: the main JavaScript bundle is approximately 1.08 MB minified / 298 KB gzip, primarily the rendering stack. It is not a build failure. Browser coverage is headless Chrome with software WebGL; no 60 FPS or reference-GPU claim is made. Real OS Alt-Tab, browser zoom/DPR changes, other browsers, context recovery on a real graphics reset, and subjective movement feel remain manual checks. Native browser-control connection was unavailable; automated Chrome tests were available. No Git repository existed; no commit, push or deployment was performed.

## Director playtest

M3 core is accepted by Ian. Pending follow-up checklist (pause options + timer):
- Pause mid-run: confirm Resume run, Restart run and Change character plus the discard note.
- Resume: run continues with elapsed time, HP and enemies preserved.
- Restart run: same doll, TIME back to 00:00, fresh HP/ammo/dash/counters, no leftover enemies or orange shots.
- Change character: selection screen returns; pick another doll and start clean.
- TIME advances during play (MM:SS), freezes while paused and after game over.

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

The approved M2 scope now includes all six basic weapons and selection. M3 adds dash evasion and ranged pressure only. Full doll skill kits, XP, upgrades, evolutions and a paced three-to-five-minute encounter remain later milestones. Review M3 before authorizing further development.
