# Game design baseline

## Product and pillars

An independent GFL-inspired, single-player browser survivor roguelite. Target keyboard/mouse on desktop first. High-quality 2D-in-3D visual direction, readable combat, independent movement/aiming, signature guns, and meaningful upgrades. No promise of matching the production scale of Octopath Traveler.

## Controls and targeting

| Input | Default |
| --- | --- |
| WASD | Move on the ground plane; normalize diagonal input |
| Mouse | Aim at the cursor's projected ground position |
| Automatic | Fire toward cursor when a live enemy is within weapon range |
| Space | Dash along held movement direction, otherwise aim direction |
| Q | Manual ultimate when charged, introduced after the core prototype |
| Escape | Pause/resume through the pause interface |

Auto-fire never redirects a shot to an enemy. Range activation is a convenience gate, not aim assistance; shots can miss, hit cover, or fire away from a nearby enemy. If this feels surprising in playtesting, compare continuous automatic firing as a documented tuning change. A hold-to-fire setting is deferred. Browser focus loss pauses and clears input; no background damage or catch-up bursts on resume.

Use one fixed elevated orthographic camera. Initial gameplay has no elevation, jumping, stairs, or free camera rotation. Foreground decoration must not hide hazards. Dash timing, cooldown, and a short invulnerability window are tunable prototype values. The visual trail must match its actual invulnerability interval; dash cannot cross solid walls.

## Run structure

Menu -> choose available doll -> arena -> fight and collect XP -> pause for upgrade choice -> continue -> final encounter -> victory/death -> results -> restart/menu.

Prototype duration: three to five minutes. Later first-release target: approximately ten minutes after pacing is validated. These are different stages of scope. The first release remains arena-based. Connected Gungeon-style rooms are an expansion option, not an approved replacement for the arena loop.

## Progression

Level-ups offer three eligible choices: gun rank, doll skill upgrade, or equipment rank. One signature gun, up to three doll skills and four equipment slots in the eventual kit. Initial prototype implements one automatic skill only. In-run weapon/equipment/skill ranks reset on a new run. Settings and earned unlocks persist. Do not grant permanent combat power in the initial prototype.

When no ranked upgrade is eligible, offer a defined fallback such as healing (only below max health) or score currency. Cap rank values and prevent duplicate incompatible choices. Queue multiple level-ups without advancing simulation while the upgrade menu is open.

## Selected roster and proposed adaptations

### Approved M2 basic-weapon baseline (2026-09-06)

Ian authorized all six playable dolls and a selection screen in M2, superseding the Sabrina-only first combat implementation. The screen shows name, basic weapon description, selected state and clearly labeled placeholder art. Game over offers retry with the same doll or return to selection. These are prototype fan-game adaptations, not verified official kits. All dolls currently have 100 HP and identical M1 movement; differences come from their weapons.

| Doll | Basic weapon | Damage per projectile × pellets | Range | Discharge timing | Magazine / reload | Hits per projectile | Knockback speed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sabrina | Broad close-range shotgun | 12 × 7; 50° spread | 6 | 0.80 s | 6 / 1.80 s | 1 | 2 |
| Qiongjiu | Controlled burst rifle | 16 × 1 | 11 | 3 rounds, 0.10 s apart; 0.55 s after last round | 18 / 1.60 s | 1 | 1 |
| Tololo | Fast sustained rifle | 11 × 1 | 10 | 0.13 s | 24 / 1.50 s | 1 | 0.8 |
| Mosin-Nagant | Powerful piercing sniper | 70 × 1 | 22 | 1.20 s | 5 / 2.20 s | Up to 3 distinct enemies | 3 |
| Peritya | Sustained machine gun | 9 × 1 | 12 | 0.09 s | 60 / 3.20 s | 1 | 0.7 |
| Vepley | Faster light shotgun | 7 × 5; 36° spread | 6.5 | 0.42 s | 8 / 1.60 s | 1 | 12 |

