declare module "virtual:file-routes" {
  import type { Hono } from "hono";
  const app: Hono<{ Bindings: CloudflareBindings }>;
  export default app;
}
