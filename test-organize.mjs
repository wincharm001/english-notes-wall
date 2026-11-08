// Organize plan panel smoke test: renders groups, category changes, and relations.
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
assert.equal(typeof exports.__OrganizePanel, 'function')

const flatten = node => {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join(' ')
  return flatten(node.children)
}

const notes = [
  { id: 'n1', category: 'word', entries: [{ text: 'meticulous', translation: '一丝不苟的' }] },
  { id: 'n2', category: 'collocation', entries: [{ text: 'fair deal', translation: '公平交易' }] },
]
const plan = {
  summary: '按主题整理',
  groups: [
    { title: '品质与态度', summary: '描述做事风格', tags: ['形容词'], noteIds: ['n1'] },
    { title: '交易与谈判', summary: '商务表达', tags: ['商务'], noteIds: ['n2'] },
  ],
  categories: [{ noteId: 'n1', category: 'phrase' }],
  relations: [{ noteIds: ['n1', 'n2'], kind: 'synonym', note: '可以一起记' }],
}

const t = key => key
const render = (value, busy = '') => {
  slots = []
  cursor = 0
  return flatten(exports.__OrganizePanel({
    plan: value,
    notes,
    t,
    localeId: 'zh-CN',
    busy,
    onApply: () => {},
    onClose: () => {},
  }))
}

const text = render(plan)
assert.match(text, /organize\.title/)
assert.match(text, /品质与态度/)
assert.match(text, /交易与谈判/)
assert.match(text, /meticulous · 一丝不苟的/)
assert.match(text, /category\.word/)
assert.match(text, /category\.phrase/)
assert.match(text, /organize\.relation\.synonym/)
assert.match(text, /可以一起记/)
assert.match(text, /organize\.apply/)
assert.match(render(plan, 'organize-apply'), /organize\.apply/)
assert.match(render({ ...plan, groups: [] }), /organize\.emptyPlan/)

console.log('organize panel tests passed')
