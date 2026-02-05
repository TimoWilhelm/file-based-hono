import type { Context } from "hono";
import { users } from "../../data/users";

export function GET(c: Context) {
  return c.json(users);
}

export function POST(c: Context) {
  return c.json({ message: "User created" }, 201);
}
