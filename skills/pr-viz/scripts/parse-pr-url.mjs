#!/usr/bin/env node
/**
 * Parse a GitHub / GitHub Enterprise PR URL into owner/repo/number.
 * Usage: node parse-pr-url.mjs <pr-url>
 */
import { parsePrUrl } from '../lib/parse-pr-url.mjs'

const raw = String(process.argv[2] || '').trim()
if (!raw) {
  console.error('Usage: node parse-pr-url.mjs <github-pr-url>')
  process.exit(1)
}

const payload = parsePrUrl(raw)
if (!payload) {
  console.error('Invalid GitHub PR URL')
  process.exit(1)
}

console.log(JSON.stringify(payload))
