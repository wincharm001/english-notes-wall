- [x] I added **one file** at `data/plugins/wincharm001__english-notes-wall--english-notes-wall.yml` — that single file is the whole submission.
- [x] The plugin package's `package.json` declares **`dsh.bundle`** (`dsh.bundle.patch: ./cordis.patch.yml`), and `dsh.client` for the browser half. The entry points at the package directory `english-notes-wall/` inside the repository.
- [x] `category: tools` — it is a working tool with an agent tool and a page, not a theme or a pure UI decoration.
- [x] Description states what the plugin does, with no superlatives. Every claim is in the code: categories, model expansion, spaced repetition, a daily quiz, and twelve bundled IELTS essays with selection-to-note capture.
- [x] Published to npm as `dsh-english-notes-wall` (MIT), with `repository` pointing back at this repository.
- [ ] Repo age: the repository was created 2026-11-24T12:42:02Z, so the 1-day gate clears on 2026-11-25T12:42Z. The gate re-runs by itself; no resubmission is planned.
- [ ] `dsh-plugin` topic: will be added in the repository settings before review.

The plugin is an English-learning sticky-note wall for DeepSeek Harness. The Host half owns the note store, per-entry model expansion, spaced-repetition state, the daily quiz and the bundled IELTS essay reader; it also registers an `english_notes` agent tool. The Client half renders the wall as a main-panel page plus a sidebar entry. Data is stored under `%DSH_HOME%/english-notes-wall/store.json` with atomic writes and daily backups; there are no runtime dependencies, no install scripts, and the only network calls are the model requests the user explicitly configures.
