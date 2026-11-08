import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const home = await mkdtemp(path.join(os.tmpdir(), 'enw-host-test-'))
process.env.DSH_HOME = home

const module = await import('./english-notes-wall/index.js')
const { apply, __internals } = module

const { matchesAnswer, parseModelJson, nextOccurrence, nextQuizPublication, normalizeAnswer } = __internals

assert.equal(matchesAnswer('give up', 'Give up.'), true)
assert.equal(matchesAnswer('give up', 'gave up'), false)
assert.equal(matchesAnswer('a / b', 'B'), true)
assert.equal(matchesAnswer('take care of (look after)', 'look after'), true)
assert.equal(normalizeAnswer('  She   HAS  '), 'she has')
assert.deepEqual(parseModelJson('```json\n{"items":[1]}\n```'), { items: [1] })
assert.deepEqual(parseModelJson('prefix {"ok":true} suffix'), { ok: true })
assert.equal(parseModelJson('not json'), null)
assert.ok(nextOccurrence('08:00') > Date.now())

// Next-quiz publication, independent of the machine wall clock.
{
  const clock = '08:00'
  const base = new Date(2026, 0, 15, 7, 30, 0, 0)
  const before = base.getTime()
  const after = new Date(2026, 0, 15, 9, 30, 0, 0).getTime()
  const todayTarget = new Date(2026, 0, 15, 8, 0, 0, 0).getTime()
  const tomorrowTarget = new Date(2026, 0, 16, 8, 0, 0, 0).getTime()
  const make = (overrides = {}) => ({
    settings: { enabled: true, quizTime: clock },
    notes: [{ id: 'n1' }],
    quizzes: {},
    ...overrides,
  })

  assert.deepEqual(nextQuizPublication(make(), before), { at: todayTarget, pending: false })
  assert.deepEqual(nextQuizPublication(make(), after), { at: after, pending: true })
  assert.deepEqual(nextQuizPublication(make({ notes: [] }), after), { at: tomorrowTarget, pending: false })
  assert.deepEqual(nextQuizPublication(make({ quizzes: { '2026-01-15': { items: [] } } }), before), {
    at: tomorrowTarget,
    pending: false,
  })
  assert.deepEqual(nextQuizPublication(make({ settings: { enabled: false, quizTime: clock } }), before), {
    at: null,
    pending: false,
  })
}

function makeContext(services) {
  const disposers = []
  const registered = new Map()
  const contributions = []
  const inner = {
    provide(name, value) {
      services[name] = value
      return () => { delete services[name] }
    },
    typert: {
      register(contribution) {
        contributions.push(contribution)
        return async () => {}
      },
    },
    tools: {
      register(definition) {
        registered.set(definition.name, definition)
        return () => registered.delete(definition.name)
      },
    },
    effect(callback) {
      const dispose = callback()
      if (typeof dispose === 'function') disposers.push(dispose)
      return dispose
    },
    get(name) {
      return services[name]
    },
  }
  const ctx = {
    logger: { warn() {}, info() {} },
    get(name) {
      return services[name]
    },
    inject(_deps, callback) {
      callback(inner)
      return () => {}
    },
  }
  return { ctx, services, registered, contributions, disposers }
}

const services = {}
const first = makeContext(services)
apply(first.ctx)

assert.equal(first.contributions.length, 1, 'one typert contribution')
assert.equal(first.contributions[0].package, '@local/english-notes-wall')
assert.equal(first.contributions[0].invocations.length, 12, 'twelve remote methods')
assert.ok(first.registered.has('english_notes'), 'agent tool registered')

const tool = first.registered.get('english_notes')
const exec = {}
const add = args => tool.execute(args, exec)

const word = await add({ action: 'add', text: 'meticulous', translation: '一丝不苟的', category: 'word', tags: ['adjective'] })
assert.equal(word.status, 'ok')
assert.ok(word.note.id)
assert.ok(word.note.createdAt > 0)

await add({ action: 'add', text: 'give up', translation: '放弃', category: 'phrase' })
await add({
  action: 'add',
  text: 'She has been working on the project for three months.',
  translation: '她已经在这个项目上工作三个月了。',
  category: 'sentence',
})

const listed = await add({ action: 'list' })
assert.equal(listed.notes.length, 3)
assert.deepEqual(listed.notes.map(note => note.text), [
  'meticulous',
  'give up',
  'She has been working on the project for three months.',
])

