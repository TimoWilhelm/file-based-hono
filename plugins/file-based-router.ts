import { readdirSync, readFileSync, statSync, existsSync, realpathSync } from "node:fs";
import { join, relative, posix } from "node:path";
import type { Plugin } from "vite";

interface FileRoute {
  filePath: string;
  routePath: string;
}

interface FileBasedRouterOptions {
  routesDir?: string;
}

function scanRoutes(dir: string, baseDir: string, routes: FileRoute[] = [], visited: Set<string> = new Set()): FileRoute[] {
  if (!existsSync(dir)) {
    return routes;
  }

  const realDir = realpathSync(dir);
  if (visited.has(realDir)) {
    return routes;
  }
  visited.add(realDir);

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanRoutes(fullPath, baseDir, routes, visited);
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts") && !entry.endsWith(".d.ts")) {
      const relativePath = relative(baseDir, fullPath);
      let routePath = "/" + relativePath.replace(/\.ts$/, "").replace(/\\/g, "/");

      // Handle index files: /users/index -> /users
      if (routePath.endsWith("/index")) {
        routePath = routePath.slice(0, -6) || "/";
      }

      // Handle dynamic segments: [id] -> :id
      routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

      routes.push({ filePath: fullPath, routePath });
    }
  }

  return routes;
}

function sortRoutesBySpecificity(routes: FileRoute[]): FileRoute[] {
  return routes.toSorted((a, b) => {
    const aDynamic = (a.routePath.match(/:/g) || []).length;
    const bDynamic = (b.routePath.match(/:/g) || []).length;
    if (aDynamic !== bDynamic) return aDynamic - bDynamic;
    return b.routePath.length - a.routePath.length;
  });
}

const VIRTUAL_MODULE_ID = "virtual:file-routes";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function getExportedNames(filePath: string): Set<string> {
  const src = readFileSync(filePath, "utf-8");
  const names = new Set<string>();
  // Match: export function NAME, export const NAME, export { NAME }
  for (const m of src.matchAll(/\bexport\s+(?:async\s+)?function\s+(\w+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/\bexport\s+(?:const|let|var)\s+(\w+)/g)) names.add(m[1]);
  if (/\bexport\s+default\b/.test(src)) names.add("default");
  return names;
}

export function fileBasedRouter(options: FileBasedRouterOptions = {}): Plugin {
  let routesDir: string;
  let root: string;

  return {
    name: "vite-plugin-file-based-router",

    configResolved(config) {
      root = config.root;
      routesDir = options.routesDir
        ? join(root, options.routesDir)
        : join(root, "src", "routes");
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return;
      }

      const routes = sortRoutesBySpecificity(scanRoutes(routesDir, routesDir));

      // Track route files so Vite knows the virtual module depends on them
      for (const route of routes) {
        this.addWatchFile(route.filePath);
      }

      const imports: string[] = [];
      const registrations: string[] = [];

      routes.forEach((route, index) => {
        const importName = `route${index}`;
        // Use posix path for imports
        let importPath = relative(root, route.filePath).replace(/\\/g, "/").replace(/\.ts$/, "");
        // Guard against cross-drive absolute paths on Windows
        if (/^[a-zA-Z]:/.test(importPath)) {
          throw new Error(
            `Route file "${route.filePath}" is on a different drive than the project root "${root}". ` +
            `Move your routes directory to the same drive as the project.`
          );
        }
        importPath = posix.normalize(importPath);

        if (importPath.startsWith("..")) {
          throw new Error(
            `Route file "${route.filePath}" is outside the project root "${root}". ` +
            `Move your routes directory inside the project root.`
          );
        }

        imports.push(`import * as ${importName} from "/${importPath}";`);

        const safeRoutePath = JSON.stringify(route.routePath);
        const exported = getExportedNames(route.filePath);
        for (const method of HTTP_METHODS) {
          if (exported.has(method)) {
            registrations.push(
              `if (${importName}.${method}) app.${method.toLowerCase()}(${safeRoutePath}, ${importName}.${method});`
            );
          }
        }
        // Support exporting a Hono sub-app as default
        if (exported.has("default")) {
          registrations.push(
            `if (${importName}.default?.fetch) app.route(${safeRoutePath}, ${importName}.default);`
          );
        }
      });

      return `import { Hono } from "hono";
${imports.join("\n")}

const app = new Hono();

${registrations.join("\n")}

export default app;
`;
    },

    configureServer(server) {
      // Watch the routes directory for changes and trigger HMR
      server.watcher.add(routesDir);
      server.watcher.on("all", (event, filePath) => {
        // Normalize separators for cross-platform compatibility
        const normalizedPath = filePath.replace(/\\/g, "/");
        const normalizedRoutesDir = routesDir.replace(/\\/g, "/").replace(/\/?$/, "/");
        if (
          normalizedPath.startsWith(normalizedRoutesDir) &&
          (event === "add" || event === "unlink") &&
          normalizedPath.endsWith(".ts") &&
          !normalizedPath.endsWith(".test.ts") &&
          !normalizedPath.endsWith(".d.ts")
        ) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.hot.send({ type: "full-reload" });
          }
        }
      });
    },
  };
}
