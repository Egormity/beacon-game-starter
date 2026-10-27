# Research and implementation choices

Reviewed 2026-10-27. This project pins Three.js 0.180.0 and Rapier compatibility package 0.21.0.
The decision is specific to a small, inspectable starter whose gameplay can be replaced.

## Foundation choice

| Option            | Strength for this task                                                                          | Tradeoff                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Three.js + Rapier | Rendering and physics can have explicit, separate owners; fits a TypeScript/Vite repository     | Input, session rules, asset ownership, and lifecycle must be implemented  |
| Babylon.js        | Broad engine facilities including scenes, animation, audio, collisions, and physics integration | More engine-specific conventions; use its ES module packages consistently |
| PlayCanvas        | Entity/component engine with standalone Vite/TypeScript tooling and optional editor workflow    | Adopt its application/component lifecycle and register required systems   |

Three.js documents that it is a rendering library rather than a complete game engine. Beacon fills
the required game boundaries with small modules instead of creating a general framework. This is
our design choice, not a claim that Three.js is universally preferable. An existing Babylon,
PlayCanvas, or React Three Fiber application should usually retain its working foundation.

Primary references: [Three.js game guide](https://threejs.org/manual/pages/game.html),
[Babylon engine features](https://www.babylonjs.com/specifications/),
[Babylon package support](https://doc.babylonjs.com/setup/frameworkPackages/npmSupport/),
[PlayCanvas standalone engine](https://developer.playcanvas.com/user-manual/engine/standalone/),
[PlayCanvas starter options](https://developer.playcanvas.com/user-manual/getting-started/start-with-create-playcanvas/).

## Physics and time

Rapier's compatibility package embeds WASM for straightforward bundler setup. The browser must
finish its asynchronous initialization before a world is created. A kinematic character controller
computes an obstacle-corrected translation; game rules still own gravity, jumping, and outcomes.
Beacon steps the world at 60 Hz and interpolates the render pose. The bounded accumulator and
pause behavior are application decisions, not services supplied by React.

Sources: [Rapier initialization](https://rapier.rs/docs/user_guides/javascript/getting_started_js/),
[controller setup](https://rapier.rs/docs/user_guides/javascript/character_controller_setup/),
[rigid-body behavior](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/),
[integration parameters](https://rapier.rs/docs/user_guides/javascript/integration_parameters/),
[World API](https://rapier.rs/javascript3d/classes/World.html).

The [official Three.js Rapier controller example](https://threejs.org/examples/physics_rapier_character_controller.html)
and its [source](https://github.com/mrdoob/three.js/blob/dev/examples/physics_rapier_character_controller.html)
were useful API references. Beacon has its own simulation, lifecycle, controls, world data, and
procedural art. It is not a wholesale copy of that demonstration.

The compatibility bundle is a deliberate initial-download tradeoff: the tested production build's
Rapier chunk is approximately 4.3 MB uncompressed and 1.64 MB gzip. Those are build observations,
not guaranteed network transfer sizes or a performance score. No external models, textures, or
audio are downloaded. If a future product needs a smaller first load, measure a separately loaded
WASM build or deferred game entry, and retain loading, failure, caching, and cancellation behavior.

Fixed stepping alone does not make an entire multiplayer game deterministic. Rapier's guarantees
require matching versions, initial values, and construction order; application inputs and rules
also need a synchronization design. [Rapier determinism](https://rapier.rs/docs/user_guides/javascript/determinism/)

## Browser lifecycle and resource ownership

Three.js objects can retain GPU resources after removal from a scene. Beacon tracks owned resources
and disposes them alongside the renderer; physics releases its WASM world. The engine owns a single
RAF scheduler because it also owns the fixed-step accumulator. Adding XR would require reviewing
that scheduler against Three's recommended `setAnimationLoop` integration, rather than starting a
second loop. [Three disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html),
[renderer API](https://threejs.org/docs/pages/WebGLRenderer)

Browsers may suspend animation callbacks in hidden tabs. Beacon pauses on visibility loss and
resets timing on resume. Its touch adapter uses pointer capture and clears movement on cancellation.
Context loss produces a recoverable error path instead of continuing invisible gameplay.
[Page visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API),
[pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events),
[Khronos context-loss guidance](https://wikis.khronos.org/webgl/HandlingContextLost)

The current renderer requires WebGL 2. Light graphics lowers pixel density and disables shadows;
less-motion settings reduce decorative movement while preserving gameplay controls. Performance
still depends on the device, viewport, and browser. A compiling bundle or an existing canvas node
does not prove the game is visible, playable, or smooth.

See [Architecture](architecture.md) for actual ownership and [Extending](extending.md) for the
supported starting points. New dependencies and art should be evaluated for the requested game,
with their license, version, delivery cost, and cleanup requirements recorded.