Units are gameplay units and seconds; all values are provisional. A shotgun volley consumes one shell, a rifle burst one round per shot. Empty magazines reload automatically; reload continues during active play even without an enemy/aim input and freezes on pause. No manual reload key in M2. A burst is cancelled when the firing gate closes; it cannot accumulate shots for later. Every shot samples current cursor-floor aim after movement/camera updates. There is no spread randomness: pellets are evenly distributed across the cone for reproducibility.

The established firing rule remains: a live enemy within the weapon's range enables automatic firing along cursor aim, with no target snapping and no line-of-sight requirement for activation. Cover still stops the resulting projectiles, including sniper rounds. The cursor must have entered/moved over the canvas; leaving it or opening UI clears aim input. Near-zero targets retain the last valid direction.

One pursuer type has 40 HP, speed 1.8, radius 0.45 and 10 contact damage with a shared player hurt interval of 0.7 seconds. One enemy starts four units ahead; another is attempted every two seconds at predefined perimeter points at least four units from the player, up to eight alive. This is a bounded combat test encounter, not the M3/M4 wave/progression system. One solid cover block affects movement, pursuit and projectile collision. Knockback refreshes a directional velocity and decays exponentially (10/s); pellet impulses do not sum. Projectiles use swept hits, stop at cover/perimeter/range, and track already-hit enemy IDs. No XP, skills, ultimates, evolutions, dash, ranged enemies or polished animations in this scope.

### Later full-kit proposals (not M2)

These six are our selected roster, not a verified complete official release roster. Aliases and canonical skill details must be checked before publishing descriptions. All mechanics below are design proposals.

| Doll | Primary role | Automatic skill | Conditional skill | Ultimate concept | Evolution concept |
| --- | --- | --- | --- | --- | --- |
| Sabrina | Close shotgun / survival | Knockback pulse | Nearby defeats build temporary shield | Advancing barrage | Empowered blasts create shockwaves |
| Qiongjiu | Rifle / marked targets | Mark priority target | Skill damage enables bounded follow-up | Concentrated marked-target fire | Additional shots toward marked targets |
| Tololo | Rifle / tempo | Empowered burst | Charge grants bonus volley | Duplicated volleys during overdrive | Delayed echo volleys |
| Mosin-Nagant | Sniper / piercing | Charged priority shot | Weakening enables follow-up | Piercing branching shot | Arcs between marked enemies |
| Peritya | Machine gun / area pressure | Area bombardment | Multi-hit triggers suppression | Rotating barrage | Periodic suppression zones |
| Vepley | Mobile shotgun / displacement | Explosive group attack | Movement charges knockback | Wide bombardment | Secondary displacement explosions |

Each eventual doll also has an innate trait. Avoid support triggers that require an allied doll when none exists in solo play. Ultimate charge and proc generation must have explicit, bounded rules.

## Later Sabrina progression proposal

Shotgun cone aimed at cursor; one volley uses multiple short-lived projectiles. Proposed ranks: 1 base cone, 2 damage, 3 pellet count, 4 one-enemy piercing, 5 fire interval, 6 range, 7 periodic empowered volley. Values are tunable, not established balance. Automatic knockback pulse is the first skill.

Proposed evolution recipe: shotgun rank 7 + compatible reactive-armor equipment rank 3 + eligible elite reward. Evolution preserves the gun identity and adds shockwaves to empowered volleys. Recipe is visible in UI. Eligibility is checked when claiming a reward; earlier rewards cannot retroactively become evolutions unless deliberately redesigned. The wave/XP schedule must permit a tester to reach the recipe within the prototype run; provide a development-only shortcut to test it separately. Elite evolution opportunities must exist after upgrades can reasonably be completed.

## Enemies and scope

Prototype: a pursuer and a ranged attacker with a telegraph. Final elite can reuse an existing enemy with one distinct, readable attack pattern. Later add runner, tank, bosses, and more patterns. Keep counts modest while combining manual aim with enemy bullets.

Excluded initially: multiplayer, accounts, gacha, monetization, cloud saves, leaderboards, procedural terrain, connected rooms, free rotation, full six-doll kits, and mobile controls. Preserve extension points without implementing speculative systems.
