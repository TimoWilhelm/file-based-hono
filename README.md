# file-based-hono

File-based routing for [Hono](https://hono.dev/) on Cloudflare Workers.

A build-time script scans `src/routes/` and generates a route manifest so each file maps to an HTTP endpoint automatically.

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
| `bun run dev` | Generate routes & start local dev server |
| `bun run deploy` | Generate routes & deploy to Cloudflare |
| `bun run generate-routes` | Regenerate `src/generated/routes.ts` |
| `bun run cf-typegen` | Sync `CloudflareBindings` types from `wrangler.jsonc` |
