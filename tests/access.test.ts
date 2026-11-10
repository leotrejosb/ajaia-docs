import { describe, expect, it } from "vitest";
import { can, resolveRole } from "@/lib/access";

describe("resolveRole", () => {
  it("treats the owner as owner even without a share row", () => {
    expect(resolveRole("u1", null, "u1")).toBe("owner");
  });
  it("uses the share role for other users", () => {
    expect(resolveRole("u1", "viewer", "u2")).toBe("viewer");
    expect(resolveRole("u1", "editor", "u2")).toBe("editor");
  });
  it("returns null when there is no access", () => {
    expect(resolveRole("u1", null, "u2")).toBeNull();
  });
});

describe("permissions", () => {
  it("only owners can share or delete", () => {
    expect(can.share("owner")).toBe(true);
    expect(can.share("editor")).toBe(false);
    expect(can.delete("viewer")).toBe(false);
  });
  it("viewers can read but not edit", () => {
    expect(can.view("viewer")).toBe(true);
    expect(can.edit("viewer")).toBe(false);
    expect(can.edit("editor")).toBe(true);
    expect(can.view(null)).toBe(false);
  });
});
