import type { Context } from "hono";

export function GET(c: Context) {
  return c.json({ message: "Hello from file-based routing!" });
}
