# Changelog

## 1.11.0 — 2026-11-08

### Learning loop

- Added spaced repetition per entry: levels 1/3/7/15/30/60 days, wrong fixed answers reset the level and become due in ten minutes, and the daily quiz now draws due and most-overdue entries first.
- Added due counts to the quiz card and the wall overview, plus 7-day accuracy, reviewed-today, entry count, and scheduled counts.
- Added a long-sentence practice mode that hides the Chinese translation, structure, grammar, and chunk until revealed.
- Added `sentence` (long-sentence translation) and `dictation` quiz types; local fallback quizzes use them when material allows.

### Reliability

- Expansion now runs in chunks of two entries, retries a bad response once, keeps successful chunks, and reports partial results with per-entry failures instead of losing the whole note.
- Batch “fill missing expansions” now runs two notes at a time, can be stopped, and offers a retry list for failures. An in-flight expansion can be cancelled through the Host.
- Automatic daily backups keep the last seven days; manual backups are also available.

### Data

- Added JSON, CSV, and Anki TSV export.
- Added JSON import with entry-level deduplication and expansion enrichment.
- Added note restore for the twelve-second delete undo.

### Wall and interaction

- Added pinning (pinned notes get a top group), drag-to-reorder in the unfiltered date view, and study-status filters (due, not expanded, scheduled).
- Tags are now clickable filters.
- Added `/`, `n`, `j`/`k`, `Esc`, and `Ctrl/Cmd + Enter` keyboard shortcuts.
- Added browser read-aloud buttons for entries and long sentences.

### Docs

- Documented the new data model, quiz types, backup location, host methods, and publishing plan.

## 1.10.0 — 2026-11-06

- Repositioned “examples” as long-sentence analysis: 2–3 long complex sentences per entry with translation, structure, grammar, and an authentic chunk, plus optional extra long sentences.
- Added word forms, discrimination, one-click expansion, batch expansion, prompt templates, model selection, token cost estimates, and the daily quiz countdown.
