// Multi-entry note cards collapse to one summary line and expand on demand.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
let factory = null
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(definition) {
        factory = definition.factory
      },
    },
  },
  console,
  __ENW_TEST__: true,
}
vm.createContext(sandbox)
vm.runInContext(source, sandbox)
assert.equal(typeof factory, 'function', 'module loader factory registered')

let slots = []
let cursor = 0
const React = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useState(initial) {
    const at = cursor
    cursor += 1
    if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial
    return [slots[at], next => {
      slots[at] = typeof next === 'function' ? next(slots[at]) : next
    }]
  },
  useEffect: () => {},
  useMemo: callback => callback(),
  useRef: value => ({ current: value }),
  useSyncExternalStore: (subscribe, get) => get(),
}
const exports = factory(name => {
  if (name === 'react') return React
  throw new Error(`unexpected require: ${name}`)
})
assert.equal(typeof exports.__NoteCard, 'function')

const flatten = node => {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join(' ')
  return flatten(node.children)
}

const collect = (node, className, out = []) => {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const item of node) collect(item, className, out)
    return out
  }
  const classes = String(node.props?.className ?? '').split(/\s+/)
  if (classes.includes(className)) out.push(node)
  collect(node.children, className, out)
  return out
}

const renderTree = node => {
  if (!node || typeof node !== 'object') return node
  if (Array.isArray(node)) return node.map(renderTree)
  if (typeof node.type === 'function') {
    const props = { ...(node.props || {}) }
    if (!('children' in props) && node.children?.length) {
      props.children = node.children.length === 1 ? node.children[0] : node.children
    }
    return renderTree(node.type(props))
  }
  return { ...node, children: renderTree(node.children) }
}

const t = key => key
const baseProps = note => ({
  note,
  t,
  localeId: 'en-US',
  busy: '',
  autoOpenEntries: {},
  collapseSignal: 0,
  onExpandAll: () => {},
  onExpandEntry: () => {},
  onUpdate: async () => ({ status: 'ok' }),
  onDelete: () => {},
  onPin: () => {},
  onTag: () => {},
})

const multi = {
  id: 'note-1',
  category: 'word',
  createdAt: Date.now(),
  tags: ['tag-one'],
  entries: [
    { id: 'e1', text: 'alpha', translation: '阿尔法' },
    { id: 'e2', text: 'beta', translation: '贝塔' },
  ],
}

slots = []
cursor = 0
let tree = exports.__NoteCard(baseProps(multi))
assert.equal(collect(tree, 'enw-note-summary').length, 1, 'multi-entry note starts as one summary line')
assert.equal(collect(tree, 'enw-entry').length, 0, 'entries are hidden while collapsed')
assert.match(flatten(tree), /alpha · beta/)
assert.doesNotMatch(flatten(tree), /tag-one/)

collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = exports.__NoteCard(baseProps(multi))
assert.equal(collect(tree, 'enw-note-summary').length, 0, 'summary disappears after expanding')
assert.equal(collect(tree, 'enw-entry').length, 2, 'both entries render after expanding')
assert.match(flatten(tree), /alpha/)
assert.match(flatten(tree), /beta/)
assert.match(flatten(tree), /tag-one/)

collect(tree, 'enw-note-flag--toggle')[0].props.onClick()
cursor = 0
tree = exports.__NoteCard(baseProps(multi))
assert.equal(collect(tree, 'enw-note-summary').length, 1, 'the header toggle collapses the note again')

const single = {
  id: 'note-2',
  category: 'phrase',
  createdAt: Date.now(),
  tags: [],
  entries: [{ id: 'e3', text: 'gamma', translation: '伽马' }],
}
slots = []
cursor = 0
tree = exports.__NoteCard(baseProps(single))
assert.equal(collect(tree, 'enw-note-summary').length, 1, 'single-entry notes also start on one summary line')
assert.equal(collect(tree, 'enw-entry').length, 0)
assert.match(flatten(tree), /gamma/)
collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = exports.__NoteCard(baseProps(single))
assert.equal(collect(tree, 'enw-note-summary').length, 0)
assert.equal(collect(tree, 'enw-entry').length, 1)
assert.match(flatten(tree), /伽马/)
collect(tree, 'enw-note-flag--toggle')[0].props.onClick()
cursor = 0
tree = exports.__NoteCard(baseProps(single))
assert.equal(collect(tree, 'enw-note-summary').length, 1, 'a single-entry note collapses again from the header')

const rich = {
  id: 'note-rich',
  category: 'word',
  createdAt: Date.now(),
  tags: [],
  entries: [{
    id: 'e4',
    text: 'meticulous',
    translation: '一丝不苟的',
    expansion: {
      meaning: '一丝不苟的',
      phonetic: '/məˈtɪkjələs/',
      wordForms: [
        { kind: 'derivative', word: 'meticulously', note: '副词' },
        { kind: 'similar', word: 'ridiculous', note: '形近但意思不同' },
      ],
      discrimination: '与 careful 的区别：强调对细节极度关注。',
      collocations: ['meticulous attention'],
      examples: [{
        en: 'She is meticulous about details.',
        zh: '她对细节一丝不苟。',
        structure: '主句：She is meticulous；about details 作状语。',
        grammar: '主系表结构',
        chunk: 'be meticulous about',
        chunkNote: '对……一丝不苟',
      }],
      moreExamples: [{ en: 'His meticulous notes helped.', zh: '他细致的笔记很有帮助。' }],
      generatedAt: Date.now(),
    },
  }],
}
slots = []
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(rich)))
assert.equal(collect(tree, 'enw-note-summary').length, 1)
collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(rich)))
assert.equal(collect(tree, 'enw-exp-body').length, 1, 'the expansion body is open after the first click')
const richText = flatten(tree)
assert.match(richText, /expansion\.wordForms/)
assert.match(richText, /expansion\.examples/)
assert.doesNotMatch(richText, /expansion\.longSentences/)
assert.match(richText, /expansion\.form\.derivative/)
assert.match(richText, /expansion\.discrimination/)
assert.match(richText, /expansion\.structure/)
assert.match(richText, /主句：She is meticulous/)
assert.match(richText, /expansion\.chunk/)
assert.match(richText, /be meticulous about/)
assert.match(richText, /expansion\.grammar/)
assert.match(richText, /expansion\.moreShortExamples/)
assert.match(richText, /His\s+meticulous\s+notes helped\./)

