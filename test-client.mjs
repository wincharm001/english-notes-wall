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
  setTimeout,
  clearTimeout,
  document: {
    head: { append() {} },
    createElement: () => ({ dataset: {}, remove() {}, textContent: '' }),
  },
}
vm.createContext(sandbox)
vm.runInContext(source, sandbox)
assert.equal(typeof factory, 'function', 'module loader factory registered')
assert.match(source, /\.enw-aside \{[^}]*max-height: calc\(100vh - 24px\)[^}]*overflow-y: auto/, 'the sidebar has its own scroll container')

const React = {
  createElement: (...args) => ({ type: args[0], props: args[1] }),
  useState: () => [undefined, () => {}],
  useEffect: () => {},
  useMemo: callback => callback(),
  useRef: () => ({ current: null }),
  useSyncExternalStore: () => false,
}

const exports = factory(name => {
  if (name === 'react') return React
  throw new Error(`unexpected require: ${name}`)
})
assert.equal(exports.inject.join(','), 'slots,locale,connection')

const calls = []
const registrations = []
const ctx = {
  locale: {
    register: () => () => {},
    bind: () => key => key,
  },
  slots: {
    inject(_key, callback) {
      const dispose = callback()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    register(options, component) {
      registrations.push({ options, component })
      return () => {}
    },
  },
  get(name) {
    if (name !== 'connection') return undefined
    return {
      rpc: {
        async call(channel, endpoint, payload, signal) {
          calls.push({ channel, endpoint, payload, signal })
          return {
            ok: true,
            value: {
              notes: [],
              today: null,
              history: [],
              settings: { quizTime: '08:00', dailyCount: 5, enabled: true, llm: { provider: '', model: '', reasoningEffort: '' } },
              model: { available: false, label: '', configured: false, selection: {}, effective: null, fallback: null },
              usage: { total: { input: 0, output: 0, total: 0, calls: 0 }, last: null },
              stats: { total: 0, counts: {}, streak: 0, pending: false },
            },
          }
        },
      },
    }
  },
  effect: callback => {
    const dispose = callback()
    return typeof dispose === 'function' ? dispose : () => {}
  },
}

await exports.apply(ctx)
assert.equal(registrations.length, 2)
assert.equal(registrations[0].options.name, 'main')
assert.equal(registrations[0].options.key, 'english-notes')
assert.equal(registrations[1].options.name, 'sidebar.panellist')
assert.equal(registrations[1].options.id, 'english-notes')
assert.equal(calls.length, 1)
assert.equal(calls[0].channel, '/api')
assert.equal(calls[0].endpoint, 'englishNotes/snapshot')
assert.equal(Object.keys(calls[0].payload).join(','), 'args')
assert.equal(Object.keys(calls[0].payload.args).length, 0)

const registrations2 = []
const exports2 = factory(name => (name === 'react' ? React : (() => { throw new Error(name) })()))
// The module-level dictionaries and styles are already installed; a second apply
// with a failing carrier must still register the slots and expose the error state.
const ctx2 = {
  ...ctx,
  slots: {
    inject(_key, callback) {
      callback()
      return () => {}
    },
    register(options, component) {
      registrations2.push({ options, component })
      return () => {}
    },
  },
  locale: { register: () => () => {}, bind: () => key => key },
  effect: callback => { callback(); return () => {} },
  get: name => (name === 'connection'
    ? { rpc: { call: async () => ({ ok: false, error: { code: 'gateway/internal', message: 'host exploded' } }) } }
    : undefined),
}
await exports2.apply(ctx2)
assert.equal(registrations2.length, 2)

console.log('client module tests passed')
