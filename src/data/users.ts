export const users = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

export type User = (typeof users)[number];
