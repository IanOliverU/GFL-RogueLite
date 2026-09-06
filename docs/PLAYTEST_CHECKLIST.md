# Playtest and verification

Only check items actually performed. Record build/commit, device, browser and result in the milestone evidence log. Technical success and director preference are separate.

## M1 controls

- [ ] Movement works in all directions; diagonal speed is equal.
- [ ] Character foot anchor stays on the ground and inside boundaries.
- [ ] Aim indicator points to the actual cursor ground target in every quadrant.
- [ ] Aim remains correct while moving with a stationary mouse.
- [ ] Window resizing and browser scaling do not offset targeting.
- [ ] Near-zero aim does not produce invalid coordinates.
- [ ] Focus loss pauses, clears keys and avoids a jump on resume.
- [ ] UI clicks do not leak into gameplay.

## M2/M3 combat

Expanded M2 director comparison (acceptance pending; automated evidence is logged separately):

- [ ] Select each of six dolls; verify name, weapon summary, placeholder label and selected state.
- [ ] Sabrina: compare broad seven-pellet spread and close-range damage with Vepley.
- [ ] Qiongjiu: watch for three discrete rounds, then a recovery gap; move the cursor within a burst.
- [ ] Tololo: compare sustained rifle cadence against Qiongjiu's controlled bursts.
- [ ] Mosin-Nagant: line up pursuers; check powerful slow shots pierce enemies but stop at the cover block.
- [ ] Peritya: sustain fire away from an in-range enemy; empty the 60-round magazine and observe the longer reload.
- [ ] Vepley: compare faster/lighter volleys and stronger pushback against Sabrina; try pushing toward cover.
- [ ] For every doll, defeat an enemy, stop aiming to take contact damage, die, retry, and check fresh HP/ammo/counters with no old projectiles.
- [ ] Return to selection after death, switch dolls, and check the new weapon starts cleanly.
- [ ] Pause/Alt-Tab during a burst and reload; timers must freeze, input must clear, and resume must require a deliberate action.
- [ ] Aim away from a nearby enemy: shots follow the cursor; move all enemies out of range: firing stops.

- [ ] Shotgun follows cursor direction even when enemies are elsewhere.
- [ ] Range-gated firing follows the documented rule.
- [ ] Fast projectiles hit thin obstacles and enemies reliably.
- [ ] A projectile does not repeatedly damage the same enemy accidentally.
- [ ] Wall blocking matches visible geometry.
- [ ] Damage and visuals agree; dead enemies no longer attack.
- [ ] Dash respects walls, cooldown and the exact invulnerability interval.
- [ ] Ranged attacks have a visible and avoidable warning.
- [ ] Repeated restart does not multiply enemies, damage or listeners.

## M3 evasion and pressure (accepted by Ian; automated evidence logged separately)

Provisional tuning: dash 4 units / 0.20 s, invulnerable only while dashing, 1.20 s cooldown from activation; ranged warning 0.90 s, recovery 2.8 s, shot speed 7 u/s; first pressure spawn 4 s, at most 2 ranged alive, no spawn within 6 units.

- [ ] Space dashes toward held movement; with no keys it dashes toward cursor aim.
- [ ] A pursuer touch or orange shot during the dash deals no damage; the same attack after the dash does.
- [ ] A second Space during the 1.20 s HUD countdown does nothing; READY returns on time.
- [ ] Dashing into the east cover block and into the arena edge stops without crossing.
- [ ] The purple ranged enemy shows a red beam for ~0.9 s before firing; moving after the beam appears avoids the locked shot.
- [ ] Orange hostile shots are visible in flight and stop at cover/walls.
- [ ] Pausing mid-dash or mid-warning freezes both; resume needs a deliberate action with fresh keys and no jump.
- [ ] Retry and doll-switch clear dash state, warnings, orange shots and all M3 counters.

## M3 follow-up: pause options and run timer (accepted by Ian)

- [ ] Pause shows Resume run, Restart run and Change character with a discard-current-run note.
- [ ] Resume continues the run with elapsed time, HP and enemies preserved.
- [ ] Restart keeps the doll, resets TIME to 00:00 and clears all run state.
- [ ] Change character returns to selection; another doll starts clean.
- [ ] TIME (MM:SS) advances during play and freezes on pause, focus loss and game over.

## M4 progression (director results 2026-09-06; acceptance pending)

