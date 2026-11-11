// The wall exposes a floating back-to-top button once the page is scrolled.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
let factory = null
let reduceMotion = false
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(definition) {
        factory = definition.factory
      },
    },
    matchMedia: () => ({ matches: reduceMotion }),
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
const renderButton = props => {
  slots = []
  cursor = 0
  return renderTree(exports.__BackToTop({ t, visible: false, onClick: () => {}, ...props }))
}

// Hidden while the page is near the top: no tab stop, no click.
let tree = renderButton()
let button = collect(tree, 'enw-top-btn')[0]
assert.ok(button, 'the control stays mounted for its transition')
assert.equal(collect(button, 'enw-top-btn--on').length, 0)
assert.equal(button.props.tabIndex, -1)
assert.equal(button.props['aria-hidden'], 'true')
assert.match(flatten(tree), /action\.backToTop/)

// Visible after scrolling: labelled, focusable, and blurs before scrolling.
let clicks = 0
let blurs = 0
tree = renderButton({ visible: true, onClick: () => { clicks += 1 } })
button = collect(tree, 'enw-top-btn')[0]
assert.equal(collect(button, 'enw-top-btn--on').length, 1)
assert.equal(button.props.tabIndex, 0)
assert.equal(button.props['aria-hidden'], undefined)
assert.match(flatten(tree), /action\.backToTop/)
button.props.onClick({ currentTarget: { blur: () => { blurs += 1 } } })
assert.equal(blurs, 1, 'the button gives up focus before it fades out')
assert.equal(clicks, 1)

// Smooth scrolling by default, instant when reduced motion is requested.
let called = null
const node = { scrollTo: options => { called = options } }
exports.__scrollToTop(node)
assert.equal(called?.top, 0)
assert.equal(called?.behavior, 'smooth')
reduceMotion = true
exports.__scrollToTop(node)
assert.equal(called?.top, 0)
assert.equal(called?.behavior, 'auto')

// Environments without scrollTo still jump to the top.
reduceMotion = false
const legacy = { scrollTop: 240 }
exports.__scrollToTop(legacy)
assert.equal(legacy.scrollTop, 0)

const throwing = { scrollTop: 120, scrollTo: () => { throw new Error('unsupported') } }
exports.__scrollToTop(throwing)
assert.equal(throwing.scrollTop, 0)
exports.__scrollToTop(null)

console.log('back-to-top tests passed')
