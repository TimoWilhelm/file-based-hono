import { Hono } from "hono";
import { routes, type RouteModule } from "./generated/routes";

type Env = { Bindings: CloudflareBindings };

export function createFileRouter(): Hono<Env> {
  const app = new Hono<Env>();

  for (const [path, module] of Object.entries(routes)) {
    registerRoute(app, path, module);
  }

  return app;
}

function registerRoute(app: Hono<Env>, path: string, module: RouteModule) {
  if (module.GET) {
    app.get(path, module.GET);
  }
  if (module.POST) {
    app.post(path, module.POST);
  }
  if (module.PUT) {
    app.put(path, module.PUT);
  }
  if (module.PATCH) {
    app.patch(path, module.PATCH);
  }
  if (module.DELETE) {
    app.delete(path, module.DELETE);
  }
  if (module.default && typeof module.default === "object" && module.default.fetch) {
    app.route(path, module.default);
  }
}
