# Instructions for coding agents

## Mission and scope

Build the browser game described in `docs/GAME_DESIGN.md`. Read this file, README, technical plan, decisions, and current milestone before editing. Ian is director/producer. His current instructions override these project defaults. Preserve unrelated files and inspect any existing repository before scaffolding.

### Current direction (2026-09-07 reconciliation; overrides older visual notes in this repo)

- Fully 3D anime characters in grounded urban/industrial environments, viewed through the existing Angled camera (Classic preserved as a selectable fallback).
- The attached street reference guides spatial composition, scale, material quality, and lighting; local GFL2 screenshots guide character compatibility only. Create an original composition; do not embed screenshots into runtime.
- Sabrina is integrated as a real-time 3D model at 2.15 m display height with procedural feedback only; skeletal animation and weapon presentation remain separate follow-ups. No sprite pipeline. The other five dolls remain placeholders.
- The previous full-map environment pass was visually unsatisfactory (repeated primitive props, large flat surfaces, ground markings did not produce the intended appearance). It is retained as a development fallback only and is not the acceptance path.

### Actual state (2026-09-07)

- M0–M3 accepted and committed. M4 baseline is accepted for progression to M5; evolution refinement is deferred pending clarification. M5 is the single active milestone.
- Both Classic and Angled cameras are accepted; Angled is the default.
- Environment appearance is rejected; character animation is unfinished. Do not mark M5 accepted without Ian's visual review.

## First task (historical — do not follow as an active instruction)

The original M0/M1 kickoff in `START_HERE.md` is preserved as history only. Do not start new work at M0/M1, re-scaffold, or limit scope to Sabrina-only/placeholder-only baselines. The next authorized task is defined in `docs/MILESTONES.md` (one convincing urban combat street-corner preview, with explicit permission to redesign its layout and matching collision). Routine implementation decisions within that authorized scope do not require repeated permission. When the authorized task is complete, report the playable result and the next milestone. Do not silently expand scope.

## Architecture

- Use Vite + React + TypeScript + R3F + Three.js; no Phaser in this baseline.
- Keep simulation independent from React and render objects. Rendering consumes simulation state; React consumes infrequent UI events.
- Ground plane: XZ, Y up; foot anchor is position/collider origin. Use one shared aiming calculation for indicator, weapon, muzzle and projectiles.
- Use fixed-step simulation, bounded catch-up, normalized movement, explicit run states, and cleanup on restart/unmount.
- Keep character, weapon, skill, upgrade and wave definitions in typed data with stable IDs.
- No per-projectile React state updates; reuse transient objects where profiling identifies allocation pressure.
- Use swept collision for fast bullets rather than relying solely on endpoint overlap. Damage must match collision, not visual effects.
- Explicitly bound chain reactions and follow-up attacks. Proc-generated events cannot recursively trigger themselves unless a finite, tested rule allows it.
- Pause on lost focus, clear held inputs, and require deliberate resume. Menu actions cannot fire weapons behind the UI.

## Work discipline

Inspect first. Create a small implementation plan. Deliver a working increment, verify relevant behavior, and update milestone evidence. Keep changes focused; do not rewrite the whole application to add one mechanic. Install compatible stable dependency versions after checking current official documentation; pin through the lockfile. Never invent an installed tool, Blender connection, successful command, deployed URL, asset permission, or completed playtest.

Live Blender MCP supports ordinary scene inspection and modeling; background Blender isolates audits and scripts that reset scenes. Current-session MCP availability is unverified/unavailable; prior connectivity does not establish current connectivity. If Blender MCP is unavailable in the session, continue with procedural geometry and clearly identified placeholders. Do not block movement/combat on polished art. Placeholders are development fallbacks only and never count as finished M5 art. Use existing integration configuration when present; do not change MCP configuration in this task and do not overwrite credentials or unrelated MCP settings. Missing repository MCP configuration does not prove that global/client configuration is absent.

## Assets and design integrity

Official character identities are inspiration; our skill names, evolution recipes, and balancing are proposed adaptations unless separately verified. Six selected dolls are our initial roster, not a claim about a complete official launch roster. Track actual asset source and permission in the manifest. Use placeholders while permission is unresolved; do not download and redistribute official assets based only on the game being free. Never label AI-generated art as official. Placeholder geometry is never finished M5 environment or character art.

## Verification and reporting

Run build and typecheck for implemented milestones and lint once configured. Write focused tests for geometry, damage, upgrade eligibility, state transitions and persistence when those systems exist. Do not add tests that merely repeat constants or implementation details. Playtest camera/aiming and report whether you actually observed it. If browser or Blender testing is unavailable, state the gap and provide a short manual check.

Each report: milestone, files/behavior changed, commands and results, manual verification, remaining issues, next action. Update `docs/MILESTONES.md` with facts; distinguish technical verification from director feedback. Commit focused work if authorized in the session; otherwise give a suggested commit message. Never push or deploy merely because a milestone is done.
