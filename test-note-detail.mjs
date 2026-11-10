// A note's full content opens in a modal, independent of the card's collapsed state.
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
assert.equal(typeof exports.__NoteDetailModal, 'function')
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

const t = key => key
const note = {
  id: 'note-detail',
  category: 'sentence',
  createdAt: Date.now(),
  pinned: true,
  tags: ['长难句', '复习'],
  entries: [
    {
      id: 'e1',
      text: 'Although the storm had passed, the harbor remained closed.',
      translation: '尽管风暴已经过去，港口仍然关闭。',
      review: { level: 2, dueAt: Date.now() + 3 * 86400000 },
      expansion: {
        analysis: {
          zh: '尽管风暴已经过去，港口仍然关闭。',
          structure: 'Although 引导让步状语从句，主句为 the harbor remained closed。',
          grammar: '过去完成时表示先于过去的动作。',
          chunk: 'remain closed',
          chunkNote: '保持关闭',
        },
        examples: [{ en: 'The road remained closed for hours.', zh: '道路关闭了几个小时。' }],
        tips: 'remain 后接形容词表示状态。',
      },
    },
    {
      id: 'e2',
      text: 'What matters is how consistently you practise.',
      translation: '重要的是你练习得有多稳定。',
      review: { level: 0, dueAt: Date.now() - 60_000 },
    },
  ],
}

let closed = 0
let tagged = ''
slots = []
cursor = 0
let tree = renderTree(exports.__NoteDetailModal({
  note,
  t,
  localeId: 'zh-CN',
  onClose: () => { closed += 1 },
  onTag: tag => { tagged = tag },
}))

assert.equal(collect(tree, 'enw-note-modal').length, 1)
assert.equal(flatten(tree).includes('category.sentence'), true)
assert.match(flatten(tree), /Although the storm had passed/)
assert.match(flatten(tree), /What matters is how consistently you practise/)
assert.match(flatten(tree), /Although 引导让步状语从句/)
assert.match(flatten(tree), /remain closed/)
assert.match(flatten(tree), /#长难句/)
assert.match(flatten(tree), /#复习/)
assert.match(flatten(tree), /note\.nextReview/)
assert.match(flatten(tree), /filter\.due/)
assert.equal(collect(tree, 'enw-note-modal-entry').length, 2)
assert.equal(collect(tree, 'enw-speak').length, 3, 'entries and the expansion example are readable')
assert.equal(findByTitle(tree, 'action.close').length, 1)
findByTitle(tree, 'action.close')[0].props.onClick()
assert.equal(closed, 1)

collect(tree, 'enw-tag--button')[0].props.onClick()
assert.equal(tagged, '长难句')
assert.equal(closed, 2, 'tag selection also closes the modal')

// The card exposes a full-content button that opens the detail view.
let opened = null
const cardProps = {
  note,
  t,
  localeId: 'en-US',
  busy: '',
  collapseSignal: 0,
  onExpandAll: () => {},
  onExpandEntry: () => {},
  onUpdate: async () => ({ status: 'ok' }),
  onDelete: () => {},
  onOpen: target => { opened = target },
}
slots = []
cursor = 0
tree = renderTree(exports.__NoteCard(cardProps))
assert.equal(findByTitle(tree, 'note.fullView').length, 1)
findByTitle(tree, 'note.fullView')[0].props.onClick()
assert.equal(opened?.id, note.id)

console.log('note detail tests passed')