const expand = await add({ action: 'expand', id: word.note.id })
assert.equal(expand.status, 'unavailable', 'no model configured in the test host')

const generated = await add({ action: 'quiz' })
assert.equal(generated.status, 'ok')
assert.equal(generated.quiz.source, 'local')
assert.equal(generated.quiz.items.length, 5)
assert.ok(generated.quiz.items.every(item => ['cn2en', 'en2cn', 'cloze'].includes(item.type)))
assert.ok(generated.quiz.items.some(item => item.type === 'cloze'), 'local set includes a cloze item')
assert.ok(generated.quiz.items.some(item => item.open === true), 'translation items are open-ended')
assert.ok(generated.quiz.items.some(item => item.open === false), 'cloze items are fixed-answer')
assert.equal(generated.quiz.items.find(item => item.type === 'cloze').open, false)

const correct = {}
for (const item of generated.quiz.items) correct[item.id] = item.answer
const graded = await add({ action: 'grade', answers: correct })
assert.equal(graded.status, 'ok')
assert.equal(graded.quiz.attempt.score, graded.quiz.attempt.total)
assert.equal(Object.values(graded.quiz.attempt.correct).filter(Boolean).length, graded.quiz.attempt.total)
assert.equal(graded.quiz.attempt.correct[generated.quiz.items[0].id], true)

const wrong = {}
for (const item of generated.quiz.items) wrong[item.id] = 'definitely wrong'
const gradedWrong = await add({ action: 'grade', answers: wrong })
assert.equal(gradedWrong.quiz.attempt.score, 0)

const badTime = await add({ action: 'settings', settings: { quizTime: '25:00' } })
assert.equal(badTime.status, 'invalid')
const badCount = await add({ action: 'settings', settings: { dailyCount: 99 } })
assert.equal(badCount.status, 'invalid')
const saved = await add({ action: 'settings', settings: { quizTime: '21:15', dailyCount: 3 } })
assert.equal(saved.status, 'ok')
assert.equal(saved.settings.quizTime, '21:15')
assert.equal(saved.settings.dailyCount, 3)

const catalog = await add({ action: 'models' })
assert.equal(catalog.status, 'ok')
assert.ok(Array.isArray(catalog.providers))
assert.ok(Array.isArray(catalog.models))
assert.ok(Array.isArray(catalog.efforts))
assert.ok(catalog.usage)
assert.equal(catalog.usage.total.calls, 0)

const badLlm = await add({ action: 'settings', settings: { llm: { provider: 'missing-provider', model: 'missing-model', reasoningEffort: '' } } })
assert.equal(badLlm.status, 'invalid')
const resetLlm = await add({ action: 'settings', settings: { llm: { provider: '', model: '', reasoningEffort: '' } } })
assert.equal(resetLlm.status, 'ok')
assert.equal(resetLlm.settings.llm.provider, '')

const regenerated = await add({ action: 'quiz', force: true })
assert.equal(regenerated.status, 'ok')
assert.equal(regenerated.quiz.items.length, 3)

const regraded = await add({ action: 'grade', answers: Object.fromEntries(regenerated.quiz.items.map(item => [item.id, item.answer])) })
assert.equal(regraded.status, 'ok')
assert.equal(regraded.quiz.attempt.score, 3)

const snapshot = await services.englishNotes.snapshot()
assert.equal(snapshot.notes.length, 3)
assert.equal(snapshot.settings.quizTime, '21:15')
assert.equal(snapshot.stats.total, 3)
assert.equal(snapshot.today.attempt.total, 3)
assert.equal(snapshot.today.attempt.score, 3)
assert.equal(snapshot.stats.pending, false)
assert.equal(snapshot.stats.streak, 1)
assert.equal(snapshot.usage.total.calls, 0)
assert.equal(snapshot.usage.last, null)
assert.equal(snapshot.model.configured, false)
assert.equal(snapshot.model.available, false)
assert.equal(snapshot.settings.llm.provider, '')

const rendered = tool.output.render({ action: 'list' }, listed)
assert.equal(rendered[0].type, 'text')
assert.ok(rendered[0].text.includes('give up'))

const deleted = await add({ action: 'delete', id: word.note.id })
assert.equal(deleted.status, 'ok')
const deletedAgain = await add({ action: 'delete', id: word.note.id })
assert.equal(deletedAgain.status, 'missing')

for (const dispose of first.disposers) {
  try {
    await dispose()
  } catch {
    /* cleanup */
  }
}

