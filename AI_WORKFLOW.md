# AI workflow note

## Tools used

- **Claude (Anthropic)**, in an agentic setup with a shell: scaffolding, code generation, running tests and builds, and driving a headless browser (Playwright) to check the UI.
- `<ADD ANY OTHER TOOL YOU USED, e.g. GitHub Copilot in VS Code>`

## Where AI materially sped things up

- **Scaffolding and boilerplate:** API route handlers, Zod schemas, the TipTap toolbar and the share dialog. This is predictable code where review is fast and writing it by hand is slow.
- **Test coverage:** turning the sharing rules into an integration test against an in-memory Postgres took minutes instead of an hour.
- **Verification loop:** the AI ran the build, the test suite and a scripted end-to-end check (login, create, autosave, reload, share, viewer write attempt, forged cookie, file import) after each change, so problems surfaced immediately.

## What I changed or rejected

- **TypeScript version:** the first install pulled TypeScript 7, which broke Next.js path resolution. Pinned to TypeScript 5 instead of working around it in config.
- **A real bug caught by a test:** the generated `titleFromFilename` turned a file named `.md` into a document titled ".md". The test was right, so the function was fixed, not the test.
- **Security defaults:** kept unauthorized access as 404 rather than 403, and kept stored HTML out of `dangerouslySetInnerHTML` (always rendered through TipTap's schema).
- **Scope:** rejected real-time collaboration and real auth as too large for the time box; spent that time on role-based sharing and reliable autosave instead.
- `<ADD YOUR OWN: anything you reviewed and changed by hand, e.g. UI text, styling, a decision you disagreed with>`

## How I verified correctness

- **Automated tests (Vitest, 14 tests):** permission rules, file conversion (including HTML escaping and size/type rejection), and the full sharing lifecycle against real Postgres semantics.
- **End-to-end API checks with curl** against a production build: unauthenticated and forged-cookie requests are rejected, viewers get 403 on write, non-shared users get 404, invalid input returns clear 400s.
- **Browser check with Playwright:** typed formatted text, confirmed the "All changes saved" status, reloaded and confirmed persistence, and confirmed the viewer's editor is not editable. Screenshots are in `docs/screenshots/`.
- **Type check and production build** pass with no errors.
- `<ADD: your own manual testing on the deployed URL>`
