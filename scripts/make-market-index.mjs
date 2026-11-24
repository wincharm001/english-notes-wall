#!/usr/bin/env node
/**
 * Rebuild `docs/index.json` (plugin market index format 1) from the versions
 * that are actually published on npm, and copy the plugin icon beside it.
 *
 * Run it after `npm publish`; publishing first is what makes the index valid.
 * Usage: node scripts/make-market-index.mjs
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN_DIR = path.join(ROOT, 'english-notes-wall')
const DOCS_DIR = path.join(ROOT, 'docs')
const REGISTRY = (process.env.NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/$/, '')
const REPOSITORY = 'https://github.com/wincharm001/english-notes-wall'
const TITLE = { en: 'English Notes Wall', zh: '英语便利贴墙' }
const DESCRIPTION = {
  en: 'An English-learning sticky-note wall with spaced repetition, daily quizzes and an IELTS essay reader.',
  zh: '英语学习便利贴墙：间隔复习、每日测验和雅思范文阅读器。',
}

const pkg = JSON.parse(await readFile(path.join(PLUGIN_DIR, 'package.json'), 'utf8'))
const response = await fetch(`${REGISTRY}/${pkg.name}`)
if (!response.ok) {
  console.error(`Cannot read ${pkg.name} from ${REGISTRY}: HTTP ${response.status}. Publish the package first.`)
  process.exit(1)
}
const meta = await response.json()

// npm can leave a `0.0.0-stage` placeholder next to a real release; it is not an install target.
const versions = Object.keys(meta.versions)
  .filter(version => !version.startsWith('0.0.0-'))
  .map(version => ({
    version,
    publishTimestamp: Math.floor(Date.parse(meta.time[version]) / 1000),
    source: { type: 'npm' },
    ...(pkg.engines?.dsh ? { engines: { dsh: pkg.engines.dsh } } : {}),
  }))
  .filter(entry => Number.isInteger(entry.publishTimestamp) && entry.publishTimestamp >= 0 && entry.publishTimestamp < 1e11)
  .sort((left, right) => right.publishTimestamp - left.publishTimestamp)

if (versions.length === 0) {
  console.error(`No publish timestamps for ${pkg.name}; nothing to write.`)
  process.exit(1)
}

const index = {
  format: 1,
  title: TITLE,
  description: DESCRIPTION,
  plugins: [{
    name: pkg.name,
    title: TITLE,
    description: DESCRIPTION,
    author: 'wincharm001',
    icon: './icon.svg',
    homepage: pkg.homepage,
    repository: { url: REPOSITORY },
    versions,
  }],
}

await mkdir(DOCS_DIR, { recursive: true })
await copyFile(path.join(PLUGIN_DIR, 'icon.svg'), path.join(DOCS_DIR, 'icon.svg'))
await writeFile(path.join(DOCS_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
console.log(`Wrote docs/index.json with ${versions.length} version(s): ${versions.map(entry => entry.version).join(', ')}`)
