import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  fetchLatestSkillVersion,
  fetchLatestViewerVersion,
} from '../lib/latest-versions.mjs'

describe('latest-versions helpers (offline-safe)', () => {
  it('exports fetchers', () => {
    assert.equal(typeof fetchLatestViewerVersion, 'function')
    assert.equal(typeof fetchLatestSkillVersion, 'function')
  })
})
