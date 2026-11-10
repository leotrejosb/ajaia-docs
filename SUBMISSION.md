# Submission

**Candidate:** Leonardo Trejos Buenaventura
**Live URL:** https://ajaia-exam.vercel.app
**Walkthrough video:** see `VIDEO_URL.txt`

## Included

| Item | Location |
|---|---|
| Source code | this folder (`app/`, `components/`, `lib/`, `tests/`) |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Walkthrough video link | `VIDEO_URL.txt` |
| Screenshots | `docs/screenshots/` |
| Automated tests | `tests/` (run with `npm test`) |

## Test accounts

No passwords. On the sign-in page choose **Alice**, **Bob** or **Carol**. Alice and Bob already share one document each way; use Carol to test a new share. Details in `README.md`.

## Status

**Working end to end:** create, rename, edit with rich text, autosave, reopen; import `.txt`/`.md`/`.docx`; share as viewer or editor, change role, revoke; owned vs shared views; persistence in Postgres; validation and error messages; deployment.

**Incomplete / not built:** real authentication (demo accounts only), real-time collaboration (last write wins), comments, version history, export.

**Next with 2–4 more hours:** conflict detection on save (409 on stale `updatedAt`), version history with restore, Markdown/PDF export, and a Playwright test of the full share flow.
