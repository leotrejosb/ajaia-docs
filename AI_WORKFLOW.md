# AI workflow note

## Tools used

- **Claude (Anthropic)**, in an agentic setup with a shell: scaffolding, code generation, running tests and builds, and driving a headless browser (Playwright) to check the UI.

## Where AI materially sped things up

- **Scaffolding and boilerplate:** API route handlers, Zod schemas, the TipTap toolbar and the share dialog. This is predictable code where review is fast and writing it by hand is slow.
- **Test coverage:** turning the sharing rules into an integration test against an in-memory Postgres took minutes instead of an hour.
- **Verification loop:** the AI ran the build, the test suite and a scripted end-to-end check (login, create, autosave, reload, share, viewer write attempt, forged cookie, file import) after each change, so problems surfaced immediately.

## What I changed or rejected

- **TypeScript version:** the first install pulled TypeScript 7, which broke Next.js path resolution. Pinned to TypeScript 5 instead of working around it in config.
- **A real bug caught by a test:** the generated `titleFromFilename` turned a file named `.md` into a document titled ".md". The test was right, so the function was fixed, not the test.
- **Security defaults:** kept unauthorized access as 404 rather than 403, and kept stored HTML out of `dangerouslySetInnerHTML` (always rendered through TipTap's schema).
- **Scope:** rejected real-time collaboration and real auth as too large for the time box; spent that time on role-based sharing and reliable autosave instead.
- **Deployment configuration:** the first production deploy crashed because there was no `DATABASE_URL`, so the app fell back to embedded PGlite, which can't write to Vercel's read-only filesystem. When connecting Neon through the Vercel integration, the default variable prefix was `STORAGE` (creating `STORAGE_URL`), which the app doesn't read. I changed the prefix to `DATABASE` so it created `DATABASE_URL`, then redeployed.
- **Product decisions I owned:** scope (role-based sharing and reliable autosave over real-time collaboration), keeping everything in one Next.js deployment instead of a separate backend service, and choosing mocked auth with seeded users so reviewers can test sharing in seconds.

## How I verified correctness

- **Automated tests (Vitest, 14 tests):** permission rules, file conversion (including HTML escaping and size/type rejection), and the full sharing lifecycle against real Postgres semantics.
- **End-to-end API checks with curl** against a production build: unauthenticated and forged-cookie requests are rejected, viewers get 403 on write, non-shared users get 404, invalid input returns clear 400s.
- **Browser check with Playwright:** typed formatted text, confirmed the "All changes saved" status, reloaded and confirmed persistence, and confirmed the viewer's editor is not editable. Screenshots are in `docs/screenshots/`.
- **Type check and production build** pass with no errors.
- **Manual testing on the live URL:** signed in as Alice, created a document with bold text and a list, reloaded to confirm persistence, shared it with Carol as a viewer, switched to Carol and confirmed it appears under *Shared with me* and is read-only, and imported a `.docx` file.
