# Changelog

## 1.17.3 — 2026-11-14

- Removed the redundant close icon from the essay reader header. The labelled “Back to wall” control is now the single dismiss button; Escape still closes the reader.

## 1.17.2 — 2026-11-14

- Anchored the essay reader to the plugin page area instead of the whole browser window, so its top bar no longer sits on top of the DSH header and its edges no longer cover the DSH sidebar.
- The reader re-measures its bounds when the window is resized, including the width change after the page scrollbar is locked.

## 1.17.1 — 2026-11-12

- Fixed “Today's essay” failing with `args fields do not match the descriptor: missing "date"`. The `essayToday` RPC no longer declares a required date argument; the Host uses the local date and the Client sends an empty argument object.
- Removed the small “one entry per line / text | 中文” hint under the new-note box and its now-unused locale and style entries.

## 1.17.0 — 2026-11-11

- Added a daily IELTS Academic Task 2 essay reader, opened from a new header button with an unread dot.
- Bundled twelve original band-7.5 model essays with task questions, four-paragraph essays, paragraph translations, sentence-level analysis, outlines, cohesive devices, six vocabulary items, and three comprehension questions each. The Host selects one per local day, keeps the choice stable all day, avoids the previous two weeks, and stores reading progress.
- The full-screen reader supports showing or hiding Chinese, clickable sentence analyses, read-aloud for each paragraph, vocabulary cards, comprehension feedback, and an optional think-first outline. Any selected text can be saved directly to the wall as a word, phrase, collocation, pattern, or long-sentence note; the category is inferred and editable, and saved notes join the existing SRS.
- With a model configured, “AI essay” generates and validates a replacement essay for the day, caches it, resets that day's reading progress, records token usage under `essay`, and leaves the built-in essay untouched when generation fails.
- Essay selections, progress, and generated text are included in the JSON export and merged on import. The token usage card now has an essay purpose.

## 1.16.0 — 2026-11-11

- Added a floating “Back to top” button to the wall. It appears at the bottom-right after the page is scrolled past about 320px, fades out near the top, and hides while a dialog is open.
- Clicking it scrolls the wall back to the top smoothly; the jump is instant when the system asks for reduced motion. The `Home` key does the same when focus is not in a text field.
- On narrow screens the button collapses to a compact icon-only circle.

## 1.15.1 — 2026-11-11

- The full-note dialog now picks up the note's category color: the page backdrop and the dialog surface are tinted with that category's accent, the dialog gets a matching top border and header rule, and the category chip inside the dialog is colored as well.
- The tone changes with the note when using the previous/next arrows, so every note keeps its category identity in the dialog.

## 1.15.0 — 2026-11-10

- Added previous/next arrows on the left and right of the full-note dialog, so any note can be browsed without closing and reopening the dialog.
- Navigation follows the visible wall order, including the current category, tag, status, and search filters, as well as pinned-first and organized grouping. It wraps around at both ends.
- The dialog header shows the note's position (“2 / 18”); Left and Right arrow keys move between notes, and the scroll position resets to the top of each note.
- On narrow screens the side arrows collapse into a compact previous/next row under the dialog header. All navigation buttons stay inside the dialog's focus trap.

## 1.14.0 — 2026-11-10

- Added a full-note dialog: the expand-corners button on a note opens its complete content in a modal, independent of the card's collapsed state.
- The dialog shows every entry and translation, all expansions (including long-sentence analysis, examples, forms, collocations, and tips), tags, and each entry's due or next review date; entries and examples remain readable aloud.
- Clicking a tag in the dialog closes it and filters the wall. Escape, the backdrop, and the close button dismiss the dialog; focus trapping, focus restore, and page scroll locking are shared with the quiz dialog.

## 1.13.1 — 2026-11-10

- Fixed model grading treating an unanswered question as correct. Only items with a non-empty learner answer are sent for model review or counted toward the score; unanswered items receive a local `blank` verdict with zero points.
- Unanswered items now display “未作答 / Not answered” instead of being shown as correct or as ordinary wrong answers, for both exact and model grading.
- Review scheduling skips blank items, so they remain due for the next quiz.

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
