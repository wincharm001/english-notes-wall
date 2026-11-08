# English Notes Wall

A DeepSeek Harness bundle for building an English-learning sticky-note wall.

## What it does

- **Sticky-note wall** — every note stores its creation time and is shown oldest first, grouped by day. A note holds many entries, one per line; duplicate lines are removed and a Chinese meaning can follow `|` on each line. Every note collapses to a single summary line; one click opens the entries and their study cards together, and the chevron/entry-count badge collapses it again, so the wall stays compact. Each note carries a very light tint of its category color so it reads as a sticky note. The toolbar switches between a list layout and a rectangular grid layout.
- **Categories** — word, phrase, collocation, sentence pattern, sentence, and other, with filters, counts, tags, and search. The category sets the note's edge, tint, and label color: word green, phrase teal, collocation orange, sentence pattern blue, sentence violet, and other gray.
- **Collapsible surfaces** — the new-note form collapses to its title row; the right sidebar hides and returns from the page header; the toolbar closes every expanded study card at once. All three choices are remembered. The light theme adds a brand accent, stronger card borders, and a clearer title hierarchy so the wall keeps a focus.
- **Model expansion** — one click expands every entry of a note in a single model call (or one entry on demand) into meaning, phonetics, word forms (derivatives, same-root words, and look-alikes when useful), collocations, synonyms, word discrimination, long-sentence analysis (2-3 long complex sentences, each with a Chinese translation, a Chinese structure breakdown, a grammar analysis, and an extracted authentic chunk), optional extra long sentences, usage tips, and related expressions. Results are stored per entry; repeated forms, collocations, synonyms, and long sentences are removed across the note. Long sentences highlight a saved word or phrase literally; an entry containing a placeholder such as `sb.` or `sth.`, and every sentence pattern, highlights the whole frame (fillers included) by following the entry's words through the sentence after dropping the placeholders. The Chinese sentence highlights the saved meaning.
- **Fill missing expansions** — one toolbar button expands every note that still has an unexpanded entry, one note at a time, with a live progress counter. Complete notes are skipped.
- **Editing** — any saved note reopens in an inline editor for its entry lines, category, and tags. Expansions survive edits for entries whose text is unchanged; new lines start unexpanded.
- **Whole-wall organization** — the Organize button sends every note, with its meanings, collocations, and synonyms, to the model. The model returns topic groups, category fixes, and synonym/confusable relations. The plan is previewed first; applying it writes each note's topic, order, category, and topic tags, then the wall switches to a topic-grouped view that can be toggled back to the date view.
- **Expansion model settings** — choose the provider and model used for expansion and its thinking effort from the model catalog; follow the default session model when no override is set.
- **Token usage and cost** — a compact card shows the input, output, and total tokens of the last model call plus the cumulative totals and call count, covering expansion, quiz generation, model grading, and wall organization. It also breaks usage down by purpose and estimates cost from configurable input/output prices per 1M tokens and a currency label set in the settings card. The purpose breakdown starts with this version; earlier calls remain in the total. Each note also records the tokens of its own expansion.
- **Daily quiz** — at the configured local time the Host builds a quiz from the saved notes and their expansions. Question types mix Chinese → English, English → Chinese, cloze, collocation, and free-sentence use. A deterministic local set is used when no model is configured. A live countdown above the quiz shows the next publication (today or tomorrow), switches to “publishing soon” when the slot has passed, polls briefly for the new quiz, and reads “paused” when the daily quiz is disabled. The quiz card collapses to a one-line summary and remembers that choice.
- **Open answers and model grading** — translation and sentence-use items are marked open-ended; their reference answer is only one good answer. `Grade with model` checks open answers by meaning, returns per-item feedback, suggests a more natural expression, and adds related vocabulary. Fixed items (cloze, collocation) keep their exact answer.
- **Prompt settings** — the settings card edits the prompt templates for expansion, quiz generation, model grading, and whole-wall organization. Placeholders such as `{{note}}`, `{{count}}`, `{{notes}}`, `{{quiz}}`, and `{{answers}}` inject the current data; an empty field restores the default.
- **Agent tool** — `english_notes` lets the model add, list, update, expand, delete, generate, and grade through the same Host service the page uses, with `gradeModel` for model grading and `models` to inspect the catalog.

## Where data lives

`%DSH_HOME%/english-notes-wall/store.json` (normally `C:\Users\<you>\.dsh\english-notes-wall\store.json`).
Writes are atomic (temp file + rename); a corrupt file is backed up beside the original.

## Host service

The page talks to the Host through the authenticated unary RPC on the shared client connection:
`connection.rpc.call('/api', 'englishNotes/<method>', { args })`. The Host registers the
`englishNotes` service with the methods used in `index.js`: `snapshot`, `addNote`, `updateNote`,
`deleteNote`, `expandNote`, `generateQuiz`, `gradeQuiz`, `gradeWithModel`, `saveSettings`, and
`llmCatalog`. The page does not depend on the client Typert `$mount` path, so it still works
when that bridge is unavailable.

## Settings

The settings card controls the daily publication toggle, the local publication time, the number
of questions, and the expansion model: provider, model, and thinking effort. It also edits the
prompt templates for expansion, quiz generation, model grading, and the reserved organise action.
The token usage card reads the provider usage recorded for every model call — expansion, quiz
generation, model grading, and any later organise action — and labels the last call's purpose.

## Development

```bash
node --check index.js
node --check client.js
node ../test-host.mjs   # host service and tool behaviour
node ../check-locale.mjs
```
