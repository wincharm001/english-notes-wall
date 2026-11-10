# English Notes Wall

A DeepSeek Harness plugin for an English-learning sticky-note wall: words, phrases, collocations, sentence patterns, long-sentence analysis, spaced-repetition review, read-aloud, and a daily quiz.

- Plugin source and user guide: [`english-notes-wall/README.md`](english-notes-wall/README.md)
- Release history: [`CHANGELOG.md`](CHANGELOG.md)
- Publishing plan (npm + DSH market index): [`PUBLISHING.md`](PUBLISHING.md)

## Layout

```text
english-notes-wall/   the installable bundle (Host index.js, Client client.js, patch, locale, icon)
check-*.mjs           structural and locale checks
test-*.mjs            Host service, Client component, quiz, SRS, export/backup tests
```

## Development

```bash
node --check english-notes-wall/index.js
node --check english-notes-wall/client.js
for file in check-*.mjs test-*.mjs; do node "$file"; done
```

The plugin is installed into the `desktop` profile with a local `link:` while it is under development. Host changes require a full DeepSeek Harness restart; Client changes also need the plugin bundle to reload.

## Status

Version 1.15.0 adds previous/next arrows to the full-note dialog, so notes can be browsed in wall order without closing it. 1.14.0 adds a full-note dialog for reading every entry and expansion without expanding the card. 1.13.1 fixes model grading so unanswered questions score zero instead of being marked correct. 1.13.0 moves the daily quiz into a header-opened dialog with focus handling and preserved draft answers. 1.12.0 positions long-sentence analysis at the category layer: a “长难句分析” note analyzes its saved sentence, while word, phrase, collocation, and pattern notes keep ordinary examples.
