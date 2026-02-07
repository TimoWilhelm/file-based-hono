# file-based-hono

File-based routing for [Hono](https://hono.dev/) on Cloudflare Workers, powered by a custom [Vite](https://vite.dev/) plugin and [@cloudflare/vite-plugin](https://developers.cloudflare.com/workers/vite-plugin/).

## Vite Plugin Setup

Add `fileBasedRouter()` to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileBasedRouter } from "./plugins/file-based-router";

export default defineConfig({
  plugins: [fileBasedRouter(), cloudflare()],
});
```

The plugin generates a `virtual:file-routes` virtual module that exports a fully configured Hono app. Your Worker entry point just re-exports it:

```ts
// src/index.ts
import app from "virtual:file-routes";

export default app;
```

No manual router wiring or code generation step needed — routes are resolved at dev/build time with full HMR support.

### Options

| Option | Default | Description |
|---|---|---|
| `routesDir` | `"src/routes"` | Directory to scan for route files |

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

1. The plugin scans `src/routes/` for `.ts` files and generates a `virtual:file-routes` module with all routes registered on a Hono app
2. Static routes are prioritized over dynamic (`:param`) routes
3. Adding or removing route files in dev mode triggers an automatic full reload
