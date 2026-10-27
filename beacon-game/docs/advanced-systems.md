# Advanced mechanics and effects

Paths in this guide are relative to the application root (`web/` in the repository).

Beacon provides a kinematic player, gravity/jumps, static solid collision and two complete routes.
It does not already include dynamic crates, joints, particles, weapons or multiplayer. Use this
guide to locate those extensions without losing the ownership in [architecture](architecture.md).

## Choose a vertical slice

For a physics puzzle, a useful first slice is one movable crate, one pressure plate and one door.
Define success/reset behavior and test it with placeholder shapes before building a level editor,
complex art or an inventory. Other genres should choose their own smallest meaningful loop.

| Change               | Owner and integration seam                                                                                           | Verify before scaling                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Dynamic crate        | Typed definition/validation in `src/game`; body/collider ownership in `physics.ts`; poses in the simulation snapshot | Gravity, resting contact, pushing, reset and body removal                |
| Pressure plate       | Sensor/query filtering and activation rule in simulation                                                             | Which bodies count, enter/exit, one-shot versus sustained activation     |
| Moving door/platform | Authored kinematic motion, driven by the existing fixed step                                                         | Closed/open collision, player support, reset and blocked motion          |
| Hinged gate          | Joint configuration owned with its bodies                                                                            | Anchor/axis, limits, motor behavior, stable mass ratios and teardown     |
| Projectile           | Rule-owned identity/lifetime plus hit query or body                                                                  | Thin walls, fast motion, owner exclusion and exactly one hit consequence |
| Impact dust          | Presentation event consumed by an effects module                                                                     | One burst per event, particle cap, pause/reset and low-motion feedback   |

`physics.move()` currently performs the player movement and the world's single step. When adding
independent bodies, deliberately separate preparation, one world step and snapshot extraction in
that owner. Do not add a second `world.step()` in a crate or effects system. Preserve controller
movement before stepping and read resolved poses afterward. Sample all bodies needed for rendering,
keeping previous/current transforms for interpolation and teleport/reset consistency.

The character's gravity is explicitly integrated in `simulation.ts`; Rapier's world gravity affects
dynamic bodies. Reusing the character's vertical-velocity calculation on a dynamic crate would
apply gravity twice. Keep forces and impulses in simulation units and render meshes as consumers.
Changing a mesh scale does not update its collision shape.

## Contacts, queries and constrained motion

Use a stable application entity ID to map colliders to rules. Configure collision and query masks
intentionally; a sensor must not become a character-controller obstacle. Collision events require
the relevant active-event configuration. Collect consequences during/after the step, then remove
or pool entities safely. Clear subscriptions, event queues and entity mappings on replacement.

Ray casts can serve aiming and visibility; shape casts are appropriate when the swept object has
volume. Filter out the querying body and unrelated sensors. Use measured CCD or sweeps for fast,
small bodies, and test the installed solver against actual target geometry. Do not use a visual
trail as a hit detector. For a jointed object, validate anchors in the correct local coordinate
spaces, limits and restoration order, including removing constraints when a connected body ends.

Use primitive or compound convex collision geometry for most moving props. Model meshes and
physics shapes have separate purposes. Cars, ropes, ragdolls, terrain, cloth or fluids each require
an intentional mechanics/solver decision; this sample's simple controller is not a universal model.

## Effects without duplicate gameplay

Add a renderer-owned module such as `src/render/effects.ts` only when the first effect needs it.
For a collection burst, emit an event from the successful collection transition with a session ID
and sequence number. Consume it once even when the same state is rendered repeatedly or the HUD
publishes again. An alternative for this small game is comparing previous/current collected IDs,
with explicit reset on level/restart; do not infer hits from mesh intersection.

Use bounded lifetimes and a fixed maximum pool size. Reuse geometry/materials, batch compatible
particles using points or instances, and release owned GPU resources through `RenderResources`.
Choose whether an effect ages in simulation time or visual time and make pause behavior deliberate.
Large transparent quads can become an overdraw bottleneck even with few draw calls. Profile effects,
shadows, resolution and post-processing independently; cap them without changing collision or score.

If effects remain visible after a win, the engine's current idle rendering will stop their updates.
Choose either an immediate static completion state or a bounded presentation-only completion phase
owned by the existing loop. Do not quietly add a permanently running second RAF.

## Development and evidence

1. Specify a reproducible action/outcome and the expected failure/reset paths.
2. Extend data, validation, a focused rule/physics module, snapshots/events and presentation together.
3. Add tests for the actual new consequence, including repetition and removal; preserve existing
   complete-route tests. Physics assertions need sensible tolerances, not exact floating values.
4. Exercise controls in a browser at ordinary and slow frame rates. Inspect debug colliders when
   geometry is involved; verify resize, blur, pause, restart and level replacement.
5. Measure startup/download, CPU step cost, GPU frame cost, active bodies/particles and repeated
   restart memory. Seed random content where reproducing a bug matters. A fixed timestep alone
   does not promise cross-device deterministic networking.
6. Keep a readable source tree and documented configuration; run `format:check`, tests and the
   production build. Verify Amazi's allocated application path, injected port and Docker delivery.

Official references: [Rapier bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/),
[colliders](https://rapier.rs/docs/user_guides/javascript/colliders/),
[queries](https://rapier.rs/docs/user_guides/javascript/scene_queries/),
[joints](https://rapier.rs/docs/user_guides/javascript/joints/),
[Three.js instancing](https://threejs.org/docs/pages/InstancedMesh.html).
