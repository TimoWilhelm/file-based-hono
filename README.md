# file-based-hono

File-based routing for [Hono](https://hono.dev/) on Cloudflare Workers, powered by a custom [Vite](https://vite.dev/) plugin and the [@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/).

Just place route files in `src/routes/` — no manual router or code generation step needed. The custom Vite plugin scans the routes directory and generates a virtual module at dev/build time with full HMR support.

## Route Conventions

| File | Route |
|---|---|
| `src/routes/index.ts` | `/` |
| `src/routes/users/index.ts` | `/users` |
| `src/routes/users/[id].ts` | `/users/:id` |

Export named HTTP method handlers (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) or a `default` Hono sub-app:

```ts
import type { Context } from "hono";

export function GET(c: Context) {
  return c.json({ ok: true });
}
```

## Getting Started

```sh
bun install
bun run dev
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start Vite dev server with Cloudflare Workers runtime |
| `bun run build` | Build for production |
| `bun run preview` | Build & preview locally |
| `bun run deploy` | Build & deploy to Cloudflare |
| `bun run cf-typegen` | Sync `CloudflareBindings` types from `wrangler.jsonc` |

## How It Works

The custom Vite plugin (`plugins/file-based-router.ts`) uses Vite's virtual module system:

1. Scans `src/routes/` for `.ts` files at dev/build time
2. Generates a `virtual:file-routes` module that creates a Hono app with all routes registered
3. `src/index.ts` simply re-exports the virtual module as the Worker entry point
4. In dev mode, adding or removing route files triggers a full reload automatically
