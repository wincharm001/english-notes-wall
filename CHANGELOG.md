# Changelog

## 1.13.0 — 2026-11-09

- Moved the daily quiz out of the right sidebar and into a dedicated modal, opened from a new header quiz button with an unread dot.
- The modal keeps its draft answers when closed, starts expanded, pauses the countdown while hidden, traps keyboard focus, closes on Escape or a backdrop click, and locks page scrolling while open.
- The quiz header keeps the regenerate, collapse, and close controls; the sidebar now holds only settings, usage, and wall overview.

## 1.12.1 — 2026-11-09

- The right sidebar now has its own scroll container and scrollbar, so settings, quiz, usage, and overview stay usable without scrolling the whole page.
- Removed the delete button from the note card header. Delete now lives inside the inline editor and keeps the same confirmation step.

## 1.12.0 — 2026-11-09

### Category-level long-sentence analysis

- Renamed the `sentence` category from “例句” / “Sentence” to “长难句分析” / “Long-sentence analysis”. The stored category key stays `sentence`, so existing notes, colors, filters, and organization data need no migration.
- Moved long-sentence positioning to the category layer: a note in “长难句分析” now expands into an analysis of its saved sentence — Chinese translation, structure, grammar, and an authentic chunk — instead of generating unrelated long sentences.
- Word, phrase, collocation, and sentence-pattern entries go back to ordinary examples: 2–3 natural sentences with translations and optional structure/grammar notes.
- Expansion headings follow the category: “例句” for word-like notes, “长难句分析” for sentence notes; optional extra sentences appear as “更多例句” or “更多长难句”.
- Practice mode now shows a category-specific hint: main clause and subordinate clauses for sentence notes, self-translation for word examples.
- Quiz material for a sentence note uses the analyzed saved sentence when available.

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
