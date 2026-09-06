# Milestones and implementation status

## Authoritative status

Baseline inspected on 2026-09-06. Existing documents preserved; no Git repository was present in the project or enclosing workspace.

Current application root: `C:\Users\MY PC\Desktop\GFL Game`. The existing M0/M1 project was relocated from the nested starter folder on 2026-09-06. Original implementation evidence below is retained as history; relocation verification is recorded separately.

| Milestone | Status | Evidence | Director feedback |
| --- | --- | --- | --- |
| M0 Foundation | Technically complete | Build/typecheck/lint passed; dev starts; production minimal scene inspected in headless Chrome | Pending Ian's review |
| M1 Movement and aiming | Technically complete | Build/typecheck/lint; 13 unit tests; 3 production browser tests; screenshots inspected | Pending Ian's review |
| M2 Combat | Planned | None | Not recorded |
| M3 Evasion and pressure | Planned | None | Not recorded |
| M4 Run progression | Planned | None | Not recorded |
| M5 Visual prototype | Planned | None | Not recorded |
| M6 First playable | Planned | None | Not recorded |

The kickoff authorizes M0 then M1. Mark one milestone In progress at a time. Completion means criteria have evidence; director feedback is a separate field and must not be invented. Record unperformed checks as pending. No automatic deployment or release follows completion.

## M0 — Foundation

Inspect directory/Git; preserve docs; scaffold compatible Vite/React/TS/R3F/Three dependencies. Add startup/build/typecheck/lint scripts; record Node and dependency versions. Render a minimal scene and confirm the production build. Keep code structure small.

Exit: local app starts, minimal scene is visible when browser testing is available, build/typecheck/lint pass. Missing browser access must be recorded, not counted as passed.

## M1 — Movement and aiming

Fixed elevated orthographic camera, flat bounded arena, foot-anchored character placeholder, WASD, normalized diagonals, cursor-ground projection, aim indicator, pause/focus/resize handling. Optionally validate one sprite and one simple prop import; placeholders remain valid.

Exit: all-around aim works while moving and after resizing; camera translation does not shift aim; boundaries work; UI/focus clears input; no background simulation. No enemies or weapon damage in this milestone.

## M2 — Combat

Implement Sabrina shotgun, fire-range gate, volley timing, swept projectile collision, pursuing enemy, health, hit feedback, death, and restart. Gun fires along aim, never snaps to target. Provide a static obstacle to verify wall hits.

Exit: hits/misses/piercing behavior match visuals, damage does not continue after death, restart does not duplicate listeners/entities, and fire timing is frame-rate independent.

## M3 — Evasion and pressure

Dash movement/cooldown/invulnerability; collision prevents wall crossing. Add ranged enemy with readable telegraph/projectiles and initial spawn pacing. Keep concurrent counts modest.

Exit: dash can avoid a demonstrated attack during its invulnerability interval; cooldown prevents spam; ranged attacks are avoidable; no unavoidable spawn directly on the player.

## M4 — Progression

XP pickups, queued level-ups, three eligible choices, limited equipment and gun ranks, one automatic Sabrina skill, one evolution and elite reward opportunity. Add development controls for testing progression.

Exit: UI pauses simulation, caps/eligibility/fallbacks work, evolution is reachable naturally within the tuned run, and new runs reset in-run state. Development shortcuts are not production progression.

## M5 — Visual prototype

Build the checkpoint from modular assets. Integrate consistent idle/run/fire/hit/death presentation (simple procedural hit effects are acceptable and identified). Add restrained lighting, combat audio, effects and quality controls. Audit asset provenance.

Exit: art direction is reviewable, bullets/hazards remain readable, cursor and muzzle align, and measured performance on the named machine is documented. No claim of final animation quality based only on generated frames.

## M6 — First playable

Three-to-five-minute encounter, final elite, win/death/results, menu, settings, local unlock/save behavior, loading and failure states. Browser smoke test in available target browsers. Public hosting remains separately requested.

Exit: an independent tester can start, fight, upgrade, evolve when requirements are reached, win/die, and restart; save errors do not prevent play. Record browser coverage and unresolved limitations. Initial playable availability does not imply six dolls are complete.

## Later expansion

Add Mosin-Nagant second to validate contrasting weapon behavior, then remaining dolls. Expand to full three-skill kits, more equipment, roughly ten-minute pacing and additional arenas after feedback. Room-based structure/mobile/online features require an explicit scope update.

## Evidence log template

### M0 and M1 evidence — 2026-09-06

