# Ajaia Docs

A small collaborative document editor: create and edit rich-text documents, import files, and share documents with other users as viewers or editors.

**Live demo:** `<PASTE VERCEL URL>`

## Demo accounts

No passwords. Pick an account on the sign-in screen.

| User | Email | Seeded data |
|---|---|---|
| Alice Rivera | alice@ajaia.test | Owns **Q4 Product Roadmap** (shared with Bob as *editor*) |
| Bob Chen | bob@ajaia.test | Owns **Team Meeting Notes** (shared with Alice as *viewer*) |
| Carol Diaz | carol@ajaia.test | Nothing shared, good for testing a fresh share |

**Quick sharing test:** sign in as Alice, open a document, click **Share**, add `carol@ajaia.test` as *Can view*. Click **Switch user**, sign in as Carol: the document appears under *Shared with me* and opens read-only.

## Features

- **Editing:** bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo, keyboard shortcuts. Autosaves 800 ms after you stop typing, with a visible save status.
- **Documents:** create, rename (click the title), delete (owner only), reopen. Content is stored as HTML, so formatting survives reloads.
- **File import:** `.txt`, `.md` and `.docx` (max 2 MB) become a new editable document. Other types are rejected with a clear message.
- **Sharing:** the owner shares by email with a role: *viewer* (read only) or *editor* (edit and rename). Roles can be changed or revoked. The dashboard separates **My documents** from **Shared with me** and shows each role.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

No database setup is needed: without `DATABASE_URL` the app uses an embedded Postgres ([PGlite](https://pglite.dev)) stored in `./.data/pglite`, and seeds the demo users on first start. Delete `.data/` to reset.

To use a real Postgres instead, copy `.env.example` to `.env.local` and set `DATABASE_URL`.

```bash
npm test           # Vitest: access rules, file import, sharing flow against an in-memory Postgres
npm run typecheck
npm run build
```

## Deploy (Vercel + Neon, both free tiers)

1. Push this repo to GitHub and import it in Vercel.
2. In the Vercel project, add a Neon Postgres database from **Storage** (this sets `DATABASE_URL`), or paste a Neon connection string yourself.
3. Add `SESSION_SECRET` (any long random string).
4. Deploy. Tables and demo users are created automatically on the first request.

## Project layout

```
app/                 Next.js App Router pages and API route handlers
  api/documents/     CRUD, import and sharing endpoints
components/          Client components (editor, toolbar, share dialog, dashboard)
lib/access.ts        Role resolution and permission checks (pure, unit tested)
lib/repo.ts          All database queries; every mutation checks permissions here
lib/import.ts        File → HTML conversion
lib/db.ts            Postgres (prod) or PGlite (local/tests) behind one query interface
tests/               Vitest suites
```

See [ARCHITECTURE.md](ARCHITECTURE.md) and [AI_WORKFLOW.md](AI_WORKFLOW.md).