As implemented: pursuer gems 2 XP, ranged gems 4 XP; need 3 + (level−1) × 2 to level 20; gun ranks 1–5 (+15% damage); Plated Vest / Drum Magazine / Trigger Unit at 3 ranks with 3 gear slots; Sabrina auto-pulse every 6 s; Shockwave Barrage evolution needs Sabrina gun 5 + Vest 3. No elite enemy in M4 (deferred).

- [x] Kills drop one gem each; walking over a gem grants its XP once and fills the bar. (Ian: good)
- [x] Excess XP carries; several queued levels resolve one choice screen after another. (Ian: good)
- [x] Choices are distinct, eligible, and respect rank caps and gear slots; fallback Rations appear when pools run dry. (Ian: upgrades good)
- [x] Gun ranks hit harder, Vests raise max HP, Drums widen the next reload, Triggers quicken fire — on every doll. (Ian: upgrades good)
- [ ] Evolution appears only at gun 5 + Vest 3 (Sabrina), empowers every 4th volley, and shows the EVO tag. (Ian: works, refinement pending clarification — not redesigned yet)
- [x] Alt-Tab during a choice leaves the upgrade screen intact with nothing advanced. (covered by Ian's level-up flow pass)
- [x] Restart, retry and doll-switch reset LV, XP, gems, ranks, gear, evolution and pulse state. (Ian: good)
- [ ] XP bar sits in its own full-width row below the HUD info at desktop and narrow widths. (fix implemented + verified, pending Ian's review)
- [ ] Pause menu, timer, dash, warnings, separation and pressure still behave as accepted.

## M4 follow-up: survival layout, arena and pacing (pending Ian)

- [ ] The game fills the window with no page scroll; no header/footer panels during runs.
- [ ] All four covers read clearly; lanes stay open for retreat in every quadrant.
- [ ] Pressure ramps from a calm opening to dense phase 3+; ranged warnings stay readable (≤2 ranged).
- [ ] Spawns never pop in beside the player; most arrive from off-view.
- [ ] Levels land ~30–45 s apart; evolution reachable in a few minutes without constant interruptions.
- [ ] After picking upgrades, moving the mouse resumes auto-fire.
- [ ] Resize mid-run (including narrow/portrait-ish): no stretched scene, aim stays true, HUD/dialogs usable.

## M4 follow-up: run chrome without header/footer (accepted by Ian; arena/pressure feedback positive)

Ian: larger arena is a good M5 baseline; density and pressure feel good after one minute. Ian tested the header/footer cleanup and it looks good.

- [x] Starting a run hides the header branding and footer instructions with no gaps or dead input areas. (Ian: looks good)
- [x] Pause overlay stays top-right, enabled only during play, clear of the HUD and XP bar. (Ian: looks good)
- [x] Pause dialog carries the move/dash/aim/auto-fire instructions and all existing actions. (Ian: looks good)
- [x] Selection restores the header; dialogs and HUD stay usable narrow. (Ian: looks good)

## M4 follow-up: selection-screen palette (pending Ian's visual review)

Provisional palette: #121316 bg, #1E2024 cards, #3B3E44 borders, #FF7800 accent, #FF952E hover accent, #F4EFE7 text, #B8B5AF secondary text. Reference images only; no official assets added.

- [ ] Charcoal background and neutral cards read clean at desktop and narrow widths.
- [ ] Orange Start button, selected border/tint/label, and header accents look right.
- [ ] Hover, keyboard focus, and selected states are clearly distinct on every doll.
- [ ] Body text is legible warm white/muted gray; doll placeholder colors unchanged.
- [ ] Combat HUD, arena, projectiles, warnings, gems, and dialogs are unaffected.

## M5/M6 presentation and delivery

### M5 bounded-environment blockout (acceptance pending)

- [ ] From the centre, walk north, south, east and west to the perimeter: new terrain/landmarks should reveal over several camera views while the doll stays readable.
- [ ] Inspect the north-west checkpoint (about X -18 / Z -16): Blender GLB low concrete cover blocks movement/projectiles; fence, crates and barrels do not create surprise collision.
- [ ] Dash into checkpoint cover and all four outer boundaries; cursor aim remains aligned while the camera follows and after resize.
- [ ] Stay near the start, a distant edge and each corner long enough for pressure: enemies arrive safely, remain reachable, and do not visibly pop in beside the player.
- [ ] Pause, level up, retry and switch character while away from the start; no old enemies/projectiles/input persist.
- [ ] Review the Blender checkpoint kit at actual camera scale: worn concrete, plated fencing, crate and barrel forms should remain readable without obscuring combat. Real-GPU frame timing remains pending.

M5 checkpoint automated evidence 2026-09-06 (software WebGL, not a substitute for Ian's manual pass): focused production walkthrough `scripts/verify-m5-browser.mjs` reached X -8.1 / Z -12.6, stopped by the eastern barricade collision, verified pause, zero page errors; `test-results/m5-checkpoint-playing.png` inspected (grounded upright kit, hazard details, consistent shadows, doll/pursuer/aim/HUD readable). Full browser suite 21/21 on the final build covers dash-into-cover, warnings/projectiles, pause/level-up/retry/switch, and resize aim. Boxes above stay unchecked pending Ian's in-browser review.

M5 composition evidence (same camera before/after): `m5-checkpoint-before.png` shows the hatched demo scatter; `m5-checkpoint-playing.png` shows the smooth composed entrance (gateposts, apron, supply corner, extended fence, debris). Ian's manual pass should confirm: entrance/perimeter/supply readability, road connection, no striped materials, comfortable fighting/maneuvering, and that decorative fences/posts never read as walkable.

M5 task-2 map tour (software WebGL): walked staging → checkpoint → west works (+W boundary) → storage → south field → SE corner → north boundary at full HP, zero page errors (`m5-area-*.png`). Ian should spot-check: staging openness, storage yard readability from the road, south-field L-corner, west works silhouette, perimeter edges, and confirm far areas stay navigable with readable combat. Boxes stay unchecked pending Ian.

## M5 task-3 Sabrina visual pipeline (pending Ian's art-direction verdict)

Proven for Sabrina only; other five dolls still use planes. Automated evidence (software WebGL): full Sabrina lifecycle browser test passed; `sabrina-aim-north/firing-1/firing-2/dash/hit/fallen/retry/fallback.png` inspected.

- [ ] She reads as Sabrina at game scale: hair silhouette, outfit colors, no gray untextured patches.
- [ ] Body yaw follows the cursor in all quadrants; strafing looks coherent.
- [ ] Firing shows recoil + muzzle flash; tracers still originate along aim.
- [ ] Dash leans; hurt flashes red; death falls flat and stays down; retry stands her back up.
- [ ] Pause/level-up freeze her; doll switch to another doll shows planes, switching back shows her.
- [ ] Hit feedback never obscures enemies, gems, or warnings.
- [ ] Missing-asset fallback (planes) acceptable for clean checkouts.

## M5 camera experiment (pending Ian's verdict; defaults to Angled)

Director feedback: Sabrina's import is satisfactory but doesn't fit the environment yet; movement feels clunky without walking animation. Evaluate the Angled preset against Classic before further art changes. Switch any time in the pause menu (Camera group); the run is preserved. To restore Classic project-wide, set `DEFAULT_CAMERA_PRESET` to `'classic'` in `src/game/data/camera.ts`.

- [ ] Angled framing: Sabrina's silhouette/clothing readable, with room to see enemies and warnings.
- [ ] W moves toward screen-up and D toward screen-right in both presets; diagonals feel equal.
- [ ] Aim stays glued to the cursor while moving and after resize; dash goes where-input-points.
- [ ] Pause-menu switching keeps TIME/HP/enemies; no stray movement or shots after switching.
- [ ] Map edges/corners show no clipping or missing terrain in Angled.
- [ ] Verdict: keep Angled, keep Classic, or request tuning (yaw/elevation/closeness values).

- [ ] At game scale, bullets and warnings stand out from lighting/effects.
- [ ] Sprite edges, feet, facings and muzzle placement look coherent.
- [ ] Audio starts after a user gesture and responds to volume settings.
- [ ] Build/typecheck/lint and meaningful tests pass.
- [ ] Production build is tested, not only development mode.
- [ ] Results and restart work after both death and victory.
- [ ] Corrupt/blocked storage does not prevent play.
- [ ] Quality options are usable; reference device and crowd counts recorded.
- [ ] Actual browser coverage is recorded; untested mobile is not called supported.

## Director feedback template

What I tried:
What I expected:
What happened:
How often:
Screenshot/video if useful:
Priority: blocks play / affects feel / visual polish.

## Suggested focused automated tests

Projection/direction geometry; diagonal normalization; swept collision and pierce bookkeeping; dash damage eligibility; paused timers; level-up eligibility/caps; evolution reward timing; bounded proc events; reset cleanup; save validation/migration. Add tests as each system exists, not empty coverage targets.
