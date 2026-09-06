# Milestones and implementation status

## Authoritative status

Baseline inspected on 2026-09-06. Existing documents preserved; no Git repository was present in the project or enclosing workspace.

Current application root: `C:\Users\MY PC\Desktop\GFL Game`. The existing M0/M1 project was relocated from the nested starter folder on 2026-09-06. Original implementation evidence below is retained as history; relocation verification is recorded separately.

| Milestone | Status | Evidence | Director feedback |
| --- | --- | --- | --- |
| M0 Foundation | Technically complete | Build/typecheck/lint passed; dev starts; production minimal scene inspected in headless Chrome | Pending Ian's review |
| M1 Movement and aiming | Technically complete | Build/typecheck/lint; 13 unit tests; 3 production browser tests; screenshots inspected | Pending Ian's review |
| M2 Combat — expanded six-doll scope | Accepted and committed | `e8bb217`; previous 38 unit / 10 browser checks retained | Accepted by Ian in the M3 authorization |
| M3 Evasion and pressure | Core accepted; approved follow-up in progress | Dash, ranged pressure and regression verification active; pause-menu/timer follow-up under verification | Core mechanics accepted by Ian after manual playtest (incl. real Alt-Tab); follow-up acceptance pending |
| M4 Run progression | Planned | None | Not recorded |
| M5 Visual prototype | Planned | None | Not recorded |
| M6 First playable | Planned | None | Not recorded |

Ian accepted M2 and confirmed it committed, then authorized M3 evasion and enemy pressure. M3 is the current stopping point; its acceptance remains pending. Mark one milestone In progress at a time. Completion means criteria have evidence; director feedback is a separate field and must not be invented. Record unperformed checks as pending. No automatic deployment or release follows completion.

## M0 — Foundation

Inspect directory/Git; preserve docs; scaffold compatible Vite/React/TS/R3F/Three dependencies. Add startup/build/typecheck/lint scripts; record Node and dependency versions. Render a minimal scene and confirm the production build. Keep code structure small.

Exit: local app starts, minimal scene is visible when browser testing is available, build/typecheck/lint pass. Missing browser access must be recorded, not counted as passed.

## M1 — Movement and aiming

Fixed elevated orthographic camera, flat bounded arena, foot-anchored character placeholder, WASD, normalized diagonals, cursor-ground projection, aim indicator, pause/focus/resize handling. Optionally validate one sprite and one simple prop import; placeholders remain valid.

Exit: all-around aim works while moving and after resizing; camera translation does not shift aim; boundaries work; UI/focus clears input; no background simulation. No enemies or weapon damage in this milestone.

## M2 — Combat

Approved scope update (2026-09-06): implement character selection for Sabrina, Qiongjiu, Tololo, Mosin-Nagant, Peritya and Vepley, each with a distinct data-driven basic weapon. This supersedes Sabrina-only M2 and the later basic-roster rollout. Shared combat includes fire-range gating, volley/burst timing, magazines/reload, swept projectile collision, piercing, knockback, a pursuing enemy type, health, hit feedback, death, retry with the same doll and return to selection. Gun fires along cursor aim, never snaps to a target. Provide a static obstacle to verify wall hits. Use clearly labeled original placeholders and prototype fan-game adaptations, not claimed official kits.

Exit: all six can be selected, start, fire distinct weapons, damage/defeat enemies, die and restart. Test bursts, piercing, knockback, reload, pause/focus and complete run-state resets when retrying or switching dolls. Hits/misses/piercing match visuals; damage stops after death; restarts do not duplicate listeners/entities; firing is frame-rate independent. Three-skill kits, ultimates, evolutions, polished animation and M3+ systems remain excluded. Stop after expanded M2; acceptance stays pending director review.

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

The six basic weapons and selection are now authorized in M2. Full three-skill kits, more equipment, roughly ten-minute pacing and additional arenas remain later work after feedback. Room-based structure/mobile/online features require an explicit scope update.

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

### Expanded M2 implementation and verification — 2026-09-06

