# Extending the game

Start by running the unchanged example, then make one playable change. Keep the user's requested
genre and interaction model; the collect-and-return loop demonstrates the foundation without
requiring future games to use the same mechanic.

A new level entry keeps the reference's island scene factory and energy-cell/beacon wording. For a
different genre, also inspect `src/render/world.ts`, `player.ts`, and the interface copy. When keeping
the islands alongside another setting, use a small presentation variant to select appropriate art
and labels without duplicating simulation ownership or adding genre-specific rendering to physics.

## Add a level through data

Add a `LevelDefinition` entry to the exported `levels` array in `src/game/levels.ts`. The UI builds
its selector from that array, so no new route or menu component is required. Give the level a stable
ID and all of its solids/pickups unique IDs. The first array entry is the initial selection.

This small entry demonstrates a floor, a raised platform, a collectible, and a goal:

```ts
{
  id: 'garden-relay',
  name: 'Garden relay',
  description: 'Climb the garden step and bring its energy cell to the beacon.',
  spawn: { x: 0, y: 0.75, z: 4 },
  goal: { position: { x: 0, y: 0, z: -4 }, radius: 1.35 },
  fallY: -8,
  solids: [
    {
      id: 'garden-floor', kind: 'ground',
      position: { x: 0, y: -0.5, z: 0 }, size: { x: 12, y: 1, z: 12 },
    },
    {
      id: 'garden-step', kind: 'platform',
      position: { x: 2, y: 0.4, z: -1 }, size: { x: 3, y: 0.8, z: 3 },
    },
  ],
  pickups: [{ id: 'garden-cell', position: { x: 2, y: 1.7, z: -1 } }],
}
```

Solid positions are centers; their sizes are full dimensions. A goal's Y coordinate is its floor
height. Spawn and pickup positions use world coordinates, with the player's spawn located at its
capsule center. Keep `fallY` below the geometry. `validateLevel.ts` checks structural validity;
test the actual route before describing a level as completable.

Use `levels.test.ts` and `simulation.test.ts` as examples for validating new content and traversing
it with real physics. Test grounded movement, blocked paths, jumping, collection, completion,
falling, and restart according to what the new layout changes. For control/rendering changes,
also run the browser suite and follow the project's browser-verification authorization.

## Change the player model without changing the rules

`src/render/player.ts` currently creates procedural geometry. Replace that presentation with a
licensed glTF/GLB model while keeping the simulation's capsule and `GameSnapshot` contract.
Normalize the model's scale, origin, and facing direction once. Rapier's capsule takes a cylindrical
half-height and radius; its total height is `2 * halfHeight + 2 * radius`. Three's capsule geometry
uses the full cylindrical length. A visually wider model does not automatically widen its collider.

Add asynchronous asset loading to engine startup before constructing the renderer; the current
renderer factory is synchronous. Keep ownership explicit, show loading/failure status, and discard
and dispose a late model result if its level was cancelled. Do not leave the old physics world
alive when loading fails. If the loader cannot cancel its request, cancellation must still prevent
the completed model from attaching to a disposed scene.

Drive animation from snapshots, such as grounded state and movement, and update an AnimationMixer
from the renderer's delta. Stop actions and release mixer references when removing the model.
Register the model's geometry, materials, and textures with a clear owner; reused resources should
not be disposed while another instance needs them. Keep model sources and license terms beside
the asset. The [official glTF loading guide](https://threejs.org/manual/pages/load-gltf.html) and
[disposal guide](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) cover the library APIs.

## Add a checkpoint or hazard

Extend the level type with the smallest useful data shape, such as checkpoint positions/radii or
hazard volumes. Extend `validateLevel.ts` with the new geometry/identity rules. Put activation and
consequences in a focused game module called by `simulation.step()`.

For a checkpoint, store the active respawn position in simulation state; decide whether restarting
clears it. For a hazard, decide whether the effect is damage, a fall, a reset, or another requested
rule. Add the resulting state to the snapshot only when presentation or UI needs it. The renderer
may show a flag or hazard effect, but visual overlap must not decide the game outcome.

Use Rapier sensors or queries when actual collider intersection matters. Configure sensor filtering
so a trigger does not become a wall for the character. Test leaving/re-entering, one-time activation,
and reset behavior. Avoid adding a generic event bus, inventory, networking layer, or ECS solely for
one new mechanic.

## Tune movement and collision together

Start with `src/game/config.ts`. Speeds are units per second; gravity and jump velocity are applied
using the fixed simulation timestep. Keep diagonal input normalized. Re-test platform traversal
after changing capsule dimensions, jump speed, gravity, autostep, or contact settings.

Position-based kinematic bodies need corrected character-controller movement; writing arbitrary
body positions each frame bypasses obstacle resolution. Use explicit teleporting only for actions
such as respawn. Match visible floors and collision extents, and reserve space for the whole capsule.

This example does not enable optional snap-to-ground: its flat-box traversal tests exposed unwanted
penetration with that setting during development. Treat controller settings as geometry/version
dependent and validate them on the target levels; this is not a general claim that snapping is broken.

## Add sound, persistence, or a server when requested

Create/resume audio only after a user gesture. Let simulation outcomes produce plain event data;
an audio adapter can respond without importing browser audio APIs into game rules. Mute, pause,
context cleanup, and asset licensing belong with that adapter.

The existing personal best is local browser storage. If progress must persist, define a versioned
save format with validation and migration rules appropriate to the product. If scores, purchases,
or multiplayer state must be trusted, put their authority on a server; client snapshots and timers
are player-controlled. Do not bolt multiplayer onto the render loop or promise synchronization
from a fixed timestep alone.

## Preserve the runtime boundary

Keep `package.json`, the lockfile, Vite configuration, `src/`, `public/`, and Dockerfile together as
one application. Amazi can register that application at source path `.` or copy it into an allocated
application directory. Its metadata does not belong in an invented repository manifest. Keep
Node 22 compatibility, pnpm 11.7.0, `0.0.0.0`, and runtime `PORT` support intact.

## Advanced systems

Use [Advanced mechanics and effects](advanced-systems.md) for gravity, collision filtering,
constraints, fast motion, particles, renderer capabilities and a staged development workflow.
The reference is a playable starting point; those extension paths are not all implemented features.
