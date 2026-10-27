# Browser 3D games

Use this skill to build or extend a real playable browser 3D game: player input, a simulated world,
rules, and visible outcomes. It is not intended for an orbit-only product viewer, a rendered video,
or a decorative 3D landing-page scene. Follow the user's genre and mechanics; the reference's
collection game is an example, not a required design.

## Working reference

[Beacon game starter](https://github.com/Egormity/beacon-game-starter) demonstrates two playable
levels, keyboard/touch movement, jumping, collision, objectives, falls, pause/resume, restart,
quality controls, and clean lifecycle ownership. Consult its current architecture, extension and
research guidance before adapting it.
If retrieval fails, use available evidence without claiming to have inspected inaccessible source.
No public production preview has been supplied.
A local preview address or authenticated Amazi editor link is not a public game preview.

Its tested stack is TypeScript, Vite, React for interface, Three.js 0.180.0 for presentation, and
Rapier 0.21.0 for physics. Reuse an existing suitable framework and its conventions when extending
a project. Babylon.js and PlayCanvas are valid fuller-engine alternatives; React Three Fiber is
also reasonable in an established project. Do not migrate a working game just to match Beacon.

Inspect the repository’s current README, application folders and documentation before adapting it. Identify the standalone application boundary from its actual build and runtime files; do not assume an example’s paths or filenames remain unchanged. Repository-level skill metadata is not an application dependency.

## Establish the playable foundation

Identify the player's actions, camera, objective, failure/retry behavior, and target devices.
Resolve missing requirements only when they materially change the game. Build one complete loop
before adding many levels or systems: start, act, receive feedback, reach an outcome, and replay.
Use procedural or appropriately licensed placeholder art while establishing gameplay.

Keep these responsibilities separate, at the scale the game needs:

- Input adapters produce actions such as movement and jump; they do not move meshes directly.
- Simulation owns movement rules, collision consequences, objectives, timers, and phase changes.
- Typed level data describes layout and entities; validate IDs, dimensions, coordinates, and bounds.
- Rendering consumes read-only snapshots and controls camera, meshes, lighting, and animation.
- UI owns menus, HUD, settings, loading/error states, and lifecycle attachment.
- One composition owner creates and disposes the game and schedules its updates.

Locate the example’s engine, rules, rendering and interface owners. Prefer a focused
module or data extension over a speculative ECS, global event framework, or empty directory tree.
Locate the current level-data collection and how the selector consumes it before adding a level.
Rendering must not decide that an item was collected or a player won.

Level data alone does not replace the example's island art, objective labels, or HUD. For a different
genre, adapt world/character factories and interface copy deliberately. When retaining several
examples, a small presentation variant can separate their art without duplicating shared game rules.

## Develop in playable increments

Inspect the existing app and installed versions, then state the smallest playable acceptance case.
Map each requested mechanic to an owner and a test before adding dependencies. Prove a greybox
loop with real controls; add one mechanic through types/data, validation, simulation, snapshot/events,
presentation and UI; then replace placeholder assets and profile the result. Keep source HTML,
TypeScript, CSS and content readable and formatter-checked. Only production output is minified.

Use the same process for racing, shooters, platformers, strategy or physics puzzles; Beacon is not
a complete implementation of those genres. Record what already works and what must be added. For
large worlds, animation blending, AI/pathfinding, vehicles, procedural generation, multiplayer or
editors, choose the relevant subsystem deliberately instead of putting it in a giant update function.
Give new mechanics reset/pause/load semantics and validate them independently before integration.

## Time, movement, and physics

Use one fixed-step simulation owner and a bounded accumulator. Beacon uses 1/60-second steps,
up to six catch-up steps, and render interpolation between previous/current poses. Express movement
in units per second, normalize diagonal input, and make jump input edge-triggered. React state
must not drive every physics transform; publish HUD changes at a useful lower rate and immediately
for important outcomes. Stop simulation when paused or hidden and reset accumulated time on resume.

Await WASM initialization before constructing Rapier objects. Kinematic characters need application
gravity/jump logic and controller-corrected movement; setting a desired body position without
collision resolution can pass through walls. Keep collider and visual dimensions aligned. Rapier
capsules use cylindrical half-height; cuboids use half-extents. Validate tuning on the actual
geometry and installed version rather than copying controller settings blindly.

Make level traversal a real check: valid data alone cannot establish reachability. Include blocked
movement, landings, collection/outcomes, fall recovery, and reset behavior. Treat trigger volumes
separately from solid obstacles. Preserve previous/current pose consistency when teleporting.

## Advanced physics and effects

Select features from the requested behavior; do not add a physics engine to purely decorative art.
Beacon already includes gravity/jumps for a kinematic character and solid collision. The following
are extension paths, not claims that the sample implements every system:

- Choose fixed bodies for immovable level geometry, kinematic bodies for authored motion, and
  dynamic bodies for force/contact-driven objects. Apply forces/impulses to dynamic bodies rather
  than overwriting their pose each frame. Keep units, mass, gravity, friction and restitution
  explicit and tune them against the intended scale. Character gravity is application-owned;
  dynamic-body gravity belongs to the physics world. Do not integrate either twice.
- Separate collision shapes from detailed render meshes. Prefer simple or compound convex shapes
  for moving objects; reserve detailed static meshes for a measured need. Define collision groups
  and query filters, sensors versus solid contacts, and which entity IDs own their consequences.
  Enable required collision events, consume them once in the simulation, and defer unsafe removal
  until the step has finished. Filters must apply to character queries as well as body contacts.
- Use ray/shape casts for line of sight, aiming, ground probes or swept movement. Test fast thin
  projectiles for tunnelling; choose supported CCD or explicit sweeps for relevant bodies. Do not
  assume higher render FPS solves collision misses or that every physics feature is enabled.
- Hinges, ropes, suspension and ragdolls need constrained bodies: validate joint anchors/axes,
  limits, motors, mass ratios and reset/disposal behavior. Prototype one mechanism before scaling
  it up. A rigid-body engine does not automatically supply fluids, cloth, deformable materials or
  engineering-grade accuracy; identify a separate solver or visual approximation when needed.
- Treat smoke, sparks, trails and debris as presentation unless they affect gameplay. Feed an
  effects owner stable event IDs so an interpolated/replayed snapshot cannot emit a burst again.
  Use a bounded particle pool with lifetime and maximum count, batched points/instances, and
  explicit texture/material ownership. Avoid one rigid body, light or React component per spark.
  Gameplay projectiles keep authoritative collision even if their visual trail is reduced.
- Keep camera shake, screen-space shaders, fog, shadows and post-processing separate from rules.
  Cap pixel ratio, transparent overdraw, shadow resolution and effect density by measured device
  budget. Pause/reset effects with the session, remove them on level replacement, and retain clear
  feedback in reduced-motion/low-quality modes. Profile CPU simulation and GPU rendering separately.

Test collision filtering, enter/exit/one-shot triggers, resting contacts, gravity/jump behavior,
fast motion, constraint stability, seeded effects where reproducibility matters, bounded particle
counts, and disposal after repeated restarts for the systems actually implemented. Keep previous
and current poses for interpolated bodies, including rotation; do not confuse visual interpolation
with collision state. Inspect the reference's current advanced-systems guidance for extension seams.

## Browser and asset lifetime

Handle keyboard focus, touch capture/cancellation, and blur without stuck input. Preserve normal
button and editable-field keyboard behavior. Keep pause/restart available through real controls.
Respect reduced motion for camera and decorative effects while retaining necessary game feedback.
Cap rendering resolution and provide a lighter graphics option when appropriate.

Cancel startup ownership when a level unmounts; late physics/model results must not attach to the
new game. Stop the frame loop, remove listeners/observers, release GPU resources, and free physics
worlds on disposal. Shared assets require explicit ownership. Show usable loading/failure states
for WASM, models, unsupported WebGL, and context loss; retry should recreate the required owners.

Check model, texture, font, and audio licenses and record source/attribution. Keep local assets or
controlled delivery paths; avoid unexplained hotlinks. Beacon has no external art dependencies,
but its embedded-WASM compatibility chunk is approximately 4.3 MB before compression. Measure
startup/download cost when expanding it. Add audio only after a user gesture and own its cleanup.

## Amazi and verification

Keep each application in a standalone folder inside the project repository, with its own package
files, lockfile, configuration, source, assets, tests and Dockerfile. Inspect the reference's current
structure to find that folder. For supplied source, create an empty application and copy only the
application folder's contents into the returned source path. Preserve that allocated path; never
copy the whole example repository or nest another application folder inside it. If a specific folder
name is required, configure the empty application before copying source, and only when the target
path is absent. Use the application build context when every Docker input is application-local.
Commands run inside the registered source path. Honor injected `PORT`, `0.0.0.0`, Node 22
compatibility, the pinned package manager and the Docker contract. GitHub synchronization does not
register applications; do not invent a repository app manifest.
Load Amazi's current application-configuration guidance before importing; use `empty_application`
for supplied source, preserve the allocated path, and keep deployment flags and Vite adapters in
the application catalog. Do not copy generated `dist` as editable source. See
[Amazi applications](https://docs.amazi.pro/en/applications) and
[publishing](https://docs.amazi.pro/en/publishing-and-domains).

Test rules and fixed-step invariants independently of UI, then exercise real controls and complete
the example loop through the project's authorized browser-testing workflow. Verify pause/resume,
restart, level changes, touch cancellation, and startup/disposal failures. Build and inspect runtime
delivery, including WASM. A canvas element alone is not rendering or gameplay evidence.

Local saves and scores are player-controlled. If the user requests trusted leaderboards,
multiplayer, purchases, or shared progress, design server authority and validation explicitly;
do not treat client physics or local storage as authoritative. Report what was tested and what
remains device- or deployment-dependent.

Primary references: [Three.js games](https://threejs.org/manual/pages/game.html),
[Rapier controllers](https://rapier.rs/docs/user_guides/javascript/character_controller_setup/),
[Rapier initialization](https://rapier.rs/docs/user_guides/javascript/getting_started_js/),
[rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/),
[colliders](https://rapier.rs/docs/user_guides/javascript/colliders/),
[scene queries](https://rapier.rs/docs/user_guides/javascript/scene_queries/),
[joints](https://rapier.rs/docs/user_guides/javascript/joints/),
[Three.js disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html),
[PlayCanvas standalone](https://developer.playcanvas.com/user-manual/engine/standalone/),
[Babylon features](https://www.babylonjs.com/specifications/).
