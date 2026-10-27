# Beacon — browser 3D game starter

A reusable TypeScript foundation with a small playable game. Explore two islands, collect energy
cells, jump across obstacles, and return to the beacon. The example demonstrates real collision,
objectives, pause/resume, restart, respawn, touch input, and graphics recovery.

The main deliverable is the structure: level data and gameplay rules are independent of Three.js,
input devices feed actions, one loop advances Rapier, and React displays low-frequency snapshots.
Use the mechanics that fit your game instead of turning every new project into a collection game.

## Start here

Use Node 22.12 or newer and the pinned pnpm 11.7.0:

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:4420`. Press **Play Island Relay**, then use WASD or the arrow keys to move,
Space to jump, Shift to sprint, Escape to pause, and R to restart. Controls are active while the
game canvas has focus. On a touchscreen, use the movement pad and Jump button; both levels are
completable without sprinting. Switch islands with the selector.

Falling returns you to the spawn point with collected cells retained. Restart clears the current
run. Winning requires every cell and entering the beacon ring. Your best time and display
preferences are stored on the device; there is no account or server. Hidden tabs pause the game.
Less motion disables decorative movement and camera easing, while necessary game movement remains.

```bash
pnpm build
python3 scripts/launch.py
```

The optional desktop launcher opens the built app at `http://127.0.0.1:4421` using a loopback-only
Python server. `--no-open` starts it without a window; `--stop` stops only that launcher's server.
The local checkout is `/home/egormity/Desktop/egormity-repos/Egormity/beacon-game-starter`.

## Extend the foundation

| Owner        | Responsibility                                                           | Start reading                            |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------- |
| `src/game`   | Level definitions, validation, physics, session rules, objectives        | `types.ts`, `levels.ts`, `simulation.ts` |
| `src/engine` | Fixed-step timing, action input, browser lifecycle, renderer composition | `createGame.ts`, `fixedStepClock.ts`     |
| `src/render` | Three.js world, character, camera, lighting, resource ownership          | `renderer.ts`, `world.ts`, `player.ts`   |
| `src/ui`     | React screens, HUD, touch controls, preferences                          | `App.tsx`, `useGame.ts`                  |
| `skill`      | Versioned instructions and localized metadata for the Amazi custom skill | `agent-content.md`, `catalog.json`       |

- [Architecture](docs/architecture.md): ownership, timing, data flow, and disposal.
- [Extending the example](docs/extending.md): add a level, mechanic, character model, or persistence.
- [Research and choices](docs/research.md): official references and alternatives.
- [Amazi setup](docs/amazi.md): application placement and development/production contracts.

All game visuals are procedural. No remote assets, API keys, build-time platform package, or
runtime CDN is required. Rapier's compatibility package embeds WebAssembly in its own cached
chunk (about 1.65 MB gzipped in this build); the loading screen waits for it before enabling Play.
The example is single-player. It does not implement multiplayer authority, networking, pathfinding,
an asset editor, or full save-game persistence.

See [Advanced systems](docs/advanced-systems.md) for physics, gravity, constraints, particles and
effects, including what the example already implements and which owners to extend.

## Verify changes

```bash
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm test:browser
```

Unit tests exercise real Rapier collisions, jumping, state transitions, complete routes through
both sample levels, fixed timing, input edges, and lifecycle disposal. Browser checks use installed
Google Chrome on a temporary port 4422 and exercise real keyboard/touch input, collecting a cell,
pause/restart, level replacement, preferences, unsupported WebGL, and context-loss recovery.
Set `CHROME_PATH` for another Chromium executable. Screenshots go into ignored `.playwright/`.

The core source is MIT licensed; dependencies keep their own licenses. See
[third-party notices](THIRD_PARTY_NOTICES.md). The skill is authored for Amazi's Admin catalog;
the JSON metadata is not a project manifest and has no custom-skill slug. Amazi assigns its UUID.
