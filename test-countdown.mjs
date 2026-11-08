// Countdown formatting and rendering smoke tests.
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

const { __formatCountdown, __scheduleDayLabel, __QuizCountdown } = exports
assert.equal(typeof __formatCountdown, 'function')
assert.equal(typeof __scheduleDayLabel, 'function')
assert.equal(typeof __QuizCountdown, 'function')

assert.equal(__formatCountdown(0), '00:00:00')
assert.equal(__formatCountdown(1_000), '00:00:01')
assert.equal(__formatCountdown(65_000), '00:01:05')
assert.equal(__formatCountdown(3_661_000), '01:01:01')
assert.equal(__formatCountdown(90_061_000), '25:01:01')

const t = key => key
const dayTarget = new Date(2026, 0, 15, 8, 0, 0, 0)
assert.equal(__scheduleDayLabel(dayTarget.getTime(), new Date(2026, 0, 15, 7, 0, 0, 0).getTime(), t, 'en-US'), 'quiz.today')
assert.equal(__scheduleDayLabel(dayTarget.getTime(), new Date(2026, 0, 14, 9, 0, 0, 0).getTime(), t, 'en-US'), 'quiz.tomorrow')

const flatten = node => {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatten).join(' ')
  return flatten(node.children)
}

const render = props => {
  slots = []
  cursor = 0
  return flatten(__QuizCountdown({ t, localeId: 'en-US', onRefresh: () => {}, ...props }))
}

assert.match(render({ nextAt: null, pending: false, enabled: false }), /quiz\.paused/)
assert.match(render({ nextAt: Date.now(), pending: true, enabled: true }), /quiz\.soon/)
assert.match(render({ nextAt: Date.now(), pending: true, enabled: true }), /action\.refresh/)
{
  const text = render({ nextAt: Date.now() + 65_000, pending: false, enabled: true })
  assert.match(text, /quiz\.next/)
  assert.match(text, /00:01:05/)
}
assert.match(render({ nextAt: Date.now() - 5_000, pending: false, enabled: true }), /quiz\.soon/)
assert.equal(render({ nextAt: null, pending: false, enabled: true }), '')

console.log('countdown tests passed')
