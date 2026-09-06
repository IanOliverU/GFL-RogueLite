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

## M3 evasion and pressure (manual, pending Ian)

Provisional tuning under test: dash 4 units / 0.20 s, invulnerable only while dashing, 1.20 s cooldown from activation; ranged warning 0.90 s, recovery 2.8 s, shot speed 7 u/s; first pressure spawn 4 s, at most 2 ranged alive, no spawn within 6 units.

- [ ] Space dashes toward held movement; with no keys it dashes toward cursor aim.
- [ ] A pursuer touch or orange shot during the dash deals no damage; the same attack after the dash does.
- [ ] A second Space during the 1.20 s HUD countdown does nothing; READY returns on time.
- [ ] Dashing into the east cover block and into the arena edge stops without crossing.
- [ ] The purple ranged enemy shows a red beam for ~0.9 s before firing; moving after the beam appears avoids the locked shot.
- [ ] Orange hostile shots are visible in flight and stop at cover/walls.
- [ ] Pausing mid-dash or mid-warning freezes both; resume needs a deliberate action with fresh keys and no jump.
- [ ] Retry and doll-switch clear dash state, warnings, orange shots and all M3 counters.

## M3 follow-up: pause options and run timer (pending Ian)

- [ ] Pause shows Resume run, Restart run and Change character with a discard-current-run note.
- [ ] Resume continues the run with elapsed time, HP and enemies preserved.
- [ ] Restart keeps the doll, resets TIME to 00:00 and clears all run state.
- [ ] Change character returns to selection; another doll starts clean.
- [ ] TIME (MM:SS) advances during play and freezes on pause, focus loss and game over.

## M4 progression

- [ ] XP grants one intended amount; pickups are not collected twice.
- [ ] Multiple level-ups are queued while combat remains paused.
- [ ] Offered upgrades are eligible and respect slot/rank caps.
- [ ] The no-eligible-upgrade fallback works.
- [ ] Evolution requires the stated ranks and reward opportunity.
- [ ] Evolution is achievable in normal tuned play, not only via debug tools.
- [ ] Follow-up attacks cannot trigger an unlimited chain.
- [ ] A new run clears in-run upgrades.

## M5/M6 presentation and delivery

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