// A second composition must load the persisted store.
const services2 = {}
const second = makeContext(services2)
apply(second.ctx)
const snapshot2 = await services2.englishNotes.snapshot()
assert.equal(snapshot2.notes.length, 2, 'notes persisted across a restart')
assert.equal(snapshot2.settings.quizTime, '21:15')
assert.ok(snapshot2.today, 'today quiz persisted')
assert.equal(snapshot2.today.attempt.score, 3, 'the last graded attempt persisted')

for (const dispose of second.disposers) {
  try {
    await dispose()
  } catch {
    /* cleanup */
  }
}

// A configured expansion model, its reasoning effort, and token accounting.
const services3 = {}
const third = makeContext(services3)
const streamCalls = []
services3.llm = {
  listProviders: () => [{ id: 'fake', name: 'Fake Provider' }],
  listModels: async provider => [{ provider, id: 'fake-1', name: 'Fake Model' }],
  resolveModelInfo: async (provider, model) => ({
    provider,
    model,
    reasoning: {
      efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }],
      defaultEffort: 'low',
    },
  }),
  stream: options => (async function* () {
    streamCalls.push(options)
    const prompt = options.messages?.[0]?.content?.[0]?.text ?? ''
    let text
    if (prompt.includes('Grade the learner')) {
      const match = prompt.match(/Quiz \(JSON\): (\[[^\n]*\])/)
      let quiz = []
      try {
        quiz = match ? JSON.parse(match[1]) : []
      } catch {
        quiz = []
      }
      text = JSON.stringify({
        items: quiz.map(item => ({
          id: item.id,
          verdict: 'correct',
          score: 1,
          feedback: '很好',
          better: '更地道的说法',
          related: ['related-one', 'related-two'],
        })),
        summary: '整体不错',
      })
    } else if (prompt.includes('Organize the learner')) {
      const marker = 'Notes (JSON): '
      let notes = []
      try {
        notes = JSON.parse(prompt.slice(prompt.lastIndexOf(marker) + marker.length).trim())
      } catch {
        notes = []
      }
      const ids = notes.map(note => note.id)
      const half = Math.ceil(ids.length / 2)
      text = JSON.stringify({
        groups: [
          { title: '测试主题一', summary: '第一组说明', tags: ['测试'], noteIds: ids.slice(0, half) },
          { title: '测试主题二', summary: '第二组说明', tags: ['复习'], noteIds: ids.slice(half) },
        ],
        categories: ids.length ? [{ noteId: ids[0], category: 'collocation' }] : [],
        relations: ids.length >= 2 ? [{ noteIds: [ids[0], ids[1]], kind: 'synonym', note: '近义测试' }] : [],
        summary: '整理总览',
      })
    } else if (prompt.includes('Entries (JSON):')) {
      const marker = 'Entries (JSON): '
      let entries = []
      try {
        entries = JSON.parse(prompt.slice(prompt.lastIndexOf(marker) + marker.length).trim())
      } catch {
        entries = []
      }
      text = JSON.stringify({
        items: entries.map((entry, index) => ({
          index,
          meaning: `释义${index}`,
          wordForms: [
            { kind: 'derivative', word: `form-${index}`, note: `派生${index}` },
            { kind: 'same-root', word: 'shared-form', note: '共同词根' },
          ],
          discrimination: `辨析${index}`,
          collocations: ['shared phrase', `unique-${index}`],
          examples: [{
            en: `Example ${index}.`,
            zh: `例句${index}`,
            structure: `结构${index}`,
            grammar: `语法${index}`,
            chunk: `chunk-${index}`,
            chunkNote: `表达${index}`,
          }],
          moreExamples: [{ en: `More ${index}.`, zh: `更多${index}` }],
        })),
      })
    } else {
      text = '{"meaning":"测试释义","examples":[{"en":"A test.","zh":"一个测试。"}]}'
    }
    yield { type: 'text-delta', index: 0, text }
    yield { type: 'usage', usage: { inputTokens: 100, outputTokens: 20, totalTokens: 120 } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  })(),
}
services3.agentDefaultModel = { currentSelection: () => ({ provider: 'default', model: 'default-1' }) }
apply(third.ctx)
const tool3 = third.registered.get('english_notes')

const badEffort = await tool3.execute({ action: 'settings', settings: { llm: { provider: 'fake', model: 'fake-1', reasoningEffort: 'nope' } } }, {})
assert.equal(badEffort.status, 'invalid', 'unsupported effort rejected')

