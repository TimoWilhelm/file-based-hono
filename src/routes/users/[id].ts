import type { Context } from "hono";
import { users } from "../../data/users";

export function GET(c: Context) {
  const id = c.req.param("id");
  const user = users.find((u) => u.id === id);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
}

export function DELETE(c: Context) {
  const id = c.req.param("id");
  return c.json({ message: `User ${id} deleted` });
}
