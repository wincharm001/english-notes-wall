import fs from 'node:fs'
const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')
let line = 1
let state = 'code'
let quote = ''
let lastSignificant = ''
const stack = []
const pairs = { ')': '(', ']': '[', '}': '{' }

// A regex literal may contain brackets, braces and parentheses that do not
// belong to the surrounding expression, e.g. /[（(][^）)]*[）)]/.
const isRegexStart = char => char && '=(:,![{;?&|+~*%<>'.includes(char)

for (let index = 0; index < source.length; index += 1) {
  const char = source[index]
  const next = source[index + 1]
  if (char === '\n') line += 1
  if (state === 'line-comment') {
    if (char === '\n') state = 'code'
    continue
  }
  if (state === 'block-comment') {
    if (char === '*' && next === '/') { state = 'code'; index += 1 }
    continue
  }
  if (state === 'string') {
    if (char === '\\') { index += 1; continue }
    if (char === quote) { state = 'code'; lastSignificant = quote }
    continue
  }
  if (state === 'template') {
    if (char === '\\') { index += 1; continue }
    if (char === '`') { state = 'code'; lastSignificant = '`' }
    continue
  }
  if (char === '/' && next === '/') { state = 'line-comment'; index += 1; continue }
  if (char === '/' && next === '*') { state = 'block-comment'; index += 1; continue }
  if (char === '/' && isRegexStart(lastSignificant)) {
    let cursor = index + 1
    let inClass = false
    while (cursor < source.length) {
      const current = source[cursor]
      if (current === '\\') { cursor += 2; continue }
      if (current === '\n') break
      if (current === '[') inClass = true
      else if (current === ']') inClass = false
      else if (current === '/' && !inClass) { cursor += 1; break }
      cursor += 1
    }
    index = cursor - 1
    lastSignificant = '/'
    continue
  }
  if (char === "'" || char === '"') { state = 'string'; quote = char; continue }
  if (char === '`') { state = 'template'; continue }
  if ('([{'.includes(char)) { stack.push({ char, line }); lastSignificant = char; continue }
  if (')]}'.includes(char)) {
    const top = stack.pop()
    if (!top || top.char !== pairs[char]) {
      console.log(`mismatch at line ${line}: '${char}' vs ${top ? `'${top.char}' from line ${top.line}` : 'empty'}`)
      process.exit(1)
    }
    lastSignificant = char
    continue
  }
  if (!/\s/.test(char)) lastSignificant = char
}
if (stack.length) {
  console.log('unclosed:', stack.slice(-10).map(item => `${item.char}@${item.line}`).join(', '))
  process.exit(1)
} else {
  console.log('balanced')
}