- Workspace: `GFL2-Roguelite-Starter` inside `GFL Game`. All baseline documents read before edits. `git status --short --branch` reported no repository in either folder, both before and after implementation. Existing design documents preserved; status/setup/provenance updated. No commit, push or deployment performed.
- M0 completed before M1: compatible npm packages and one lockfile installed; Node 24.12.0, npm 11.7.0. Minimal scene production build/typecheck/lint passed. `npm run dev -- --port 5173 --strictPort` started successfully. Initial production Chrome smoke test passed; its screenshot was inspected and showed the floor and upright placeholder before M1 work began.
- M1 changes: pure 60 Hz simulation with at most six catch-up steps; 6 units/second normalized movement; 24 × 24 arena with radius-aware bounds; foot-anchored upright flat geometry; fixed camera angle with 45% translation follow; canvas-relative ground projection after camera updates; shared aim direction and target ring; pause, focus/visibility input clearing, deliberate resume, listener cleanup and graphics failure handling. Only playing/paused states are implemented; later run states and content systems remain deferred.
- Checks performed: `npm run build` (includes `npm run typecheck`) passed; standalone `npm run typecheck` and `npm run lint` passed. `npm run test`: 13 tests passed in 3 files. `npm run test:browser`: 3 production browser tests passed. `npm ls --depth=0` verified installed versions; npm install reported zero known vulnerabilities at install time.
- Unit coverage: equal straight/diagonal movement, opposing keys, all bounds and edge sliding, render-rate-independent movement at 30/60/144 Hz, pause/reset accumulator, bounded catch-up, invalid deltas, subscription cleanup, canvas offsets, invalid/parallel/behind-camera rays, near-zero direction retention, all-quadrant projection across resize/camera translation and stationary-pointer reprojection.
- Browser: installed Google Chrome 152.0.7977.77, headless Playwright 1.63.0, software WebGL (SwiftShader), DPR 1. Windows x64 10.0.26200, AMD Ryzen 5 7500F. No reference-machine GPU/frame-time performance measurement was made. Connected browser-control tool reported no browser, but local Chrome automation worked.
- Browser actions actually performed: cursor moved into four quadrants; D movement with stationary cursor until X > 3; verified translated camera and changed floor target; cursor projection error below 0.1 CSS pixel; resized viewport from 1280 × 800 to 960 × 700 without moving the mouse; reached X=11.6 boundary; moved with W/S; clicked Pause and Resume; used Escape both ways; confirmed frozen simulation time and empty held inputs; dispatched synthetic blur/focus browser events and confirmed no automatic resume or movement drift. Screenshots `test-results/m1-moving-aim.png` and `test-results/m1-resized.png` were visually inspected. They are ignored generated artifacts, recreated by the browser suite.
- Limitations: focus-loss automation used a synthetic DOM blur event, not physical OS Alt-Tab. Real tab switching/minimizing, browser zoom/DPR changes, actual graphics context recovery, other browsers, human input feel and high-refresh smoothness remain director checks. Latest fixed-step positions are rendered without interpolation. The ~1.08 MB minified / ~298 KB gzip JavaScript chunk triggers Vite's bundle-size warning; build succeeds. No enemies/projectiles exist and no 60 FPS claim is made.
- Director feedback: not received; acceptance remains pending. The manual checklist is intentionally unchecked. Next action: Ian's M1 movement/aiming playtest. M2 requires subsequent authorization.
- Suggested commit message, if Git is initialized later: `feat: implement M0 foundation and M1 movement playground`.

### Project relocation verification — 2026-09-06

- Scope: relocation and verification only. Current application root is `C:\Users\MY PC\Desktop\GFL Game`. The original nested `GFL2-Roguelite-Starter` directory is no longer present. M0/M1 implementation and tests were not rebuilt or changed; M2 remains unstarted.
- Inspection: both roots and hidden/dotfiles inspected before moving. The intended parent root was accessible and contained only the starter folder, so there were no destination conflicts or overwritten files. Neither root nor the project tree contained a Git repository; there was no Git history to transfer. No repository was initialized, and no commit, push or deployment was performed.
- Servers: stopped the old root's Vite dev server (5173), production preview (4173), and stale Playwright runner before the move. Verified both ports were no longer listening. PowerShell `Stop-Process` failed with an internal exception; the same identified processes were stopped successfully through the .NET process API.
- Transfer: all contents, including `.gitignore`, source, tests, docs, configuration, lockfile, dependencies and existing generated output, moved into the intended root without changing internal structure. A 9,017-file SHA-256 manifest was captured and verified during transfer. The old directory was removed only after checksums matched and it was confirmed empty. After the usage-limit interruption, verified all 9,017 files still existed with matching sizes and rechecked SHA-256 for all 44 non-dependency files before documentation edits or rebuilds.
- Preservation: after the checks, SHA-256 comparisons confirmed all 29 application/test/package/configuration files were unchanged. Prior browser captures and the manifest remain in ignored `.tmp/relocation-before/`; the original M0/M1 evidence above is retained. Only README, START_HERE, and location/status entries in the documentation were edited. The original location decision in DECISIONS is explicitly superseded.
- Corrected-root results: `npm run build` passed (including its typecheck); standalone `npm run typecheck` passed; `npm run lint` passed; `npm run test` passed all 13 tests in 3 files; `npm run test:browser` passed all 3 existing production tests in 8.3 seconds and exited successfully. No requested check was left unrun. Existing moved dependencies worked; no reinstall, version or lockfile changes were needed. `dist/` was regenerated from the corrected root.
- Browser coverage: fresh production preview started by the existing Playwright configuration, installed headless Chrome 152.0.7977.77 with software WebGL. The unchanged tests covered all-around aiming, stationary cursor during movement/camera follow, resizing, boundaries, pause/resume and synthetic focus loss. These are automated checks, not new director playtest feedback.
- Limitations retained: the ~1.08 MB minified / ~298 KB gzip JavaScript bundle still triggers Vite's size warning. Real OS Alt-Tab/tab switching, browser zoom/DPR changes, other browsers, actual graphics context recovery, subjective movement feel and reference-GPU performance remain manual checks. Focus-loss testing still uses a synthetic event; no new performance or director-acceptance claim is made.
- Director acceptance: pending Ian's review. Next action: open the corrected root in VS Code, run `npm run dev`, and playtest M1. No further development is authorized by this relocation task.

### Template for subsequent milestones

- Milestone and date:
- Changes:
- Build/typecheck/lint/test results:
- Browser and machine:
- Manual steps actually performed:
- Performance scene/counts/results if relevant:
- Known issues and deferred checks:
- Director feedback, if actually received:
- Commit, if created:
- Next task:

