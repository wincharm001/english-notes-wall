// Highlight strategy checks: literal matching for words/phrases/collocations,
// frame matching for sentence patterns (glosses and placeholders removed).
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
assert.equal(typeof exports.__highlightRanges, 'function', 'test hook available')

const rangesOf = (text, entry, category) =>
  Array.from(exports.__highlightRanges(text, entry, category), pair => [pair[0], pair[1]])
const covered = (text, ranges) => ranges.map(([start, end]) => text.slice(start, end))

{
  const text = "She's not so much a teacher as a mentor to her students."
  assert.deepEqual(covered(text, rangesOf(text, 'not so much A as/but rather B', 'pattern')), ['not so much a teacher as'])
}
{
  const text = 'The delay was not so much the weather but rather the traffic.'
  assert.deepEqual(covered(text, rangesOf(text, 'not so much A as/but rather B', 'pattern')), ['not so much the weather but rather'])
}
{
  const text = "He didn't fail so much because of laziness as because he lacked support."
  assert.deepEqual(covered(text, rangesOf(text, 'not so much A as/but rather B', 'pattern')), ['so much because of laziness as'])
}
{
  const text = 'She had the distinction of being the first student in her school to win a national prize.'
  assert.deepEqual(
    covered(text, rangesOf(text, 'had the distinction (荣誉、成就) of being the first', 'pattern')),
    ['had the distinction of being the first'],
  )
}
{
  const text = 'It is important for us to learn English every day.'
  assert.deepEqual(covered(text, rangesOf(text, 'It is + adj. + for sb. + to do sth.', 'pattern')), ['It is important for us to'])
}
{
  const text = 'The router lost several data packets during the transfer.'
  assert.deepEqual(covered(text, rangesOf(text, 'packet', 'word')), ['packet'])
}
{
  const text = 'Both sides finally reached a Fair Deal after weeks of talks.'
  assert.deepEqual(covered(text, rangesOf(text, 'fair deal', 'collocation')), ['Fair Deal'])
}
{
  const text = 'He slipped the receipt into his coat pocket.'
  assert.deepEqual(covered(text, rangesOf(text, 'pocket', 'word')), ['pocket'])
}
{
  const text = 'Email is now the most common form of business communication.'
  assert.deepEqual(covered(text, rangesOf(text, 'a form of sth', 'collocation')), ['form of'])
}
{
  const text = 'The committee finally reached a consensus on the new budget.'
  assert.deepEqual(covered(text, rangesOf(text, 'a consensus on sth', 'collocation')), ['a consensus on'])
}
{
  const text = 'I did not catch every word, but I got the gist of what she said.'
  assert.deepEqual(covered(text, rangesOf(text, 'the gist of sth', 'collocation')), ['the gist of'])
}
{
  const text = 'The photo reminds me of my childhood.'
  assert.deepEqual(covered(text, rangesOf(text, 'remind sb. of sth.', 'phrase')), ['reminds me of'])
}
{
  const text = 'A sentence without the target.'
  assert.deepEqual(rangesOf(text, 'pocket', 'word'), [])
}
{
  const text = '她不只是老师，更是导师。'
  assert.deepEqual(covered(text, rangesOf(text, '不只是老师', 'translation')), ['不只是老师'])
}
// A phrase must not get the pattern-only frame treatment, but its literal
// slash/dots-separated fragments still match.
{
  const text = 'The more you practice, the more confident you become.'
  assert.deepEqual(covered(text, rangesOf(text, 'the more ... the more ...', 'phrase')), ['The more', 'the more'])
}

console.log('highlight tests passed')
