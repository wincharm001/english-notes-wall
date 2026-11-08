// Token cost card: totals, per-purpose breakdown, and the no-price hint.
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
assert.equal(typeof exports.__UsageCard, 'function')

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
  if (String(node.props?.className ?? '').split(/\s+/).includes(className)) out.push(node)
  collect(node.children, className, out)
  return out
}

const t = key => key
const usage = {
  total: { input: 1_000_000, output: 500_000, total: 1_500_000, calls: 3 },
  last: {
    input: 1000,
    output: 200,
    total: 1200,
    reported: true,
    at: Date.now(),
    model: 'fake/fake-1',
    reasoningEffort: 'high',
    purpose: 'expansion',
  },
  purposes: {
    expansion: { input: 300_000, output: 100_000, total: 400_000, calls: 2 },
    quiz: { input: 700_000, output: 400_000, total: 1_100_000, calls: 1 },
    grading: { input: 0, output: 0, total: 0, calls: 0 },
    organize: { input: 0, output: 0, total: 0, calls: 0 },
  },
}

const render = (settings, initial = []) => {
  slots = initial
  cursor = 0
  return exports.__UsageCard({ usage, settings, t, localeId: 'en-US' })
}

let tree = render({ priceInput: 2, priceOutput: 8, currency: '¥' })
assert.match(flatten(tree), /¥6\.00/, '1M input at 2 plus 0.5M output at 8')
assert.match(flatten(tree), /usage\.breakdown/)
assert.equal(collect(tree, 'enw-usage-purpose-row').length, 0, 'breakdown starts closed')

collect(tree, 'enw-link-btn')[0].props.onClick()
cursor = 0
tree = exports.__UsageCard({ usage, settings: { priceInput: 2, priceOutput: 8, currency: '¥' }, t, localeId: 'en-US' })
assert.equal(collect(tree, 'enw-usage-purpose-row').length, 2)
assert.match(flatten(tree), /¥1\.40/)
assert.match(flatten(tree), /¥4\.60/)

slots = []
cursor = 0
tree = exports.__UsageCard({ usage, settings: { priceInput: 0, priceOutput: 0, currency: '¥' }, t, localeId: 'en-US' })
assert.match(flatten(tree), /usage\.costHint/)
assert.doesNotMatch(flatten(tree), /¥6\.00/)

console.log('usage card tests passed')
