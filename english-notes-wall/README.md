# English Notes Wall

A DeepSeek Harness bundle for building an English-learning sticky-note wall.

## What it does

- **Sticky-note wall** — every note stores its creation time and is shown oldest first, grouped by day. A note holds many entries, one per line; duplicate lines are removed and a Chinese meaning can follow `|` on each line. Every note collapses to a single summary line; one click opens the entries and their study cards together, and the chevron/entry-count badge collapses it again, so the wall stays compact. Each note carries a very light tint of its category color so it reads as a sticky note. Notes can be pinned to a top group, and dragged to set a manual order. The toolbar switches between a list layout and a rectangular grid layout.
- **Back to top** — once the wall is scrolled past about 320px, a floating “Back to top” button fades in at the bottom-right. It returns the wall to the top smoothly (instantly when reduced motion is requested), fades out near the top, and hides while the quiz or full-note dialog is open. `Home` performs the same jump when focus is not in a text field; on narrow screens the button collapses to a compact icon-only circle.
- **Daily IELTS essay** — the header “Today's essay” button opens a full-screen reader for one IELTS Academic Task 2 model essay per day. Twelve original band-7.5 essays ship with the plugin; the Host picks one deterministically from the local date and avoids repeating the last two weeks. The reader shows the task question, a think-first outline box, the essay, paragraph-by-paragraph Chinese translations, clickable sentence analyses (translation, structure, grammar, natural chunk), an outline, cohesive devices, six vocabulary cards, and three comprehension questions with explanations; each paragraph can be read aloud. Select any text in the essay to add it directly to the wall as a word, phrase, collocation, pattern, or long-sentence note; the category is inferred and can be changed before saving, and saved items join the existing SRS and daily quiz. With a model configured, “AI essay” regenerates today's essay, validates the JSON, caches it for the day, and records its token usage; the built-in essay remains available when the model fails or is not configured.
- **Full-note dialog** — the expand-corners button on every note opens a focused dialog with the complete note, regardless of the card's collapsed state: all entries and translations, every expansion (meaning, long-sentence analysis, examples, word forms, collocations, synonyms, tips, related), tags, and each entry's due or next review date. Entries are read aloud from the dialog, tags filter the wall, and Escape, the backdrop, or the close button dismiss it. The dialog and its backdrop take the note's category color, side arrows move to the previous or next note in the current wall order (wrapping at both ends), with a position counter, Left/Right keyboard keys, and a compact previous/next row on narrow screens.
- **Categories and filters** — word, phrase, collocation, sentence pattern, long-sentence analysis, and other, with category filters, counts, tags, search, study-status filters (due for review, not expanded, scheduled), and click-to-filter tags. A note filed as long-sentence analysis is a sentence the learner wants broken down, not a vocabulary example. The category sets the note's edge, tint, and label color: word green, phrase teal, collocation orange, sentence pattern blue, long-sentence analysis violet, and other gray.
- **Collapsible surfaces** — the new-note form collapses to its title row; the right sidebar hides and returns from the page header; the toolbar closes every expanded study card at once. All three choices are remembered. The light theme adds a brand accent, stronger card borders, and a clearer title hierarchy so the wall keeps a focus.
- **Model expansion** — one click expands every entry of a note. Word, phrase, collocation, and sentence-pattern entries get meaning, phonetics, word forms (derivatives, same-root words, and look-alikes when useful), collocations, synonyms, word discrimination, 2-3 natural example sentences with Chinese translations, optional structure/grammar notes, usage tips, and related expressions. An entry in the long-sentence analysis category is treated as the target sentence: the expansion returns its Chinese translation, structure breakdown, grammar analysis, and an extracted authentic chunk instead of inventing a new example, and may add a few extra long sentences. Requests are split into chunks of two entries, retried once on a bad response, and saved partially when one chunk fails, so a long multi-entry response cannot lose the whole note. Results are stored per entry; repeated forms, collocations, synonyms, and examples are removed across the note. Examples highlight a saved word or phrase literally; an entry containing a placeholder such as `sb.` or `sth.`, and every sentence pattern, highlights the whole frame (fillers included) by following the entry's words through the sentence after dropping the placeholders. The Chinese sentence highlights the saved meaning.
- **Practice mode and read-aloud** — each expansion can hide its Chinese translation and analysis behind “Practice mode”, so the learner can parse the long sentence first and reveal the breakdown afterwards. A speaker button reads entries, long sentences, and extra sentences aloud with the browser speech engine; dictation quiz items play the hidden word or phrase.
- **Fill missing expansions** — one toolbar button expands every note that still has an unexpanded entry, two notes at a time, with a live progress counter, a stop button, and a retry list for failures. Complete notes are skipped.
- **Spaced repetition** — every entry keeps a review state (level, due time, seen/correct counts). New entries start due; a correct answer moves the entry up a Leitner ladder (1, 3, 7, 15, 30, 60 days) and a wrong fixed answer resets it and makes it due again in ten minutes. The daily quiz draws due and most-overdue entries first, and the quiz dialog plus the overview card show the due count. Model grading also updates the review state.
- **Editing** — any saved note reopens in an inline editor for its entry lines, category, and tags. Expansions survive edits for entries whose text is unchanged; new lines start unexpanded.
- **Whole-wall organization** — the Organize button sends every note, with its meanings, collocations, and synonyms, to the model. The model returns topic groups, category fixes, and synonym/confusable relations. The plan is previewed first; applying it writes each note's topic, order, category, and topic tags, then the wall switches to a topic-grouped view that can be toggled back to the date view.
- **Expansion model settings** — choose the provider and model used for expansion and its thinking effort from the model catalog; follow the default session model when no override is set.
- **Token usage and cost** — a compact card shows the input, output, and total tokens of the last model call plus the cumulative totals and call count, covering expansion, quiz generation, model grading, and wall organization. It also breaks usage down by purpose and estimates cost from configurable input/output prices per 1M tokens and a currency label set in the settings card. Each note also records the tokens of its own expansion.
- **Data and backup** — the settings card exports the wall as JSON (notes, review state, and organization), CSV, or Anki-ready TSV, imports a JSON export with entry-level deduplication, and creates a manual backup. Every write also keeps one automatic snapshot per day in `backups/`, retaining the last seven days.
- **Daily quiz dialog** — the header quiz button (with an unread dot) opens the daily quiz in a focused modal instead of the right sidebar. At the configured local time the Host builds a quiz from due entries first. Question types mix Chinese → English, English → Chinese, cloze, collocation, sentence translation, dictation, and free-sentence use. A deterministic local set is used when no model is configured. A live countdown shows the next publication (today or tomorrow), switches to “publishing soon” when the slot has passed, polls briefly for the new quiz, and reads “paused” when the daily quiz is disabled. The modal keeps draft answers when it is closed, traps focus, closes on Escape or a backdrop click, and restores page scrolling afterwards.
- **Open answers and model grading** — translation, long-sentence, and sentence-use items are marked open-ended; their reference answer is only one good answer. `Grade with model` checks open answers by meaning, returns per-item feedback, suggests a more natural expression, and adds related vocabulary. Fixed items (cloze, collocation, dictation) keep their exact answer.
- **Keyboard and undo** — `/` focuses search, `n` opens the composer, `j`/`k` moves through the visible notes, `Home` returns to the top, `Esc` clears, and `Ctrl/Cmd + Enter` saves. Deleting a note leaves a twelve-second undo bar.
- **Prompt settings** — the settings card edits the prompt templates for expansion, quiz generation, model grading, and whole-wall organization. Placeholders such as `{{note}}`, `{{count}}`, `{{notes}}`, `{{quiz}}`, and `{{answers}}` inject the current data; an empty field restores the default.
- **Agent tool** — `english_notes` lets the model add, list, update, expand, delete, generate, and grade through the same Host service the page uses, with `gradeModel` for model grading and `models` to inspect the catalog.

