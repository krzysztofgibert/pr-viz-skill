import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { envFlagTrue, isPrVizComViewer, resolveViewerBase } from '../lib/viewer-host.mjs'

test('isPrVizComViewer matches hosted SaaS only', () => {
  assert.equal(isPrVizComViewer('https://pr-viz.com'), true)
  assert.equal(isPrVizComViewer('https://pr-viz.com/'), true)
  assert.equal(isPrVizComViewer('https://www.pr-viz.com/d/x'), true)
  assert.equal(isPrVizComViewer('http://127.0.0.1:8080'), false)
  assert.equal(isPrVizComViewer('https://pr-viz.example.com'), false)
  assert.equal(isPrVizComViewer('https://viewer.mycorp.internal'), false)
})

test('resolveViewerBase prefers env, then host.local.json, then host.json', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-viz-host-'))
  fs.writeFileSync(path.join(dir, 'host.json'), JSON.stringify({ baseUrl: 'https://pr-viz.com/' }))
  assert.equal(resolveViewerBase({}, dir), 'https://pr-viz.com')
  fs.writeFileSync(
    path.join(dir, 'host.local.json'),
    JSON.stringify({ baseUrl: 'http://127.0.0.1:8080/' }),
  )
  assert.equal(resolveViewerBase({}, dir), 'http://127.0.0.1:8080')
  assert.equal(
    resolveViewerBase({ PR_VIZ_BASE_URL: 'http://localhost:5175/' }, dir),
    'http://localhost:5175',
  )
  fs.rmSync(dir, { recursive: true, force: true })
})

test('envFlagTrue accepts common truthy forms', () => {
  assert.equal(envFlagTrue('X', { X: '1' }), true)
  assert.equal(envFlagTrue('X', { X: 'true' }), true)
  assert.equal(envFlagTrue('X', { X: 'YES' }), true)
  assert.equal(envFlagTrue('X', { X: '0' }), false)
  assert.equal(envFlagTrue('X', {}), false)
})
