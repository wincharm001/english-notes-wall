import fs from 'node:fs'

const source = fs.readFileSync(new URL('./english-notes-wall/client.js', import.meta.url), 'utf8')

function extractDict(name) {
  const marker = `const ${name} = {`
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`missing ${name}`)
  const end = source.indexOf('\n    }\n', start)
  if (end < 0) throw new Error(`unterminated ${name}`)
  const body = source.slice(start + `const ${name} = `.length, end + 7)
  return new Function(`return (${body})`)()
}

const en = extractDict('en')
const zh = extractDict('zh')
const enKeys = new Set(Object.keys(en))
const zhKeys = new Set(Object.keys(zh))

const problems = []
for (const key of enKeys) if (!zhKeys.has(key)) problems.push(`zh missing: ${key}`)
for (const key of zhKeys) if (!enKeys.has(key)) problems.push(`en missing: ${key}`)

const literalPattern = /'([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)'/g
const used = new Set()
for (const match of source.matchAll(literalPattern)) {
  const key = match[1]
  if (key.includes('/') || key.endsWith('.js') || key.endsWith('.json')) continue
  used.add(key)
}
for (const key of used) {
  if (key === 'sidebar.panellist') continue
  if (!enKeys.has(key) && !key.startsWith('enw')) problems.push(`undeclared literal key: ${key}`)
}
for (const category of ['word', 'phrase', 'collocation', 'pattern', 'sentence', 'other']) {
  const key = `category.${category}`
  if (!enKeys.has(key)) problems.push(`missing category key: ${key}`)
}
for (const type of ['cn2en', 'en2cn', 'cloze']) {
  const key = `quiz.type.${type}`
  if (!enKeys.has(key)) problems.push(`missing quiz type key: ${key}`)
}

console.log(`en keys: ${enKeys.size}, zh keys: ${zhKeys.size}, literals: ${used.size}`)
if (problems.length) {
  console.log('PROBLEMS:')
  for (const problem of problems) console.log(' - ' + problem)
  process.exitCode = 1
} else {
  console.log('locale keys consistent')
}