const savedLlm = await tool3.execute({ action: 'settings', settings: { llm: { provider: 'fake', model: 'fake-1', reasoningEffort: 'high' } } }, {})
assert.equal(savedLlm.status, 'ok')
assert.equal(savedLlm.settings.llm.reasoningEffort, 'high')

const priced = await tool3.execute({ action: 'settings', settings: { priceInput: 2, priceOutput: 8, currency: '¥' } }, {})
assert.equal(priced.status, 'ok')
assert.equal(priced.settings.priceInput, 2)
assert.equal(priced.settings.priceOutput, 8)
assert.equal(priced.settings.currency, '¥')
const invalidPrice = await tool3.execute({ action: 'settings', settings: { priceInput: -1 } }, {})
assert.equal(invalidPrice.status, 'invalid')

const catalog3 = await tool3.execute({ action: 'models' }, {})
assert.equal(catalog3.status, 'ok')
assert.deepEqual(catalog3.providers, [{ id: 'fake', name: 'Fake Provider' }])
assert.equal(catalog3.models[0].id, 'fake-1')
assert.equal(catalog3.efforts.length, 2)
assert.equal(catalog3.defaultEffort, 'low')
assert.deepEqual(catalog3.selection, { provider: 'fake', model: 'fake-1', reasoningEffort: 'high' })

const savedPrompts = await tool3.execute({ action: 'settings', settings: { prompts: { expansion: 'CUSTOM-EXPANSION {{note}}' } } }, {})
assert.equal(savedPrompts.status, 'ok')
assert.equal(savedPrompts.settings.prompts.expansion, 'CUSTOM-EXPANSION {{note}}')

const addedFake = await tool3.execute({ action: 'add', text: 'test note', translation: '测试便利贴', category: 'phrase' }, {})
assert.equal(addedFake.status, 'ok')
assert.equal(addedFake.note.entries.length, 1)
const expanded = await tool3.execute({ action: 'expand', id: addedFake.note.id }, {})
assert.equal(expanded.status, 'ok')
assert.equal(expanded.note.entries[0].expansion.meaning, '测试释义')
assert.equal(expanded.note.entries[0].expansion.model, 'fake/fake-1')
assert.equal(expanded.note.entries[0].expansion.reasoningEffort, 'high')
assert.equal(expanded.note.entries[0].expansion.usage.total, 120)
assert.equal(streamCalls.length, 1)
assert.equal(streamCalls[0].provider, 'fake')
assert.equal(streamCalls[0].model, 'fake-1')
assert.equal(streamCalls[0].reasoningEffort, 'high')
assert.ok(streamCalls[0].messages[0].content[0].text.startsWith('CUSTOM-EXPANSION '))
assert.ok(streamCalls[0].messages[0].content[0].text.includes('test note'))

const snapshot3 = await services3.englishNotes.snapshot()
assert.equal(snapshot3.usage.total.calls, 1)
assert.equal(snapshot3.usage.total.input, 100)
assert.equal(snapshot3.usage.total.output, 20)
assert.equal(snapshot3.usage.total.total, 120)
assert.equal(snapshot3.usage.last.total, 120)
assert.equal(snapshot3.usage.last.model, 'fake/fake-1')
assert.equal(snapshot3.usage.last.reported, true)
assert.equal(snapshot3.usage.last.purpose, 'expansion')
assert.equal(snapshot3.usage.purposes.expansion.calls, 1)
assert.equal(snapshot3.usage.purposes.expansion.total, 120)
assert.equal(snapshot3.usage.purposes.quiz.calls, 0)
assert.equal(snapshot3.model.configured, true)
assert.equal(snapshot3.model.label, 'fake/fake-1')
assert.ok(snapshot3.nextQuizAt > snapshot3.now)
assert.equal(snapshot3.quizPending, false)
assert.ok(typeof snapshot3.promptDefaults.expansion === 'string')
assert.ok(snapshot3.promptDefaults.expansion.includes('{{note}}'))
assert.equal(snapshot3.settings.prompts.expansion, 'CUSTOM-EXPANSION {{note}}')

// Quiz generation is a model call too, so its usage joins the same total.
const quizWithUsage = await tool3.execute({ action: 'quiz', force: true }, {})
assert.equal(quizWithUsage.status, 'ok')
const snapshot4 = await services3.englishNotes.snapshot()
assert.equal(snapshot4.usage.total.calls, 2)
assert.equal(snapshot4.usage.total.total, 240)
assert.equal(snapshot4.usage.last.purpose, 'quiz')
assert.equal(snapshot4.usage.last.total, 120)
assert.equal(snapshot4.usage.purposes.quiz.calls, 1)
assert.equal(snapshot4.usage.purposes.quiz.total, 120)
assert.equal(streamCalls.length, 2)

