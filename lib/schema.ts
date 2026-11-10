import type { Db } from "./db";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS documents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_id TEXT NOT NULL REFERENCES users(id),
     title TEXT NOT NULL,
     content TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS document_shares (
     document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users(id),
     role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (document_id, user_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(user_id)`,
];

export async function migrate(db: Db) {
  for (const stmt of STATEMENTS) await db.query(stmt);
}

export const SEED_USERS = [
  { id: "u_alice", email: "alice@ajaia.test", name: "Alice Rivera" },
  { id: "u_bob", email: "bob@ajaia.test", name: "Bob Chen" },
  { id: "u_carol", email: "carol@ajaia.test", name: "Carol Diaz" },
] as const;

// Fixed IDs make seeding idempotent even if two cold starts race.
const SEED_DOCS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    owner: "u_alice",
    title: "Q4 Product Roadmap",
    legacyContent:
      "<h1>Q4 Product Roadmap</h1><p>This document is <strong>owned by Alice</strong> and shared with <em>Bob as an editor</em>.</p><h2>Priorities</h2><ol><li><p>Ship document sharing</p></li><li><p>Improve file import</p></li></ol>",
    content:
      "<h1>Q4 Product Roadmap</h1><p>Our focus this quarter is making the first ten minutes feel effortless. We will keep the scope tight, talk to customers every week, and ship improvements in small batches.</p><h2>October</h2><ul><li><p><strong>Document sharing:</strong> finish role controls and invite five teams to test the flow.</p></li><li><p><strong>File import:</strong> review the most common DOCX formatting issues.</p></li></ul><h2>November</h2><ul><li><p>Add conflict warnings when two people edit the same document.</p></li><li><p>Run three onboarding interviews and collect time-to-first-document.</p></li></ul><h2>Open questions</h2><p>Do people expect comments before version history? Alice will bring interview notes to Friday's planning session.</p>",
    share: { user: "u_bob", role: "editor" },
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    owner: "u_bob",
    title: "Team Meeting Notes",
    legacyContent:
      "<h2>Weekly sync</h2><p>Owned by Bob and shared with <u>Alice as a viewer</u>, so Alice sees it read-only.</p><ul><li><p>Review import edge cases</p></li><li><p>Plan deployment</p></li></ul>",
    content:
      "<h1>Weekly team sync</h1><p><strong>Tuesday, 10:00 AM</strong> · Product room</p><h2>Decisions</h2><ul><li><p>Keep the import limit at 2 MB for the first release.</p></li><li><p>Use plain-language permission labels throughout the app.</p></li><li><p>Move the deployment rehearsal to Thursday afternoon.</p></li></ul><h2>Next steps</h2><ul><li><p>Bob: test DOCX files exported from Google Docs.</p></li><li><p>Alice: draft the onboarding questions.</p></li><li><p>Carol: check empty states on mobile.</p></li></ul><h2>Parking lot</h2><p>Revisit PDF export after we have feedback from the pilot teams.</p>",
    share: { user: "u_alice", role: "viewer" },
  },
] as const;

export async function seed(db: Db) {
  for (const u of SEED_USERS) {
    await db.query(
      `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [u.id, u.email, u.name],
    );
  }
  for (const d of SEED_DOCS) {
    const inserted = await db.query(
      `INSERT INTO documents (id, owner_id, title, content) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING RETURNING id`,
      [d.id, d.owner, d.title, d.content],
    );
    if (inserted.length) {
      await db.query(
        `INSERT INTO document_shares (document_id, user_id, role) VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [d.id, d.share.user, d.share.role],
      );
    }
    await db.query(`UPDATE documents SET content = $2 WHERE id = $1 AND content = $3`, [
      d.id,
      d.content,
      d.legacyContent,
    ]);
  }
}