- Authorization: Ian explicitly expanded M2 from Sabrina-only combat to all six playable dolls and character selection, overriding the earlier basic-roster restriction. Full skills, ultimates, evolutions, polished animations and M3+ systems remain excluded. Acceptance is pending Ian's review.
- Starting state: application root `C:\Users\MY PC\Desktop\GFL Game`; Git now exists and was clean on `main` tracking `origin/main` at inspection. M0/M1 source and verification history retained. Existing package versions/lockfile reused without changes. No commits, push or deployment made.
- UI: six named, selectable cards show basic weapon descriptions, explicit placeholder labels and selected state. Start uses the chosen doll. Combat HUD shows doll/weapon, health, ammunition/reload and kills. Game over offers same-doll retry and return to selection. Shared static flat geometry uses six placeholder colors; all art is project-created.
- Combat: typed character/weapon/pursuer/obstacle data; one shared firing/burst/reload system; swept projectiles with sorted collision, enemy hit bookkeeping, bounded piercing and knockback; 40-HP pursuers with contact damage and navigation around one cover block. Up to 8 enemies and 192 projectiles; no wave/progression/XP system. M1 movement, foot anchor, camera and cursor aim are retained. Projection is sampled after movement before firing, and refreshed on idle render frames.
- Lifecycle: selection, playing, paused and game_over are authoritative. Pause/focus clears held inputs and aim; simulation and weapon/reload timers freeze. Escape/focus cannot bypass selection or revive game over. Retry/switch replaces health, ammo, all weapon/hurt/spawn timers, entities, IDs, aim/input, elapsed time and counters. No extra listeners or timers are created on retry; leaving the arena unbinds browser listeners. M1 no-combat route is available at `?mode=playground`; its browser assertions were preserved with only the entry URL adjusted.
- Checks: `npm run build`, standalone `npm run typecheck`, `npm run lint` and `git diff --check` passed. `npm run test`: 38 tests passed in 4 files (13 prior + 25 combat). `npm run test:browser`: all 10 tests passed in 1.8 minutes (6 doll lifecycles, 1 selection/switch lifecycle, 3 M1 regressions). Initial burst timing test needed floating-point tolerance rather than exact equality; the weapon timing itself matched the specified sequence. Final build retained the same production JS/CSS hashes as the full browser-tested build.
- Unit evidence: every doll fired, dealt damage, killed, died, froze on death and restarted/switched with a pristine world; every magazine/reload checked, including paused reloads. Verified Qiongjiu's 0.1-second burst spacing and 0.55-second recovery, current-step aim, mid-burst pause/no queued fire without fresh aim, range/aim gate cancellation, even shotgun spread and distinct damage/cadence, 30/60/144 Hz firing counts, projectile cap, swept thin-target/tangent/overlap hits, distance-ordered three-enemy sniper piercing, no repeat hits, cover/perimeter stops, non-additive stronger Vepley impulse, collision-constrained knockback, pursuit around cover and bounded spawns.
- Browser evidence: installed Chrome 152.0.7977.77, headless Playwright with software WebGL, Windows x64, Node 24.12.0/npm 11.7.0. For each doll: selected card/summary, started, aimed at the initial real pursuer, observed shots/hits/kills, paused during held movement, asserted frozen timers and empty inputs, dispatched synthetic blur/focus, deliberately resumed, left aim input to take contact damage, reached real game over, checked time remained frozen, retried and checked fresh HP/ammo/timers/projectiles/counters. Separate case returned to selection and switched Sabrina to Peritya. All recorded browser error arrays were empty. No simulated damage/death shortcut or mutable browser test control was introduced.
- Visual evidence: inspected selection screenshot, Peritya combat/HUD screenshot and the live Sabrina arena with pursuer/health bar/cover. A focused Sabrina browser rerun passed after adding the arena capture. Generated captures are ignored under `test-results/`. No claim of manual human playtesting or official character likeness.
- Known limitations/manual checks: provisional tuning; one enemy type; static placeholders; no enemy separation (pursuers can overlap); no audio or later systems. Software rendering is not a reference-GPU performance test. Physical Alt-Tab/tab visibility transitions, zoom/DPR, other browsers, real context recovery and subjective movement/weapon feel remain unverified manually. Reload/burst/piercing/knockback specifics are asserted by simulation tests; director comparison in the real browser remains pending. Vite still warns about the ~1.10 MB minified / ~302 KB gzip rendering bundle. Original M0/M1 and relocation limitations above remain historical evidence.
- Next action: Ian compares the six weapons using `docs/PLAYTEST_CHECKLIST.md` and supplies acceptance/tuning feedback. Stop after M2; do not begin M3 without authorization.

### M3 implementation and verification — 2026-09-06