// Model grading accepts open answers and enriches them.
const quizItems = quizWithUsage.quiz.items
const modelAnswers = Object.fromEntries(quizItems.map(item => [item.id, item.open ? 'my own open answer' : item.answer]))
const modelGraded = await tool3.execute({ action: 'gradeModel', date: quizWithUsage.quiz.date, answers: modelAnswers }, {})
assert.equal(modelGraded.status, 'ok')
assert.equal(modelGraded.quiz.attempt.mode, 'model')
assert.equal(modelGraded.quiz.attempt.score, quizItems.length)
assert.equal(modelGraded.quiz.attempt.feedback[quizItems[0].id].verdict, 'correct')
assert.equal(modelGraded.quiz.attempt.feedback[quizItems[0].id].feedback, '很好')
assert.equal(modelGraded.quiz.attempt.feedback[quizItems[0].id].related.length, 2)
assert.equal(modelGraded.quiz.attempt.summary, '整体不错')
const snapshot5 = await services3.englishNotes.snapshot()
assert.equal(snapshot5.usage.total.calls, 3)
assert.equal(snapshot5.usage.total.total, 360)
assert.equal(snapshot5.usage.last.purpose, 'grading')
assert.equal(snapshot5.usage.purposes.grading.calls, 1)
assert.equal(snapshot5.usage.purposes.grading.total, 120)
assert.equal(snapshot5.today.attempt.mode, 'model')

// Multiple entries on one note: dedupe input, expand each, dedupe across expansions.
await tool3.execute({ action: 'settings', settings: { prompts: { expansion: '' } } }, {})
const multi = await tool3.execute({
  action: 'add',
  text: 'take off | 起飞；脱下\nlook after | 照顾\ntake off',
  category: 'phrase',
}, {})
assert.equal(multi.status, 'ok')
assert.equal(multi.note.entries.length, 2, 'duplicate entry removed from one note')
assert.equal(multi.note.entries[0].translation, '起飞；脱下')

const multiExpanded = await tool3.execute({ action: 'expand', id: multi.note.id }, {})
assert.equal(multiExpanded.status, 'ok')
assert.equal(multiExpanded.expanded, 2)
assert.equal(multiExpanded.note.entries[0].expansion.meaning, '释义0')
assert.equal(multiExpanded.note.entries[1].expansion.meaning, '释义1')
assert.deepEqual(multiExpanded.note.entries[0].expansion.collocations, ['shared phrase', 'unique-0'])
assert.deepEqual(multiExpanded.note.entries[1].expansion.collocations, ['unique-1'], 'duplicate collocation removed across entries')
assert.equal(multiExpanded.note.entries[0].expansion.examples[0].en, 'Example 0.')
assert.equal(multiExpanded.note.entries[0].expansion.examples[0].structure, '结构0')
assert.equal(multiExpanded.note.entries[0].expansion.examples[0].grammar, '语法0')
assert.equal(multiExpanded.note.entries[0].expansion.examples[0].chunk, 'chunk-0')
assert.equal(multiExpanded.note.entries[0].expansion.examples[0].chunkNote, '表达0')
assert.equal(multiExpanded.note.entries[0].expansion.moreExamples[0].en, 'More 0.')
assert.equal(multiExpanded.note.entries[0].expansion.discrimination, '辨析0')
assert.deepEqual(multiExpanded.note.entries[0].expansion.wordForms.map(form => form.kind), ['derivative', 'same-root'])
assert.deepEqual(multiExpanded.note.entries[1].expansion.wordForms.map(form => form.word), ['form-1'], 'shared word form removed across entries')
assert.equal(streamCalls.length, 4)

// Editing preserves the expansion of an entry whose text is unchanged.
const edited = await tool3.execute({
  action: 'update',
  id: multi.note.id,
  text: 'look after | 照顾\nput off | 推迟',
  category: 'phrase',
  tags: ['phrasal verb'],
}, {})
assert.equal(edited.status, 'ok')
assert.equal(edited.note.entries.length, 2)
assert.equal(edited.note.entries[0].text, 'look after')
assert.ok(edited.note.entries[0].expansion, 'unchanged entry keeps its expansion')
assert.equal(edited.note.entries[1].text, 'put off')
assert.equal(edited.note.entries[1].expansion, undefined, 'new entry has no expansion')
assert.deepEqual(edited.note.tags, ['phrasal verb'])
assert.equal(edited.note.text, 'look after\nput off')

