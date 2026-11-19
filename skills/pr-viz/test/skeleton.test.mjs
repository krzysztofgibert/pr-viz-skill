import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildSkeleton,
  diagramId,
  identityFromUrl,
  isCompleteDiagram,
  parseDiffFiles,
  parseDiffPaths,
} from '../lib/skeleton.mjs'

test('parseDiffPaths keeps order and skips duplicates', () => {
  const diff = [
    'diff --git a/src/a.ts b/src/a.ts',
    '--- a/src/a.ts',
    '+++ b/src/a.ts',
    'diff --git a/README.md b/README.md',
    'diff --git a/src/a.ts b/src/a.ts',
    'diff --git "a/docs/my file.md" "b/docs/my file.md"',
  ].join('\n')
  assert.deepEqual(parseDiffPaths(diff), ['src/a.ts', 'README.md', 'docs/my file.md'])
})

test('diagramId uses a 7-character sha and stays url-safe', () => {
  assert.equal(
    diagramId({
      owner: 'acme',
      repo: 'app',
      number: 12,
      headSha: 'abcdef1234567890',
    }),
    'acme-app-12-abcdef1',
  )
})

test('identityFromUrl reads owner, repo, and number', () => {
  assert.deepEqual(
    identityFromUrl('https://github.com/acme/app/pull/12'),
    { owner: 'acme', repo: 'app', number: 12 },
  )
  assert.equal(identityFromUrl('https://example.com/nope'), null)
})

test('a finished map is reusable and an in-progress map is not', () => {
  assert.equal(
    isCompleteDiagram({
      version: 1,
      blocks: [{ id: 'f-1', pending: false }],
    }),
    true,
  )
  assert.equal(
    isCompleteDiagram({
      version: 1,
      build: { phase: 'done' },
      blocks: [{ id: 'f-1' }],
    }),
    true,
  )
  assert.equal(
    isCompleteDiagram({
      version: 1,
      build: { phase: 'files' },
      blocks: [{ id: 'f-1', pending: true }],
    }),
    false,
  )
  assert.equal(
    isCompleteDiagram({
      version: 1,
      build: { phase: 'prompts' },
      blocks: [{ id: 'f-1', pending: false, reviewPaste: '', explainPrompt: '' }],
    }),
    false,
  )
})

test('parseDiffFiles keeps the added line and its new-file number', () => {
  const diff = [
    'diff --git a/src/a.ts b/src/a.ts',
    '@@ -10,2 +10,3 @@',
    ' keep',
    '+added',
    ' tail',
  ].join('\n')
  const [file] = parseDiffFiles(diff)
  assert.equal(file.filePath, 'src/a.ts')
  assert.deepEqual(file.diff, [
    { kind: 'context', text: 'keep', lineNumber: 10 },
    { kind: 'add', text: 'added', lineNumber: 11 },
    { kind: 'context', text: 'tail', lineNumber: 12 },
  ])
})

test('buildSkeleton puts the diff on each card and does not mark it pending', () => {
  const diagram = buildSkeleton({
    id: 'acme-app-12-abcdef1',
    pr: { owner: 'acme', repo: 'app', number: 12, title: 'Fix', url: 'https://github.com/acme/app/pull/12', headSha: 'abcdef1234567890' },
    files: [{ filePath: 'src/a.ts', diff: [{ kind: 'add', text: 'x', lineNumber: 1 }] }, { filePath: 'README.md', diff: [] }],
  })
  assert.equal(diagram.build.phase, 'findings')
  assert.equal(diagram.blocks[0].id, 'f-1')
  assert.equal(diagram.blocks[0].pending, undefined)
  assert.equal(diagram.blocks[0].diff[0].text, 'x')
})

test('buildSkeleton keeps only a short excerpt of a long diff', () => {
  const diff = []
  for (let i = 1; i <= 40; i += 1) diff.push({ kind: 'context', text: `c${i}`, lineNumber: i })
  diff[20] = { kind: 'add', text: 'changed', lineNumber: 21 }
  const diagram = buildSkeleton({
    id: 'acme-app-12-abcdef1',
    pr: { owner: 'acme', repo: 'app', number: 12, title: 'Fix', url: 'https://github.com/acme/app/pull/12', headSha: 'abcdef1' },
    files: [{ filePath: 'src/a.ts', diff }],
  })
  assert.equal(diagram.blocks[0].diff.length, 14)
  assert.equal(diagram.blocks[0].diff.some((line) => line.text === 'changed'), true)
})
