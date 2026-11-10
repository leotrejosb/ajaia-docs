/**
 * Access rules live in one pure module so they are easy to reason about and test.
 *
 * owner  - full control: edit, rename, share, delete
 * editor - edit content and rename
 * viewer - read only
 */
export type Role = "owner" | "editor" | "viewer";
export type ShareRole = Exclude<Role, "owner">;

export function resolveRole(
  ownerId: string,
  shareRole: ShareRole | null | undefined,
  userId: string,
): Role | null {
  if (ownerId === userId) return "owner";
  return shareRole ?? null;
}

export const can = {
  view: (r: Role | null) => r !== null,
  edit: (r: Role | null) => r === "owner" || r === "editor",
  share: (r: Role | null) => r === "owner",
  delete: (r: Role | null) => r === "owner",
};
