# Beacon game starter

This is a reusable browser game foundation with one example game, not a general game engine.

- Keep game rules and level data in `src/game`, engine timing/input/lifecycle in `src/engine`, Three.js presentation in `src/render`, and React interface in `src/ui`.
- Physics has one fixed-step owner. Do not run gameplay inside React renders or create a second animation loop.
- Treat snapshots as read-only outside the simulation. Rendering must never decide collisions, score, or victory.
- Extend level data or a focused system before introducing a framework or an entity-component architecture.
- Dispose every owned WebGL, physics, event, observer, and animation resource; preserve cancellation during async startup.
- Keep runtime `PORT`, Node 22 compatibility, the pinned package manager, and the root Docker contract usable in Amazi.
- Run focused unit tests and the build for code changes. Use the browser suite for changes to controls, rendering, or game flow.
- Keep files under 300 lines where practical; split any file exceeding 500 lines.

See `docs/architecture.md` and `docs/extending.md` before adding substantial mechanics.
