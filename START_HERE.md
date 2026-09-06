# Starting development locally

> M0/M1 implementation update (2026-09-06): this project is now runnable. Use the actual commands in [README.md](README.md). The original pack setup and kickoff below are retained as handoff history, not the current implementation status. M1 awaits Ian's review; do not rerun scaffolding or begin M2 automatically.

> Location corrected (2026-09-06): open `C:\Users\MY PC\Desktop\GFL Game` directly in VS Code. From that root, run `npm ci` if dependencies are missing, then `npm run dev`. The existing M0/M1 application was relocated without rebuilding its implementation.

## Original pack setup (historical)

The original ZIP contained a documentation-only starter directory. Its contents are now integrated into `C:\Users\MY PC\Desktop\GFL Game`, alongside the implemented source, tests, package.json and lockfile. Do not extract or scaffold the pack again in this workspace.

Use Git to preserve working milestones. If the directory already contains files, ask Codex to inspect and integrate; do not use a scaffolding command that overwrites them. Blender and its MCP connection are optional for the first milestone. The first arena can be made from simple geometry in code.

## Paste this into Codex

```text
You are implementing this project in the currently open workspace. I am the director/producer. Read AGENTS.md, README.md, docs/GAME_DESIGN.md, docs/TECHNICAL_PLAN.md, docs/MILESTONES.md and docs/DECISIONS.md.

Inspect the directory and any Git state before editing. Preserve existing files. Complete M0, then implement M1 only. Use Vite, React, TypeScript, React Three Fiber and Three.js with compatible versions verified against official documentation. Keep these Markdown files in place. Use placeholder geometry and a simple character plane; do not wait for Blender or official sprites.

Deliver a running browser playground with a fixed elevated orthographic camera, a bounded flat arena, a foot-anchored placeholder character, normalized WASD movement, cursor-to-ground aiming, a visible aim indicator, and input/focus/pause handling. Keep simulation separate from React UI and render state. The cursor must stay accurate during movement, camera follow, and window resizing. M1 has no weapon damage, XP, enemy AI, or full character roster.

Add and run dev/build/typecheck/lint scripts as appropriate. Verify movement and aiming in a browser if available; otherwise record the manual verification gap honestly. Add focused tests for aiming math if useful. Update the milestone log with actual evidence and record dependency versions and startup commands in README. Do not claim director acceptance or deploy/push automatically. Finish with local startup instructions and a concise M1 playtest checklist.
```

## Your first review

Open the local URL printed by the dev server. Move diagonally, walk around the boundary, aim across all sides of the doll, resize the window, switch tabs and resume. Report specific symptoms: e.g. “crosshair shifts to the left after resizing” or “moving diagonally feels faster.”

After M1 works, authorize M2. The next task is one pursuing enemy and Sabrina's shotgun, damage, death, and reliable restart. Art production can proceed after the shared movement/aiming foundation is stable.
