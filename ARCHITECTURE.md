# Architecture note

## Stack

**Next.js 15 (App Router) + TypeScript + Tailwind**, with **TipTap 3** for editing and **Postgres** for storage. One deployable unit: pages and API live in the same app, which keeps deployment to a single Vercel project.

## What I prioritized

1. **Access control that is correct and testable.** Permission logic lives in `lib/access.ts` (pure functions) and is enforced inside `lib/repo.ts`, the only module that touches the database. API routes stay thin, so a new endpoint cannot accidentally skip a check. Users without access get **404, not 403**, so document IDs don't reveal that a document exists.
2. **An editing flow that feels reliable.** Debounced autosave with a visible status, saves serialized through a promise chain so a slow older request can never overwrite a newer one, a flush on unmount, and a browser warning when leaving with unsaved changes.
3. **Zero-setup local runs.** The same SQL runs on hosted Postgres in production and on embedded PGlite locally and in tests. Reviewers can clone and `npm run dev` without installing a database, and the sharing test runs against real Postgres semantics (constraints, cascades, `ON CONFLICT`), not mocks.

## Key decisions

| Decision | Why | Tradeoff |
|---|---|---|
| Store document content as HTML | TipTap round-trips it losslessly for the supported formatting, and imports (Markdown, docx) naturally produce HTML | Less structured than ProseMirror JSON for future features like comments anchored to nodes |
| HTML is never injected with `dangerouslySetInnerHTML`; it is always loaded into TipTap | TipTap's schema drops anything it doesn't recognize (scripts, event handlers), so imported or crafted HTML can't execute | Unsupported formatting in imported files (tables, colors) is dropped |
| Mocked auth: pick a seeded user, signed httpOnly cookie | The brief allows it, and real auth would eat the time budget. The HMAC stops cookie tampering to impersonate another user | Not real authentication; anyone can sign in as any demo user |
| Viewer/editor roles instead of a single "access" flag | Small extra cost, and it makes the sharing model meaningfully demonstrable (covers the role-based stretch goal) | — |
| Last-write-wins on concurrent edits | Real-time collaboration (CRDT/Yjs) is out of scope for 4 hours | Two editors typing at once can overwrite each other |
| Migrations run idempotently on first request; seed rows use fixed IDs | No separate migration step to run on Vercel; concurrent cold starts can't duplicate seed data | Not suitable once the schema needs real migrations |

## Data model

```
users(id, email unique, name)
documents(id uuid, owner_id → users, title, content html, created_at, updated_at)
document_shares(document_id → documents ON DELETE CASCADE, user_id → users, role 'viewer'|'editor', PK(document_id, user_id))
```

## Validation and errors

Request bodies are validated with Zod (title length, content size cap, email format, role enum). Uploads are limited to `.txt/.md/.docx` and 2 MB, checked server-side as well as in the file picker. Every route goes through one `handle()` wrapper that converts errors into a consistent `{ error }` JSON response, which the UI shows inline.

## Deliberately out of scope

Real authentication, real-time collaboration and presence, comments, version history, export, and sharing with people who don't have an account.

## Next 2–4 hours

1. Optimistic concurrency: send `updatedAt` with each save and return 409 on conflict, so editors don't silently overwrite each other.
2. Version history: snapshot content on each save into a `document_versions` table, with a restore button.
3. Export to Markdown/PDF.
4. Playwright end-to-end test of the share-then-switch-user flow.
