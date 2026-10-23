import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compareSemver, parseSemver } from '../lib/semver.mjs'

describe('parseSemver', () => {
  it('parses major.minor.patch', () => {
    assert.deepEqual(parseSemver('1.2.3'), [1, 2, 3])
  })
  it('strips a leading v', () => {
    assert.deepEqual(parseSemver('v0.1.23'), [0, 1, 23])
  })
  it('returns null for junk', () => {
    assert.equal(parseSemver(''), null)
    assert.equal(parseSemver('latest'), null)
  })
})

describe('compareSemver', () => {
  it('orders versions', () => {
    assert.ok(compareSemver('0.1.22', '0.1.23') < 0)
    assert.ok(compareSemver('0.2.0', '0.1.99') > 0)
    assert.equal(compareSemver('1.0.0', 'v1.0.0'), 0)
  })
  it('treats unparsable as equal (0)', () => {
    assert.equal(compareSemver('nope', '1.0.0'), 0)
  })
})
