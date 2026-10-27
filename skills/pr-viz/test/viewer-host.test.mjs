import assert from 'node:assert/strict'
import { test } from 'node:test'
import { envFlagTrue, isPrVizComViewer } from '../lib/viewer-host.mjs'

test('isPrVizComViewer matches hosted SaaS only', () => {
  assert.equal(isPrVizComViewer('https://pr-viz.com'), true)
  assert.equal(isPrVizComViewer('https://pr-viz.com/'), true)
  assert.equal(isPrVizComViewer('https://www.pr-viz.com/d/x'), true)
  assert.equal(isPrVizComViewer('http://127.0.0.1:8080'), false)
  assert.equal(isPrVizComViewer('https://pr-viz.example.com'), false)
  assert.equal(isPrVizComViewer('https://viewer.mycorp.internal'), false)
})

test('envFlagTrue accepts common truthy forms', () => {
  assert.equal(envFlagTrue('X', { X: '1' }), true)
  assert.equal(envFlagTrue('X', { X: 'true' }), true)
  assert.equal(envFlagTrue('X', { X: 'YES' }), true)
  assert.equal(envFlagTrue('X', { X: '0' }), false)
  assert.equal(envFlagTrue('X', {}), false)
})
