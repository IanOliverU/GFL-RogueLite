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

- [ ] Shotgun follows cursor direction even when enemies are elsewhere.
- [ ] Range-gated firing follows the documented rule.
- [ ] Fast projectiles hit thin obstacles and enemies reliably.
- [ ] A projectile does not repeatedly damage the same enemy accidentally.
- [ ] Wall blocking matches visible geometry.
- [ ] Damage and visuals agree; dead enemies no longer attack.
- [ ] Dash respects walls, cooldown and the exact invulnerability interval.
- [ ] Ranged attacks have a visible and avoidable warning.
- [ ] Repeated restart does not multiply enemies, damage or listeners.

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