- Authorization: Ian accepted M2 (`e8bb217`) and authorized M3 evasion and enemy pressure. Acceptance remains pending. Uncommitted/untracked M3 work was preserved and finished in place; no M4 systems added.
- Changes: dash data/tuning (`DASH`: 4 units over 0.20 s at speed 20, 1.20 s cooldown from activation, invulnerable while `dash.remaining > 0`); swept dash collision (`moveCircleSwept`) stopping at cover/perimeter; shared player-damage gate (contact + hostile shots share the 0.7 s hurt interval, dash blocks both); ranged enemy data (`RANGED`: 50 HP, 0.90 s warning locked at onset, 2.8 s recovery, range 10 / hold 7 / retreat 4, 7 u/s shots); warning path shared by telegraph rendering and shot direction; swept hostile projectiles with relative player-motion sweep and dash dodge counting; deterministic bounded enemy separation; phased spawn pressure (first spawn 4 s; phases 0/15/40 s; intervals 3.5/3.0/2.6 s; caps 4/6/8 alive; at most 1/2/2 ranged; 6-unit player exclusion, no banked spawns); Space input with scroll prevention and no repeat queuing; pause/focus clearing queued dash with resume-delta clamping; full M3 state resets; purple ranged placeholders, red warning stripes, orange hostile shots, dash trail/ring placeholders, dash HUD (READY/countdown/DASHING).
- Cooldown check: the from-activation timing was re-derived (activation step sets 1.20 s; each later step decrements once; 73 steps total reach exactly 0). The weak `> cooldown - 0.5` assertion was tightened to `closeTo(cooldown - 29 * FIXED_STEP)` after 30 steps, keeping the 73-step ready check. This confirms the timing rather than masking a defect.
- Test fix: the warning screenshot was captured while paused, so the pause dialog covered the arena. The browser test now captures `m3-warning.png` while playing, then re-acquires a fresh warning before the freeze assertion (the first warning can fire during the screenshot). No gameplay expectations were weakened.
- Checks performed by the finishing agent: `npm run typecheck` passed; `npm run lint` passed; `npm run test` 66 passed in 5 files; `npm run build` passed (~1.11 MB minified / ~304 KB gzip, size warning only); `npm run test:browser` 12/12 passed in ~2.6 min on the final code (6 doll lifecycles, selection/switch, 2 M3, 3 M1 regressions; headless Chrome, software WebGL). An intermediate full run exposed the warning-race above (11/12); after the test fix, M3 isolation (2/2) and the final full suite (12/12) passed.
- Screenshots inspected: `test-results/m3-warning.png` now shows the red beam through the player with the warning-tinted ranged enemy; `m3-projectile.png` shows the purple ranged enemy, an orange hostile shot in flight, and HP 80/100 (correct 100 maximum); `m3-dash.png` shows DASHING HUD state. Dash trail/ring placeholders are faint at capture scale; enemy health bars use per-kind maxima (`definition.health`) but are thin at game scale.
- Known limitations: provisional tuning; faint dash trail in stills; thin enemy health bars; focus-loss coverage still synthetic; real Alt-Tab, zoom/DPR, other browsers, context recovery, reference-GPU performance and human feel remain manual. No XP/upgrades/evolutions/polished assets added.
- Director feedback: not received; M3 acceptance pending. Next action: Ian runs the README M3 checklist. Stop after M3; do not mark accepted, commit, push or deploy.

### M3 follow-up: pause-menu options and run timer — in progress, acceptance pending

- Director feedback received: Ian manually playtested M3 dash, collision, ranged attacks, enemy pressure, pause/Alt-Tab (real Alt-Tab included), reset and all six dolls, and accepted the core M3 mechanics. Remaining verification limitations below still apply.
- Approved follow-up scope (no M4, no tuning changes): pause menu gains Resume (continue run), Restart run (fresh run, same doll) and Change character (back to selection), reusing the existing `startRun`/`returnToSelection` flows with an explicit discard note; combat HUD gains a readable MM:SS TIME display driven by `world.elapsed` (consistent with spawn-pressure phases), frozen on pause/focus loss/game over and reset to 00:00 on every new/restarted run. HUD `elapsed` is floored whole seconds, so the HUD re-renders at most once per second.
- State clearing: restart/change reuse the same flows as game-over retry/switch (fresh world, cleared held keys/aim/queued dash, reset accumulator/timers/counters), so enemies, projectiles, weapon/reload, health/ammo, dash, spawn progression and pending actions are all reset. Browser focus safeguards untouched.
- Checks: `tests/systems/m3-followup.test.ts` (5 tests: MM:SS formatting, advance/freeze/reset, restart-from-pause freshness, selection switch, resume preservation); `tests/browser/m3-followup.spec.ts` (timer advances from 00:00, freezes in pause, resume preserves, restart keeps doll with fresh state, change character starts clean with another doll; `test-results/m3-pause-menu.png` inspected — three buttons, discard note and TIME 00:02 all readable).
- Next action: Ian reviews the new pause options and timer. Do not commit, push or deploy; follow-up acceptance pending.

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