// Expanding one entry only leaves the other entry untouched.
const oneEntry = await tool3.execute({ action: 'expand', id: multi.note.id, entryId: edited.note.entries[1].id }, {})
assert.equal(oneEntry.status, 'ok')
assert.ok(oneEntry.note.entries[1].expansion)
assert.equal(oneEntry.note.entries[0].expansion.meaning, '释义1', 'the untouched entry keeps its old expansion')

// Whole-wall organization: the model plan is validated, then applied to notes.
const beforeOrganize = await services3.englishNotes.snapshot()
const organized = await services3.englishNotes.organizeWall()
assert.equal(organized.status, 'ok')
assert.equal(organized.plan.groups.length, 2)
assert.equal(organized.plan.summary, '整理总览')
assert.equal(organized.plan.relations.length, 1)
assert.equal(organized.plan.categories.length, 1)
const plannedIds = organized.plan.groups.flatMap(group => group.noteIds)
assert.equal(new Set(plannedIds).size, beforeOrganize.notes.length, 'every note appears exactly once')
assert.ok(streamCalls.at(-1).messages[0].content[0].text.includes(beforeOrganize.notes[0].id))
const snapshotOrganized = await services3.englishNotes.snapshot()
assert.equal(snapshotOrganized.usage.total.calls, beforeOrganize.usage.total.calls + 1)
assert.equal(snapshotOrganized.usage.last.purpose, 'organize')
assert.equal(snapshotOrganized.usage.purposes.organize.calls, 1)
assert.equal(snapshotOrganized.usage.purposes.organize.total, 120)

const applied = await services3.englishNotes.applyOrganization(organized.plan)
assert.equal(applied.status, 'ok')
assert.equal(applied.organization.groups.length, 2)
const afterOrganize = await services3.englishNotes.snapshot()
assert.equal(afterOrganize.organization.summary, '整理总览')
assert.equal(afterOrganize.organization.groups[0].title, '测试主题一')
const firstPlanned = afterOrganize.notes.find(note => note.id === plannedIds[0])
assert.equal(firstPlanned.topic, '测试主题一')
assert.equal(firstPlanned.position, 0)
assert.equal(firstPlanned.category, 'collocation')
assert.ok(firstPlanned.tags.includes('测试'))
assert.ok(afterOrganize.notes.every(note => note.topic))

// Re-organizing replaces the topic tags it added earlier.
const retagged = await services3.englishNotes.applyOrganization({
  groups: [{ title: '新主题', summary: '重排', tags: [], noteIds: [plannedIds[0]] }],
  categories: [],
  relations: [],
  summary: '重排总览',
})
assert.equal(retagged.status, 'ok')
const afterRetag = await services3.englishNotes.snapshot()
const retaggedNote = afterRetag.notes.find(note => note.id === plannedIds[0])
assert.equal(retaggedNote.topic, '新主题')
assert.equal(retaggedNote.tags.includes('测试'), false, 'previous organization tag removed')
assert.equal(retaggedNote.tags.includes('复习'), false)
assert.equal(afterRetag.organization.groups.length, 1)

const invalidPlan = await services3.englishNotes.applyOrganization({ groups: [] })
assert.equal(invalidPlan.status, 'invalid')

// Organization fields survive a Host restart.
for (const dispose of third.disposers) {
  try {
    await dispose()
  } catch {
    /* cleanup */
  }
}
const services6 = {}
const sixth = makeContext(services6)
apply(sixth.ctx)
const persisted = await services6.englishNotes.snapshot()
assert.equal(persisted.organization.summary, '重排总览')
assert.equal(persisted.settings.priceInput, 2)
assert.equal(persisted.settings.currency, '¥')
assert.equal(persisted.usage.purposes.organize.calls, 1)
const persistedNote = persisted.notes.find(note => note.id === plannedIds[0])
assert.equal(persistedNote.topic, '新主题')
assert.equal(persistedNote.position, 0)
for (const dispose of sixth.disposers) {
  try {
    await dispose()
  } catch {
    /* cleanup */
  }
}

for (const dispose of third.disposers) {
  try {
    await dispose()
  } catch {
    /* cleanup */
  }
}

await rm(home, { recursive: true, force: true })
console.log('host tests passed')
