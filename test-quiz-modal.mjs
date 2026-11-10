// The daily quiz lives in a modal, stays mounted when closed, and exposes a
// close control in its header.
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
assert.equal(typeof exports.__QuizModal, 'function')
assert.equal(typeof exports.__QuizCard, 'function')

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
const quiz = {
  date: '2026-11-09',
  source: 'local',
  createdAt: Date.now(),
  items: [{
    id: 'q1',
    type: 'cloze',
    prompt: 'She ____ to school every day.',
    answer: 'goes',
    hint: '',
    explanation: '',
    open: false,
  }],
}
let closed = 0
const props = {
  t,
  localeId: 'en-US',
  quiz,
  history: [],
  busy: '',
  modelAvailable: true,
  settings: { enabled: true, dailyCount: 5 },
  nextQuizAt: Date.now() + 3600_000,
  quizPending: false,
  dueCount: 2,
  onRefresh: () => {},
  onGenerate: () => {},
  onGrade: () => {},
  onModelGrade: () => {},
}

slots = []
cursor = 0
let tree = renderTree(exports.__QuizModal({ ...props, open: true, onClose: () => { closed += 1 } }))
assert.equal(collect(tree, 'enw-modal-backdrop').length, 1)
assert.equal(collect(tree, 'enw-modal-backdrop--closed').length, 0, 'open modal is visible')
assert.equal(collect(tree, 'enw-quiz-list').length, 1, 'modal quiz starts expanded')
assert.equal(collect(tree, 'enw-modal-close').length, 1, 'modal has a close button')
assert.match(flatten(tree), /quiz\.title/)
collect(tree, 'enw-modal-close')[0].props.onClick()
assert.equal(closed, 1, 'close button calls the handler')

slots = []
cursor = 0
tree = renderTree(exports.__QuizModal({ ...props, open: false, onClose: () => { closed += 1 } }))
assert.equal(collect(tree, 'enw-modal-backdrop--closed').length, 1, 'closed modal is hidden')
assert.equal(collect(tree, 'enw-quiz-list').length, 1, 'quiz stays mounted so answers survive closing')
assert.equal(collect(tree, 'enw-modal-close').length, 1)

slots = []
cursor = 0
tree = renderTree(exports.__QuizModal({ ...props, quiz: null, open: true, onClose: () => {} }))
assert.equal(collect(tree, 'enw-aside-empty-title').length, 1, 'empty quiz state is available in the modal')
assert.match(flatten(tree), /quiz\.generate/)

slots = []
cursor = 0
tree = renderTree(exports.__QuizModal({ ...props, open: true, error: 'generation failed', onClose: () => {} }))
assert.equal(collect(tree, 'enw-modal-error').length, 1)
assert.match(flatten(tree), /generation failed/)

const blankQuiz = {
  ...quiz,
  attempt: {
    mode: 'model',
    answers: {},
    feedback: {
      q1: { verdict: 'blank', score: 0, feedback: '未作答，按 0 分计。', better: '', related: [] },
    },
    score: 0,
    total: 1,
    summary: '',
  },
}
slots = []
cursor = 0
tree = renderTree(exports.__QuizModal({ ...props, quiz: blankQuiz, open: true, onClose: () => {} }))
assert.match(flatten(tree), /quiz\.notAnswered/, 'an unanswered model-graded item is labelled as blank')
assert.equal(collect(tree, 'enw-quiz-verdict--blank').length, 1)

assert.match(source, /\.enw-modal-backdrop \{ position: fixed;/)
assert.match(source, /\.enw-modal-backdrop--closed \{ display: none; \}/)

console.log('quiz modal tests passed')
