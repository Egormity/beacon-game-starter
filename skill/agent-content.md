# Browser 3D games

Use this skill to build or extend a real playable browser 3D game: player input, a simulated world,
rules, and visible outcomes. It is not intended for an orbit-only product viewer, a rendered video,
or a decorative 3D landing-page scene. Follow the user's genre and mechanics; the reference's
collection game is an example, not a required design.

## Working reference

[Beacon game starter](https://github.com/Egormity/beacon-game-starter) demonstrates two playable
levels, keyboard/touch movement, jumping, collision, objectives, falls, pause/resume, restart,
quality controls, and clean lifecycle ownership. Read `docs/architecture.md`, `docs/extending.md`,
and `docs/research.md` before adapting it. The repository may require access; do not assume an
agent or user can fetch a private repository. No public production preview has been supplied.
A local preview address or authenticated Amazi editor link is not a public game preview.

Its tested stack is TypeScript, Vite, React for interface, Three.js 0.180.0 for presentation, and
Rapier 0.21.0 for physics. Reuse an existing suitable framework and its conventions when extending
a project. Babylon.js and PlayCanvas are valid fuller-engine alternatives; React Three Fiber is
also reasonable in an established project. Do not migrate a working game just to match Beacon.

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

Beacon implements these in `src/engine`, `src/game`, `src/render`, and `src/ui`. Prefer a focused
module or data extension over a speculative ECS, global event framework, or empty directory tree.
Register a new level in `src/game/levels.ts`; the example selector already reads that collection.
Rendering must not decide that an item was collected or a player won.

Level data alone does not replace the example's island art, objective labels, or HUD. For a different
genre, adapt world/character factories and interface copy deliberately. When retaining several
examples, a small presentation variant can separate their art without duplicating shared game rules.

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

Keep the application root's package file, lockfile, Vite configuration, source, public assets, and
Dockerfile together. Amazi permits source path `.` for one root application; for imports, use the
allocated application root and preserve its registration. Do not invent a repository manifest.
Honor runtime `PORT` and `0.0.0.0`; retain Node 22 compatibility, pnpm 11.7.0, and the Docker build
contract. GitHub connection and application registration are separate operations.

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
[Three.js disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html),
[PlayCanvas standalone](https://developer.playcanvas.com/user-manual/engine/standalone/),
[Babylon features](https://www.babylonjs.com/specifications/).
