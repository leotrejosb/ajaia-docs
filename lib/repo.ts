import type { Db } from "./db";
import { can, resolveRole, type Role, type ShareRole } from "./access";
import { badRequest, forbidden, notFound } from "./errors";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface DocSummary {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: Role;
}

export interface Doc extends DocSummary {
  ownerId: string;
  content: string;
}

export interface Share {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

export async function listUsers(db: Db): Promise<User[]> {
  return db.query<User>(`SELECT id, email, name FROM users ORDER BY name`);
}

export async function getUser(db: Db, id: string): Promise<User | null> {
  const rows = await db.query<User>(`SELECT id, email, name FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listDocuments(db: Db, userId: string) {
  const owned = await db.query<{ id: string; title: string; updated_at: Date; owner_name: string }>(
    `SELECT d.id, d.title, d.updated_at, u.name AS owner_name
       FROM documents d JOIN users u ON u.id = d.owner_id
      WHERE d.owner_id = $1
      ORDER BY d.updated_at DESC`,
    [userId],
  );
  const shared = await db.query<{
    id: string;
    title: string;
    updated_at: Date;
    owner_name: string;
    role: ShareRole;
  }>(
    `SELECT d.id, d.title, d.updated_at, u.name AS owner_name, s.role
       FROM document_shares s
       JOIN documents d ON d.id = s.document_id
       JOIN users u ON u.id = d.owner_id
      WHERE s.user_id = $1
      ORDER BY d.updated_at DESC`,
    [userId],
  );
  return {
    owned: owned.map<DocSummary>((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: iso(r.updated_at),
      ownerName: r.owner_name,
      role: "owner",
    })),
    shared: shared.map<DocSummary>((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: iso(r.updated_at),
      ownerName: r.owner_name,
      role: r.role,
    })),
  };
}

export async function createDocument(db: Db, ownerId: string, title: string, content = "") {
  const rows = await db.query<{ id: string }>(
    `INSERT INTO documents (owner_id, title, content) VALUES ($1, $2, $3) RETURNING id`,
    [ownerId, title, content],
  );
  return rows[0].id;
}

/** Returns null both when the doc doesn't exist and when the user has no access (no existence leak). */
export async function getDocumentForUser(db: Db, id: string, userId: string): Promise<Doc | null> {
  if (!UUID_RE.test(id)) return null;
  const rows = await db.query<{
    id: string;
    title: string;
    content: string;
    owner_id: string;
    owner_name: string;
    updated_at: Date;
    share_role: ShareRole | null;
  }>(
    `SELECT d.id, d.title, d.content, d.owner_id, d.updated_at, u.name AS owner_name, s.role AS share_role
       FROM documents d
       JOIN users u ON u.id = d.owner_id
       LEFT JOIN document_shares s ON s.document_id = d.id AND s.user_id = $2
      WHERE d.id = $1`,
    [id, userId],
  );
  const r = rows[0];
  if (!r) return null;
  const role = resolveRole(r.owner_id, r.share_role, userId);
  if (!role) return null;
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    updatedAt: iso(r.updated_at),
    role,
  };
}

async function requireRole(db: Db, id: string, userId: string, check: (r: Role) => boolean) {
  const doc = await getDocumentForUser(db, id, userId);
  if (!doc) throw notFound();
  if (!check(doc.role)) throw forbidden();
  return doc;
}

export async function updateDocument(
  db: Db,
  id: string,
  userId: string,
  patch: { title?: string; content?: string },
) {
  await requireRole(db, id, userId, can.edit);
  const rows = await db.query<{ updated_at: Date }>(
    `UPDATE documents
        SET title = COALESCE($2, title),
            content = COALESCE($3, content),
            updated_at = now()
      WHERE id = $1
      RETURNING updated_at`,
    [id, patch.title ?? null, patch.content ?? null],
  );
  return { updatedAt: iso(rows[0].updated_at) };
}

export async function deleteDocument(db: Db, id: string, userId: string) {
  await requireRole(db, id, userId, can.delete);
  await db.query(`DELETE FROM documents WHERE id = $1`, [id]);
}

export async function listShares(db: Db, id: string, userId: string): Promise<Share[]> {
  await requireRole(db, id, userId, can.view);
  return db.query<Share>(
    `SELECT u.id AS "userId", u.email, u.name, s.role
       FROM document_shares s JOIN users u ON u.id = s.user_id
      WHERE s.document_id = $1
      ORDER BY u.name`,
    [id],
  );
}

export async function shareDocument(
  db: Db,
  id: string,
  ownerId: string,
  email: string,
  role: ShareRole,
) {
  const doc = await requireRole(db, id, ownerId, can.share);
  const target = await db.query<User>(`SELECT id, email, name FROM users WHERE lower(email) = lower($1)`, [
    email.trim(),
  ]);
  if (!target[0]) throw badRequest(`No user found with email ${email}`);
  if (target[0].id === doc.ownerId) throw badRequest("You already own this document");
  await db.query(
    `INSERT INTO document_shares (document_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (document_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [id, target[0].id, role],
  );
  return listShares(db, id, ownerId);
}

export async function revokeShare(db: Db, id: string, ownerId: string, targetUserId: string) {
  await requireRole(db, id, ownerId, can.share);
  await db.query(`DELETE FROM document_shares WHERE document_id = $1 AND user_id = $2`, [id, targetUserId]);
  return listShares(db, id, ownerId);
}
