# Beacon — browser 3D game starter

A playable example and reusable game foundation for Amazi. The complete, independently runnable application is in [`web/`](web/); repository-level [`skill/`](skill/agent-content.md) contains the custom skill instructions and localized Admin metadata.

```text
web/
  package.json
  pnpm-lock.yaml
  Dockerfile
  src/
  public/
  docs/
  e2e/
skill/
README.md
```

## Run and verify

Use Node 22.12+ and pnpm 11.7.0. From this repository root:

```bash
pnpm --dir web install --frozen-lockfile
pnpm --dir web dev
pnpm --dir web format:check
pnpm --dir web typecheck
pnpm --dir web test
pnpm --dir web build
pnpm --dir web test:browser
```

Open `http://127.0.0.1:4420`. See the [application README](web/README.md) for controls, desktop preview and extension details.

## Use in Amazi

The provided project layout uses `sourcePath: web` and `productionBuildContext: application`. Its Dockerfile is `web/Dockerfile`; commands run inside `web/`.

For an existing project, create `empty_application` and copy **only the contents of `web/`** into the returned application source path. Keep that allocated path, which may have another name. Do not copy the repository root or nest a second `web/` inside the allocated application. Registration remains separate from source transfer. To use the exact name `web`, configure the empty application before copying files and only if that target directory is absent; changing the source path moves the allocated folder.

```bash
docker build -t beacon-game-starter ./web
docker run --rm -e PORT=10000 -p 127.0.0.1:4423:10000 beacon-game-starter
```

Read [Amazi setup](web/docs/amazi.md), [architecture](web/docs/architecture.md), [extension guidance](web/docs/extending.md), and [advanced systems](web/docs/advanced-systems.md). The public template uses `main`; connect a separate eligible output repository when Amazi's initial synchronization flow requires no existing `main` branch. A public production preview has not been supplied.

Original code is [MIT licensed](LICENSE). The app includes its own license and asset notices so `web/` can be copied independently.
