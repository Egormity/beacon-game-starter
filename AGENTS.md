# beacon-game-starter repository

- The standalone browser application lives in `web/`. Read `web/AGENTS.md` before changing it.
- Keep its dependencies, lockfile, runtime configuration, Dockerfile, assets, tests and documentation inside `web/`. It must install, build and run when copied by itself.
- Repository-level `skill/` contains Amazi Admin instructions and metadata; it is not an application or a runtime dependency.
- Use `pnpm --dir web <command>` from this repository root. Amazi uses `sourcePath: web` and the application build context.
- When importing into an existing Amazi project, copy only the contents of `web/` into the returned application source path.
