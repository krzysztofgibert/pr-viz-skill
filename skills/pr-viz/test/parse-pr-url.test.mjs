import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parsePrUrl } from '../lib/parse-pr-url.mjs'

describe('parsePrUrl', () => {
  it('parses github.com PRs', () => {
    const p = parsePrUrl('https://github.com/acme/app/pull/12')
    assert.deepEqual(p, {
      host: 'github.com',
      owner: 'acme',
      repo: 'app',
      number: 12,
      url: 'https://github.com/acme/app/pull/12',
    })
  })

  it('accepts .git, trailing slash, and query', () => {
    const p = parsePrUrl('https://github.com/acme/app.git/pull/7/files?w=1')
    assert.equal(p?.repo, 'app')
    assert.equal(p?.number, 7)
  })

  it('parses enterprise hosts', () => {
    const p = parsePrUrl('https://ghe.example.com/org/repo/pull/3')
    assert.equal(p?.host, 'ghe.example.com')
    assert.equal(p?.owner, 'org')
  })

  it('rejects non-PR URLs', () => {
    assert.equal(parsePrUrl('https://github.com/acme/app'), null)
    assert.equal(parsePrUrl('not a url'), null)
    assert.equal(parsePrUrl(''), null)
  })
})
