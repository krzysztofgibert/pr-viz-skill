#!/usr/bin/env node
/**
 * Parse a GitHub / GitHub Enterprise PR URL into owner/repo/number.
 * Usage: node parse-pr-url.mjs <pr-url>
 */
const raw = String(process.argv[2] || '').trim()
if (!raw) {
  console.error('Usage: node parse-pr-url.mjs <github-pr-url>')
  process.exit(1)
}

const match = raw.match(
  /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?\/pull\/(\d+)(?:\/[^?#]*)?\/?(?:[?#].*)?$/i,
)
if (!match) {
  console.error('Invalid GitHub PR URL')
  process.exit(1)
}

const [, host, owner, repoRaw, number] = match
const repo = repoRaw.replace(/\.git$/i, '')
const cleanUrl = `https://${host}/${owner}/${repo}/pull/${number}`
const payload = { host, owner, repo, number: Number(number), url: cleanUrl }
console.log(JSON.stringify(payload))