// Speech buttons are available for the entry and each example.
assert.ok(collect(tree, 'enw-speak').length >= 2, 'entry and example offer read-aloud buttons')

// The long-sentence heading belongs to the category, not to the example data.
const sentenceNote = {
  ...rich,
  id: 'note-sentence',
  category: 'sentence',
}
slots = []
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(sentenceNote)))
collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(sentenceNote)))
const sentenceText = flatten(tree)
assert.match(sentenceText, /expansion\.longSentences/)
assert.doesNotMatch(sentenceText, /expansion\.examples/)

// A sentence-category expansion with a dedicated analysis renders the breakdown
// instead of repeating the sentence as an example.
const analysisNote = {
  id: 'note-analysis',
  category: 'sentence',
  createdAt: Date.now(),
  tags: [],
  entries: [{
    id: 'e5',
    text: 'Although the storm had passed, the harbor remained closed.',
    translation: '尽管风暴已经过去，港口仍然关闭。',
    expansion: {
      generatedAt: Date.now(),
      analysis: {
        zh: '尽管风暴已经过去，港口仍然关闭。',
        structure: 'Although 引导让步状语从句，主句为 the harbor remained closed。',
        grammar: '过去完成时表示先于过去的动作。',
        chunk: 'remain closed',
        chunkNote: '保持关闭',
      },
    },
  }],
}
slots = []
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(analysisNote)))
collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(analysisNote)))
const analysisText = flatten(tree)
assert.match(analysisText, /expansion\.longSentences/)
assert.match(analysisText, /Although 引导让步状语从句/)
assert.match(analysisText, /过去完成时表示先于过去的动作/)
assert.match(analysisText, /remain closed/)
assert.doesNotMatch(analysisText, /expansion\.examples/)

// Practice mode hides the translation and the structural analysis, then reveals them.
collect(tree, 'enw-practice-btn')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(rich)))
let practiceText = flatten(tree)
assert.doesNotMatch(practiceText, /她对细节一丝不苟/)
assert.doesNotMatch(practiceText, /主句：She is meticulous/)
assert.doesNotMatch(practiceText, /be meticulous about/)
assert.match(practiceText, /action\.practice/)
collect(tree, 'enw-practice-reveal')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(baseProps(rich)))
practiceText = flatten(tree)
assert.match(practiceText, /她对细节一丝不苟/)
assert.match(practiceText, /主句：She is meticulous/)

// Pin and tag controls call back with the note and tag.
let pinned = null
let tagged = null
const interactive = baseProps({ ...rich, tags: ['tag-one'] })
interactive.onPin = note => { pinned = note }
interactive.onTag = tag => { tagged = tag }
cursor = 0
tree = renderTree(exports.__NoteCard(interactive))
const findByTitle = (node, title, out = []) => {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const item of node) findByTitle(item, title, out)
    return out
  }
  if (node.props?.title === title) out.push(node)
  findByTitle(node.children, title, out)
  return out
}
findByTitle(tree, 'action.pin')[0].props.onClick()
assert.equal(pinned?.id, rich.id)
collect(tree, 'enw-tag--button')[0].props.onClick()
assert.equal(tagged, 'tag-one')

// Delete lives inside the editor, not in the card header.
let deletedNote = null
const editable = baseProps({ ...multi, tags: ['tag-one'] })
editable.onDelete = note => { deletedNote = note }
slots = []
cursor = 0
tree = renderTree(exports.__NoteCard(editable))
collect(tree, 'enw-note-summary')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(editable))
assert.equal(findByTitle(tree, 'action.delete').length, 0, 'no delete button in the header')
findByTitle(tree, 'action.edit')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(editable))
assert.equal(findByTitle(tree, 'action.delete').length, 1, 'the editor contains the delete button')
findByTitle(tree, 'action.delete')[0].props.onClick()
cursor = 0
tree = renderTree(exports.__NoteCard(editable))
assert.match(flatten(tree), /action\.confirmDelete/, 'deleting from the editor asks for confirmation')
assert.equal(collect(tree, 'enw-confirm--editor').length, 1)

// The drag handle only appears when reordering is allowed.
assert.equal(collect(tree, 'enw-drag-handle').length, 0)
cursor = 0
tree = renderTree(exports.__NoteCard({
  ...baseProps(multi),
  canReorder: true,
  onDragStartNote: () => {},
  onDropNote: () => {},
}))
assert.equal(collect(tree, 'enw-drag-handle').length, 1)

console.log('note card tests passed')
