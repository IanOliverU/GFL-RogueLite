# Instructions for coding agents

## Mission and scope

Build the browser game described in `docs/GAME_DESIGN.md`. Read this file, README, technical plan, decisions, and current milestone before editing. Ian is director/producer. His current instructions override these project defaults. Preserve unrelated files and inspect any existing repository before scaffolding.

## First task

Complete M0 and M1 using `START_HERE.md`. Do not implement the full roster or later systems during the initial task. Routine implementation decisions within the active scope do not require repeated permission. When the authorized task is complete, report the playable result and the next milestone. Do not silently expand scope.

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

If Blender MCP is unavailable, continue with procedural geometry and clearly identified placeholders. Do not block movement/combat on polished art. Use existing integration configuration when present; do not overwrite credentials or unrelated MCP settings.

## Assets and design integrity

Official character identities are inspiration; our skill names, evolution recipes, and balancing are proposed adaptations unless separately verified. Six selected dolls are our initial roster, not a claim about a complete official launch roster. Track actual asset source and permission in the manifest. Use placeholders while permission is unresolved; do not download and redistribute official assets based only on the game being free. Never label AI-generated art as official.

## Verification and reporting

Run build and typecheck for implemented milestones and lint once configured. Write focused tests for geometry, damage, upgrade eligibility, state transitions and persistence when those systems exist. Do not add tests that merely repeat constants or implementation details. Playtest camera/aiming and report whether you actually observed it. If browser or Blender testing is unavailable, state the gap and provide a short manual check.

Each report: milestone, files/behavior changed, commands and results, manual verification, remaining issues, next action. Update `docs/MILESTONES.md` with facts; distinguish technical verification from director feedback. Commit focused work if authorized in the session; otherwise give a suggested commit message. Never push or deploy merely because a milestone is done.
