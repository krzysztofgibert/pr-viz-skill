#!/usr/bin/env node
/**
 * Publish a diagram JSON to a PR Viz server (local or EC2).
 *
 * Usage:
 *   node skills/pr-viz/scripts/publish-diagram.mjs path/to/diagram.json
 *   node skills/pr-viz/scripts/publish-diagram.mjs path/to/diagram.json --no-open
 *
 * Env:
 *   PR_VIZ_BASE_URL=http://127.0.0.1:8080   (or https://pr-viz.example.com)
 *   PR_VIZ_NO_OPEN=1                        (skip opening the system browser)
 *
 * Requires Node.js 18+ (native fetch).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2).map((a) => String(a).trim()).filter(Boolean)
const noOpenFlag = args.includes('--no-open')
const noOpenEnv = String(process.env.PR_VIZ_NO_OPEN || '')
  .trim()
  .toLowerCase()
const noOpen =
  noOpenFlag || noOpenEnv === '1' || noOpenEnv === 'true'
// Allow paths like ./-diagram.json (do not treat leading "-" as a flag except --no-open).
const file = args.find((a) => a !== '--no-open')
if (!file) {
  console.error('Usage: node publish-diagram.mjs <diagram.json> [--no-open]')
  process.exit(1)
}

function bundledHostUrl() {
  try {
    const hostFile = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'host.json',
    )
    const raw = JSON.parse(fs.readFileSync(hostFile, 'utf8'))
    const url = typeof raw?.baseUrl === 'string' ? raw.baseUrl.trim() : ''
    return url ? url.replace(/\/+$/, '') : ''
  } catch {
    return ''
  }
}

const base = (
  (process.env.PR_VIZ_BASE_URL || '').trim() ||
  bundledHostUrl() ||
  'http://127.0.0.1:8080'
).replace(/\/+$/, '')

let payload
try {
  payload = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'))
} catch (err) {
  console.error(
    `Error reading diagram JSON from "${file}": ${err instanceof Error ? err.message : err}`,
  )
  process.exit(1)
}

let res
try {
  res = await fetch(`${base}/api/diagrams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
} catch (err) {
  console.error(
    `Cannot connect to PR Viz server at ${base}. Is the app running? Error: ${err instanceof Error ? err.message : err}`,
  )
  process.exit(1)
}

const text = await res.text()
let body
try {
  body = JSON.parse(text)
} catch {
  body = { error: text }
}

// Normalize relative diagram URLs against the publish base.
let url = typeof body.url === 'string' ? body.url.trim() : ''
if (url && !/^https?:\/\//i.test(url)) {
  url = `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

if (!res.ok || !url) {
  console.error(
    body.error ||
      (!url ? 'Server response is missing a valid "url" field.' : text),
  )
  process.exit(1)
}

console.log(url)

if (!noOpen && url) {
  try {
    openExternal(url)
  } catch (err) {
    console.error(`Could not open browser: ${err instanceof Error ? err.message : err}`)
  }
}

function openExternal(target) {
  if (process.platform === 'darwin') {
    execFileSync('open', [target], { stdio: 'ignore' })
    return
  }
  if (process.platform === 'win32') {
    // Bypass cmd.exe so &, ?, = in URLs are not interpreted as shell syntax.
    execFileSync('rundll32', ['url.dll,FileProtocolHandler', target], {
      stdio: 'ignore',
    })
    return
  }
  execFileSync('xdg-open', [target], { stdio: 'ignore' })
}