## Where data lives

`%DSH_HOME%/english-notes-wall/store.json` (normally `C:\Users\<you>\.dsh\english-notes-wall\store.json`).
Writes are atomic (temp file + rename); a corrupt file is backed up beside the original.
Automatic daily snapshots and manual backups live in `%DSH_HOME%/english-notes-wall/backups/`.
The twelve built-in essays live in the bundle at `essays/ielts/`; the selected day, AI-generated
essay text, and reading progress are stored under `essays` in `store.json` and kept in backups.

## Host service

The page talks to the Host through the authenticated unary RPC on the shared client connection:
`connection.rpc.call('/api', 'englishNotes/<method>', { args })`. The Host registers the
`englishNotes` service with the methods used in `index.js`: `snapshot`, `addNote`, `updateNote`,
`deleteNote`, `restoreNote`, `reorderNotes`, `expandNote`, `cancelExpansion`, `generateQuiz`,
`gradeQuiz`, `gradeWithModel`, `essayToday`, `essayGenerate`, `essayProgress`, `saveSettings`,
`llmCatalog`, `exportData`, `importData`, and `backupNow`. The page does not depend on the client Typert `$mount` path, so it still works
when that bridge is unavailable.

## Settings

The settings card controls the daily publication toggle, the local publication time, the number
of questions, and the expansion model: provider, model, and thinking effort. It also edits the
prompt templates for expansion, quiz generation, model grading, and the reserved organise action,
and hosts the JSON/CSV/Anki export, JSON import, and backup controls. The token usage card reads the
provider usage recorded for every model call — expansion, quiz generation, model grading, essay
generation, and any organise action — and labels the last call's purpose.

## Development

```bash
node --check index.js
node --check client.js
node ../test-host.mjs       # host service, SRS, expansion chunks, export/import/backup
node ../test-note-card.mjs  # collapsed notes, practice mode, read-aloud, pin/tag controls
node ../test-back-to-top.mjs # floating back-to-top control and reduced-motion scrolling
node ../test-note-detail.mjs # full-content dialog and its read-only rendering
node ../test-essay-reader.mjs # daily IELTS reader, annotations, vocabulary, and selection helpers
node ../test-note-nav.mjs    # previous/next navigation between notes inside the dialog
node ../test-quiz-modal.mjs # quiz dialog open/close state and preserved draft answers
node ../check-locale.mjs
node ../check-balance.mjs
node ../check-layout.mjs
```

Publishing notes are in [`../PUBLISHING.md`](../PUBLISHING.md).
