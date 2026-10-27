# Amazi application setup

The complete frontend application lives in the repository's `web/` directory. Its package file,
lockfile, Vite configuration, source, public assets, tests and Dockerfile stay together; it has
no build or runtime dependency on files above that directory. Documentation paths below are
relative to this application root.

The provided whole-project layout uses `sourcePath: web`. Commands execute inside that folder,
with `productionBuildContext: application` and `web/Dockerfile`. The repository root contains
reference information and skill metadata, not another application.

To import into an existing project, create `empty_application` and transfer only the contents of
`web/` from the public `main` branch into the returned application directory. Preserve that allocated
source path even when its name differs; do not nest `web/` under it or overwrite other applications.
If the target must be named `web`, configure that path while the new application is still empty
and only when no target directory exists; configuration renames the allocated folder. Do not
configure an existing populated `web/` as though configuration merely attaches it. Application
registration lives in Amazi, not in a repository manifest.

GitHub synchronization copies the workspace tree and does not discover or register apps. Its
initial connection requires a repository without `main`; connect a separate eligible output
repository for your Amazi project instead of connecting this published source template directly.

| Setting                           | Value                                                |
| --------------------------------- | ---------------------------------------------------- |
| Source path (complete repository) | `web`                                                |
| Development command               | `pnpm install --ignore-scripts && exec pnpm run dev` |
| Development / production port     | `10000`                                              |
| Runtime tools                     | `node-22`, `pnpm-10`                                 |
| Preview / public URL / publish    | Enabled                                              |
| Production build context          | `application`                                        |
| Production command override       | Unset; use the Dockerfile command                    |
| Editor adapter                    | `vite-jsx-source-selection`                          |
| Request adapter                   | `vite-http`                                          |
| Persistent volumes                | None                                                 |

Amazi's current logical `pnpm-10` tool supplies pnpm 11.7.0; the package pins that version.
Vite binds `0.0.0.0`, honors injected `PORT`, and otherwise uses 4420/4421 locally. Invalid ports
fail startup. Amazi supplies the permitted preview hostname and source-selection integration;
do not disable host checks or add the TanStack navigation adapter to this app.

The Dockerfile builds with Node 22 and a frozen lockfile. Its production stage runs static-web-server
as UID 65532 on `PORT`, with health and SPA fallback. It accepts `AMAZI_RUNTIME_BASE_IMAGE` and
`AMAZI_BUILD_REVISION`. Optional `application_environment` BuildKit secrets supply build values;
local `.env` files never enter the build context. Only public `VITE_*` values belong in frontend code.

From this application directory (`web/` in the repository):

```bash
docker build -t beacon-game-starter .
docker run --rm -e PORT=10000 -p 127.0.0.1:4423:10000 beacon-game-starter
```

Open `http://127.0.0.1:4423`. The Python launcher is a separate desktop convenience, not the
Amazi production process. The public production preview URL can be added after deployment;
an authenticated project-editor URL is not a public game preview.
