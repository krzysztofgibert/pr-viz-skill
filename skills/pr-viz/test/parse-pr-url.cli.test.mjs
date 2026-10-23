import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'parse-pr-url.mjs')

describe('parse-pr-url.mjs CLI', () => {
  it('prints JSON for a valid URL', () => {
    const r = spawnSync(process.execPath, [script, 'https://github.com/acme/app/pull/12'], {
      encoding: 'utf8',
    })
    assert.equal(r.status, 0)
    const json = JSON.parse(r.stdout)
    assert.equal(json.number, 12)
    assert.equal(json.owner, 'acme')
  })

  it('exits 1 without args', () => {
    const r = spawnSync(process.execPath, [script], { encoding: 'utf8' })
    assert.equal(r.status, 1)
  })

  it('exits 1 on invalid URL', () => {
    const r = spawnSync(process.execPath, [script, 'https://example.com'], { encoding: 'utf8' })
    assert.equal(r.status, 1)
  })
})
