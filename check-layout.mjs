// Guards the two-column page structure: the aside must be a child of the
// layout grid, never of the notes column. This catches the parenthesis slip
// that silently nested quiz/usage/stats inside .enw-main.
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
const lines = source.split('\n')

const depthAtLineStart = new Array(lines.length).fill(0)
let depth = 0
let line = 0
let i = 0
let lastSignificant = ''
let mode = 'code' // code | template

const isRegexStart = char => char && '=(:,![{;?&|+~*%<>'.includes(char)

while (i < source.length) {
  const char = source[i]
  const next = source[i + 1]

  if (char === '\n') {
    line += 1
    if (line < depthAtLineStart.length) depthAtLineStart[line] = depth
    i += 1
    continue
  }

  if (mode === 'template') {
    if (char === '\\') { i += 2; continue }
    if (char === '`') { mode = 'code'; i += 1; lastSignificant = '`'; continue }
    // Interpolations are ignored on purpose: their parentheses are balanced
    // on their own, so skipping them keeps the call-depth count exact.
    i += 1
    continue
  }

  if (char === '/' && next === '/') {
    const end = source.indexOf('\n', i)
    i = end === -1 ? source.length : end
    continue
  }
  if (char === '/' && next === '*') {
    const end = source.indexOf('*/', i + 2)
    const chunk = source.slice(i, end === -1 ? source.length : end + 2)
    const newlines = chunk.split('\n').length - 1
    if (newlines) {
      line += newlines
      if (line < depthAtLineStart.length) depthAtLineStart[line] = depth
    }
    i = end === -1 ? source.length : end + 2
    continue
  }
  if (char === "'" || char === '"') {
    let j = i + 1
    while (j < source.length) {
      if (source[j] === '\\') { j += 2; continue }
      if (source[j] === char) { j += 1; break }
      if (source[j] === '\n') break
      j += 1
    }
    i = j
    lastSignificant = char
    continue
  }
  if (char === '`') {
    mode = 'template'
    i += 1
    continue
  }
  if (char === '/' && isRegexStart(lastSignificant)) {
    let j = i + 1
    let inClass = false
    while (j < source.length) {
      const c = source[j]
      if (c === '\\') { j += 2; continue }
      if (c === '[') inClass = true
      else if (c === ']') inClass = false
      else if (c === '/' && !inClass) { j += 1; break }
      else if (c === '\n') break
      j += 1
    }
    // Skip flags.
    while (j < source.length && /[a-z]/.test(source[j])) j += 1
    i = j
    lastSignificant = '/'
    continue
  }

  if (char === '(') depth += 1
  else if (char === ')') depth -= 1
  if (char !== ' ' && char !== '\t' && char !== '\r') lastSignificant = char
  i += 1
}

assert.equal(depth, 0, 'parentheses balance across the module')

const lineOf = needle => {
  const index = lines.findIndex(text => text.includes(needle))
  assert.notEqual(index, -1, `source contains ${needle}`)
  return index
}

const mainLine = lineOf("className: 'enw-main'")
const asideLine = lineOf("h('aside', { className: 'enw-aside' }")
const layoutLine = lineOf("'enw-layout'")

const base = depthAtLineStart[layoutLine]
assert.equal(depthAtLineStart[mainLine], base + 1, 'notes column sits inside the layout grid')
assert.equal(depthAtLineStart[asideLine], base + 1, 'aside must be a sibling of the notes column, not nested in it')

console.log(`layout nesting ok (aside depth ${depthAtLineStart[asideLine]})`)
