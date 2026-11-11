// The IELTS essay reader renders the daily model essay and its study layers.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
const essay = JSON.parse(fs.readFileSync(new URL('./english-notes-wall/essays/ielts/01-education-employment.json', import.meta.url), 'utf8'))
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
  Fragment: Symbol('Fragment'),
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

const findAll = (node, predicate, out = []) => {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const item of node) findAll(item, predicate, out)
    return out
  }
  if (predicate(node)) out.push(node)
  findAll(node.children, predicate, out)
  return out
}

const t = key => key
const render = (data, props = {}) => {
  slots = []
  cursor = 0
  return renderTree(exports.__EssayReader({
    data,
    phase: data ? 'ready' : 'loading',
    error: '',
    busy: '',
    modelAvailable: false,
    t,
    localeId: 'zh-CN',
    onClose: () => {},
    onRetry: () => {},
    onGenerate: () => {},
    onSaveProgress: () => {},
    onAdd: async () => ({ status: 'ok' }),
    ...props,
  }))
}

// Helpers used by the selection-to-note workflow.
assert.equal(exports.__essaySentences('One. Two! Three?').join('|'), 'One.|Two!|Three?')
assert.equal(exports.__essayInferCategory('resilient'), 'word')
assert.equal(exports.__essayInferCategory('give up'), 'phrase')
assert.equal(exports.__essayInferCategory('take into account'), 'phrase')
assert.equal(exports.__essayInferCategory('a significant number of young people'), 'collocation')
assert.equal(exports.__essayInferCategory('Although the storm had passed, the harbor remained closed.'), 'sentence')
assert.equal(exports.__essayLookup(essay, essay.annotations[0].sentence).translation, essay.annotations[0].zh)
assert.equal(exports.__essayLookup(essay, essay.vocab[0].term).translation, essay.vocab[0].meaning)
assert.equal(Object.keys(exports.__essayLookup(essay, 'not in the essay')).length, 0)

const progress = {
  answers: {},
  completedAt: 0,
  outline: '',
  savedWords: 0,
  savedSentences: 0,
}
const data = { date: '2026-11-11', essay, progress, source: 'builtin', createdAt: 1 }
let closed = 0
let generated = 0
const saved = []
let tree = render(data, {
  onClose: () => { closed += 1 },
  onGenerate: () => { generated += 1 },
  onSaveProgress: patch => saved.push(patch),
})

assert.equal(collect(tree, 'enw-essay-view').length, 1)
assert.match(flatten(tree), /Skills or Scholarship/)
assert.match(flatten(tree), /Universities are frequently judged/)
assert.match(flatten(tree), /essay\.annotationHint/)
assert.equal(collect(tree, 'enw-essay-sentence--note').length, 4, 'annotated sentences are clickable')
assert.equal(collect(tree, 'enw-essay-vocab-card').length, 6)
assert.equal(collect(tree, 'enw-essay-question').length, 3)
assert.equal(collect(tree, 'enw-essay-option').length, 12)
assert.equal(collect(tree, 'enw-speak').length, 4, 'each paragraph can be read aloud')
assert.equal(collect(tree, 'enw-essay-rail').length, 1)
assert.match(flatten(tree), /297 essay\.words/)
assert.match(flatten(tree), /essay\.band 7\.5/)
assert.match(flatten(tree), /essay\.outlineTitle/)

// Back and close dismiss the reader.
findAll(tree, node => node.props?.title === 'essay.back')[0].props.onClick()
assert.equal(closed, 1)
findAll(tree, node => node.props?.title === 'action.close')[0].props.onClick()
assert.equal(closed, 2)

// Answering a question records the answer and the local choice.
saved.length = 0
collect(tree, 'enw-essay-option')[0].props.onClick()
assert.equal(JSON.stringify(saved[0].answers), JSON.stringify({ 0: 0 }))

// Completing the reading is a progress write, not a note write.
saved.length = 0
findAll(tree, node => flatten(node) === 'essay.complete' && node.type === 'button')[0].props.onClick()
assert.equal(JSON.stringify(saved[0]), JSON.stringify({ completed: true }))

// AI generation is offered only when a model is available.
assert.equal(findAll(tree, node => node.props?.title === 'essay.aiHint').length, 0)
tree = render(data, { modelAvailable: true, onGenerate: () => { generated += 1 } })
findAll(tree, node => node.props?.title === 'essay.aiHint')[0].props.onClick()
assert.equal(generated, 1)

// Loading and error states keep a way out.
tree = render(null)
assert.match(flatten(tree), /essay\.loading/)
assert.equal(findAll(tree, node => node.props?.title === 'essay.back').length, 1)

tree = render(null, { phase: 'error', error: 'boom' })
assert.match(flatten(tree), /boom/)
assert.match(flatten(tree), /common\.retry/)

console.log('essay reader tests passed')
