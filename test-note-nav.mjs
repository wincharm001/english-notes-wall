// The full-content dialog can move to the previous and next note on the wall.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
let factory = null
const listeners = []
const documentMock = {
  body: { style: {} },
  activeElement: null,
  addEventListener(type, handler, options) {
    listeners.push({ type, handler, capture: options === true })
  },
  removeEventListener() {},
  querySelectorAll: () => [],
}
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(definition) {
        factory = definition.factory
      },
    },
  },
  document: documentMock,
  setTimeout,
  clearTimeout,
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
  useEffect: callback => {
    callback()
  },
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

const t = key => key
const note = {
  id: 'note-nav',
  category: 'word',
  createdAt: Date.now(),
  entries: [
    { id: 'n1', text: 'resilient', translation: '有韧性的', expansion: { meaning: 'able to recover quickly' } },
  ],
}

const render = (props = {}) => {
  slots = []
  cursor = 0
  return renderTree(exports.__NoteDetailModal({
    note,
    t,
    localeId: 'zh-CN',
    position: 2,
    total: 3,
    onPrev: () => {},
    onNext: () => {},
    onClose: () => {},
    ...props,
  }))
}

// Both side arrows and the narrow-screen footer expose previous/next.
const calls = []
let tree = render({
  onPrev: () => calls.push('prev'),
  onNext: () => calls.push('next'),
})
assert.equal(collect(tree, 'enw-note-modal-shell').length, 1)
const shell = collect(tree, 'enw-note-modal-shell')[0]
assert.equal(shell.props.role, 'dialog')
assert.equal(shell.props['aria-modal'], 'true')
assert.equal(collect(tree, 'enw-note-backdrop').length, 1, 'the note backdrop is tinted separately from the quiz backdrop')
assert.equal(collect(tree, 'enw-note--word').length, 1, 'the dialog backdrop carries the note category tone')
assert.equal(collect(tree, 'enw-note-nav').length, 2, 'one arrow on each side')
assert.equal(collect(shell, 'enw-note-nav').length, 2, 'arrows belong to the dialog')
assert.equal(collect(tree, 'enw-note-foot-btn').length, 2, 'touch-friendly footer fallback')
assert.equal(collect(tree, 'enw-note-modal-pos').length, 1)
assert.equal(collect(tree, 'enw-note-foot-pos').length, 1)
assert.match(flatten(tree), /2 \/ 3/)

collect(tree, 'enw-note-nav')[0].props.onClick()
collect(tree, 'enw-note-nav')[1].props.onClick()
assert.deepEqual(calls, ['prev', 'next'])

calls.length = 0
collect(tree, 'enw-note-foot-btn')[0].props.onClick()
collect(tree, 'enw-note-foot-btn')[1].props.onClick()
assert.deepEqual(calls, ['prev', 'next'])

// Keyboard arrows move through the notes too.
const keyHandlers = listeners.filter(item => item.type === 'keydown' && item.capture !== true)
assert.equal(keyHandlers.length, 1, 'one dialog-level arrow handler')
const press = key => {
  let prevented = false
  keyHandlers[0].handler({
    key,
    target: { tagName: 'BUTTON' },
    preventDefault: () => { prevented = true },
  })
  return prevented
}
calls.length = 0
assert.equal(press('ArrowLeft'), true)
assert.equal(press('ArrowRight'), true)
assert.deepEqual(calls, ['prev', 'next'])

// A lone note has nothing to move to.
listeners.length = 0
calls.length = 0
tree = render({ position: 1, total: 1 })
assert.equal(collect(tree, 'enw-note-nav').length, 0)
assert.equal(collect(tree, 'enw-note-footnav').length, 0)
assert.doesNotMatch(flatten(tree), /1 \/ 1/)
assert.equal(listeners.filter(item => item.type === 'keydown' && item.capture !== true).length, 0)

// The backdrop tone follows the note's category, including while navigating.
tree = render({ note: { ...note, category: 'sentence' }, position: 1, total: 1 })
assert.equal(collect(tree, 'enw-note--word').length, 0)
assert.equal(collect(tree, 'enw-note--sentence').length, 1)

// Navigation wraps around the ends of the wall order.
assert.equal(exports.__wrapIndex(0, -1, 5), 4)
assert.equal(exports.__wrapIndex(4, 1, 5), 0)
assert.equal(exports.__wrapIndex(2, 1, 1), 0)
assert.equal(exports.__wrapIndex(-1, 1, 5), -1)
assert.equal(exports.__wrapIndex(0, 1, 0), -1)

console.log('note navigation tests passed')
