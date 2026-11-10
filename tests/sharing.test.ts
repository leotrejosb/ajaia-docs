import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgliteDb, type Db } from "@/lib/db";
import { migrate } from "@/lib/schema";
import {
  createDocument,
  deleteDocument,
  getDocumentForUser,
  listDocuments,
  revokeShare,
  shareDocument,
  updateDocument,
} from "@/lib/repo";

// End-to-end check of the sharing model against a real (in-memory) Postgres.
let db: Db;

beforeEach(async () => {
  db = pgliteDb(new PGlite());
  await migrate(db);
  for (const [id, email] of [
    ["alice", "alice@test"],
    ["bob", "bob@test"],
    ["carol", "carol@test"],
  ]) {
    await db.query(`INSERT INTO users (id, email, name) VALUES ($1, $2, $1)`, [id, email]);
  }
});

describe("document sharing", () => {
  it("separates owned and shared documents and enforces roles", async () => {
    const id = await createDocument(db, "alice", "Plan", "<p>v1</p>");

    // Before sharing, Bob can't see it at all (404, not 403).
    expect(await getDocumentForUser(db, id, "bob")).toBeNull();

    await shareDocument(db, id, "alice", "BOB@test", "viewer"); // email match is case-insensitive

    const bobDocs = await listDocuments(db, "bob");
    expect(bobDocs.owned).toHaveLength(0);
    expect(bobDocs.shared).toMatchObject([{ id, role: "viewer", ownerName: "alice" }]);
    expect((await listDocuments(db, "alice")).owned).toMatchObject([{ id, role: "owner" }]);

    // Viewer can read but not write.
    expect((await getDocumentForUser(db, id, "bob"))?.content).toBe("<p>v1</p>");
    await expect(updateDocument(db, id, "bob", { content: "<p>hack</p>" })).rejects.toMatchObject({ status: 403 });

    // Upgrade to editor: write succeeds and persists.
    await shareDocument(db, id, "alice", "bob@test", "editor");
    await updateDocument(db, id, "bob", { content: "<p><strong>v2</strong></p>", title: "Plan v2" });
    const reloaded = await getDocumentForUser(db, id, "alice");
    expect(reloaded).toMatchObject({ title: "Plan v2", content: "<p><strong>v2</strong></p>" });

    // Editors can't re-share or delete; strangers get 404.
    await expect(shareDocument(db, id, "bob", "carol@test", "viewer")).rejects.toMatchObject({ status: 403 });
    await expect(deleteDocument(db, id, "bob")).rejects.toMatchObject({ status: 403 });
    await expect(updateDocument(db, id, "carol", { title: "x" })).rejects.toMatchObject({ status: 404 });

    // Revoking removes access immediately.
    await revokeShare(db, id, "alice", "bob");
    expect(await getDocumentForUser(db, id, "bob")).toBeNull();
  });

  it("validates share targets", async () => {
    const id = await createDocument(db, "alice", "Plan");
    await expect(shareDocument(db, id, "alice", "nobody@test", "viewer")).rejects.toMatchObject({ status: 400 });
    await expect(shareDocument(db, id, "alice", "alice@test", "editor")).rejects.toMatchObject({ status: 400 });
  });

  it("deleting a document removes its shares", async () => {
    const id = await createDocument(db, "alice", "Temp");
    await shareDocument(db, id, "alice", "bob@test", "editor");
    await deleteDocument(db, id, "alice");
    expect((await listDocuments(db, "bob")).shared).toHaveLength(0);
  });

  it("treats malformed ids as not found instead of crashing", async () => {
    expect(await getDocumentForUser(db, "not-a-uuid", "alice")).toBeNull();
  });
});
