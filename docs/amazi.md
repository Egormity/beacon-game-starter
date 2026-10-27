# Amazi application setup

This repository is one frontend application at its root. `package.json`, `index.html`, `Dockerfile`,
`src/`, and `public/` belong together. Amazi supports `sourcePath: "."` when that application owns
the entire project workspace. Application registration lives in Amazi, not in a repository manifest.

This public template uses `main` as its default branch. For source import into another project,
create an `empty_application` and copy the source from `main` into the allocated application
directory. Keep the returned source path; do not overwrite other applications.

GitHub synchronization copies the workspace tree and does not discover or register apps. Its
initial connection requires a repository without `main`; connect a separate eligible output
repository for your Amazi project instead of connecting this published source template directly.

| Setting                        | Value                                                |
| ------------------------------ | ---------------------------------------------------- |
| Development command            | `pnpm install --ignore-scripts && exec pnpm run dev` |
| Development / production port  | `10000`                                              |
| Runtime tools                  | `node-22`, `pnpm-10`                                 |
| Preview / public URL / publish | Enabled                                              |
| Production build context       | `application`                                        |
| Production command override    | Unset; use the Dockerfile command                    |
| Editor adapter                 | `vite-jsx-source-selection`                          |
| Request adapter                | `vite-http`                                          |
| Persistent volumes             | None                                                 |

Amazi's current logical `pnpm-10` tool supplies pnpm 11.7.0; the package pins that version.
Vite binds `0.0.0.0`, honors injected `PORT`, and otherwise uses 4420/4421 locally. Invalid ports
fail startup. Amazi supplies the permitted preview hostname and source-selection integration;
do not disable host checks or add the TanStack navigation adapter to this app.

The Dockerfile builds with Node 22 and a frozen lockfile. Its production stage runs static-web-server
as UID 65532 on `PORT`, with health and SPA fallback. It accepts `AMAZI_RUNTIME_BASE_IMAGE` and
`AMAZI_BUILD_REVISION`. Optional `application_environment` BuildKit secrets supply build values;
local `.env` files never enter the build context. Only public `VITE_*` values belong in frontend code.

```bash
docker build -t beacon-game-starter .
docker run --rm -e PORT=10000 -p 127.0.0.1:4423:10000 beacon-game-starter
```

Open `http://127.0.0.1:4423`. The Python launcher is a separate desktop convenience, not the
Amazi production process. The public production preview URL can be added after deployment;
an authenticated project-editor URL is not a public game preview.
