#!/usr/bin/env node
/**
 * Post PR Viz review comments to GitHub as a pending review, as the user, with
 * the user's own GitHub CLI login. The diagram buttons do not start this.
 * One comment copies and opens the line; a batch uses a token in the browser.
 * This script is only for someone who runs it themselves.
 *
 * Usage: node skills/pr-viz/scripts/post-review.mjs <job-id> [--base <pr-viz-url>]
 *
 * - No token is read, printed, or passed on a command line; `gh` uses its own
 *   stored login. Comment text goes to `gh` through stdin.
 * - Only talks to the PR Viz server from host.json / PR_VIZ_BASE_URL (or a
 *   loopback URL with the same port) and to GitHub through `gh`.
 * - Comments land in the user's PENDING review; nothing is public until they
 *   press "Submit review" on GitHub.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MUTATION_GAP_MS = 1000
const NAME_RE = /^[A-Za-z0-9_.-]{1,100}$/
const SHA_RE = /^[0-9a-f]{40}$/i

function fail(message, code = 1) {
  console.error(`PR Viz: ${message}`)
  process.exit(code)
}

function configuredBase() {
  const fromEnv = String(process.env.PR_VIZ_BASE_URL || '').trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  try {
    const hostFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'host.json')
    const raw = JSON.parse(fs.readFileSync(hostFile, 'utf8'))
    if (typeof raw?.baseUrl === 'string' && raw.baseUrl.trim()) {
      return raw.baseUrl.trim().replace(/\/+$/, '')
    }
  } catch {
    /* no host.json */
  }
  return 'http://127.0.0.1:8080'
}

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

function sameServer(a, b) {
  try {
    const x = new URL(a)
    const y = new URL(b)
    if (x.origin === y.origin) return true
    return LOOPBACK.has(x.hostname) && LOOPBACK.has(y.hostname) && x.port === y.port
  } catch {
    return false
  }
}

const args = process.argv.slice(2)
const jobId = args.find((a) => /^[0-9a-f]{32}$/.test(a))
if (!jobId) fail('Usage: node skills/pr-viz/scripts/post-review.mjs <job-id> [--base <url>]', 2)
const baseFlag = args.indexOf('--base')
const requestedBase = baseFlag >= 0 ? String(args[baseFlag + 1] || '').replace(/\/+$/, '') : ''
const base = configuredBase()
if (requestedBase && !sameServer(requestedBase, base)) {
  fail(
    `refusing to read a job from ${requestedBase}: this skill pack is set up for ${base} (skills/pr-viz/host.json).`,
    2,
  )
}
const serverBase = requestedBase || base
const jobUrl = `${serverBase}/api/post-jobs/${jobId}`

async function server(method, url, body) {
  let res
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    fail(`cannot reach PR Viz at ${serverBase} (${err instanceof Error ? err.message : err}).`)
  }
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function gh(ghArgs, input) {
  return new Promise((resolve) => {
    const child = spawn('gh', ghArgs, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
    })
    child.stderr.on('data', (d) => {
      err += d
    })
    child.on('error', (e) => {
      resolve({
        ok: false,
        out,
        err: e.code === 'ENOENT' ? 'GitHub CLI (gh) is not installed — https://cli.github.com' : String(e.message),
      })
    })
    child.on('close', (code) => resolve({ ok: code === 0, out, err }))
    child.stdin.end(input == null ? '' : JSON.stringify(input))
  })
}

class GhError extends Error {}

function ghMessage(result) {
  try {
    const parsed = JSON.parse(result.out)
    if (parsed?.message) return String(parsed.message)
  } catch {
    /* not JSON */
  }
  return (result.err.trim().split('\n').pop() || 'gh failed').slice(0, 400)
}

async function ghJson(ghArgs, input) {
  const result = await gh(ghArgs, input)
  if (!result.ok) throw new GhError(ghMessage(result))
  return result.out.trim() ? JSON.parse(result.out) : {}
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// --- load + claim the job -------------------------------------------------

const loaded = await server('GET', jobUrl)
if (loaded.status !== 200) fail(loaded.data?.error || `job not found (${loaded.status}).`)
const job = loaded.data
if (job.status !== 'waiting') fail('these comments were already posted (or are being posted).')

let prUrl
try {
  prUrl = new URL(job.pr?.url)
} catch {
  fail('job has an invalid PR URL.')
}
const host = prUrl.hostname.toLowerCase()
const owner = String(job.pr.owner || '')
const repo = String(job.pr.repo || '')
const number = Number(job.pr.number)
const headSha = SHA_RE.test(String(job.pr.headSha || '')) ? job.pr.headSha : undefined
if (!NAME_RE.test(owner) || !NAME_RE.test(repo) || !Number.isInteger(number) || number < 1) {
  fail('job has an invalid PR reference.')
}
const items = Array.isArray(job.items) ? job.items : []
const prPath = `repos/${owner}/${repo}/pulls/${number}`
const web = host === 'github.com' ? 'https://github.com' : `https://${host}`
const reviewUrl = `${web}/${owner}/${repo}/pull/${number}/files`

console.log(`PR Viz: ${items.length} comment(s) for ${owner}/${repo}#${number}:`)
for (const item of items) console.log(`  - ${item.path}:${item.line}  ${String(item.body).split('\n')[0].slice(0, 90)}`)

const auth = await gh(['auth', 'status', '--hostname', host])
if (!auth.ok) {
  fail(
    auth.err.includes('not installed')
      ? auth.err
      : `GitHub CLI isn't logged in to ${host}. Run \`gh auth login --hostname ${host}\`, then click post again in PR Viz.`,
  )
}

const claimed = await server('POST', `${jobUrl}/claim`)
if (claimed.status !== 200) fail(claimed.data?.error || 'could not claim this job.')

// --- post -----------------------------------------------------------------

const results = []
let fatal = null

async function report() {
  await server('POST', `${jobUrl}/result`, { results, reviewUrl, error: fatal ?? undefined })
}

try {
  const me = await ghJson(['api', '--hostname', host, 'user'])
  const login = typeof me.login === 'string' ? me.login : ''

  let review = null
  for (let page = 1; page <= 10 && !review; page += 1) {
    const rows = await ghJson(['api', '--hostname', host, `${prPath}/reviews?per_page=100&page=${page}`])
    if (!Array.isArray(rows)) break
    review =
      rows.find(
        (r) =>
          r?.state === 'PENDING' &&
          (!login || String(r?.user?.login || '').toLowerCase() === login.toLowerCase()),
      ) ?? null
    if (rows.length < 100) break
  }
  if (!review) {
    try {
      review = await ghJson(
        ['api', '--hostname', host, '-X', 'POST', `${prPath}/reviews`, '--input', '-'],
        headSha ? { commit_id: headSha } : {},
      )
    } catch (err) {
      if (headSha && /commit/i.test(String(err.message))) {
        review = await ghJson(['api', '--hostname', host, '-X', 'POST', `${prPath}/reviews`, '--input', '-'], {})
      } else {
        throw err
      }
    }
  }
  if (!review?.node_id) throw new GhError('GitHub did not return a pending review.')

  const query = `mutation($id: ID!, $body: String!, $path: String!, $line: Int!) {
    addPullRequestReviewThread(input: { pullRequestReviewId: $id, body: $body, path: $path, line: $line, side: RIGHT }) {
      thread { comments(first: 1) { nodes { databaseId } } }
    }
  }`
  const outside = []
  let mutated = false
  for (const item of items) {
    if (mutated) await sleep(MUTATION_GAP_MS)
    mutated = true
    const variables = {
      id: review.node_id,
      body: String(item.body),
      path: String(item.path).replace(/^\.\//, '').replace(/^\/+/, ''),
      line: Number(item.line),
    }
    const result = await gh(['api', '--hostname', host, 'graphql', '--input', '-'], { query, variables })
    if (result.ok) {
      let commentId
      try {
        commentId = JSON.parse(result.out)?.data?.addPullRequestReviewThread?.thread?.comments?.nodes?.[0]?.databaseId
      } catch {
        commentId = undefined
      }
      results.push({ key: item.key, status: 'inline', commentId })
      console.log(`  ✓ ${item.path}:${item.line}`)
      continue
    }
    const message = ghMessage(result)
    if (/diff|line|path|position|resolve|hunk/i.test(message) && !/saml|sso|forbidden|not accessible/i.test(message)) {
      outside.push(item)
      continue
    }
    results.push({ key: item.key, status: 'error', message })
    console.log(`  ✗ ${item.path}:${item.line} — ${message}`)
    if (/saml|sso|forbidden|not accessible|bad credentials|401|403/i.test(message)) {
      fatal = message
      for (const rest of items.slice(items.indexOf(item) + 1)) {
        results.push({ key: rest.key, status: 'error', message })
      }
      break
    }
  }

  if (outside.length > 0 && !fatal) {
    await sleep(MUTATION_GAP_MS)
    const lines = outside.map((item) => {
      const filePath = String(item.path).split('/').map(encodeURIComponent).join('/')
      const view = headSha
        ? `${web}/${owner}/${repo}/blob/${headSha}/${filePath}#L${item.line}`
        : reviewUrl
      return `- \`${item.path}\` line ${item.line} ([view](${view})):\n  ${String(item.body).replace(/\r\n/g, '\n').split('\n').join('\n  ')}`
    })
    const section = `**Comments on lines outside this PR's diff**\n\n${lines.join('\n')}`
    const existing = String(review.body || '').trim()
    try {
      await ghJson(['api', '--hostname', host, '-X', 'PUT', `${prPath}/reviews/${review.id}`, '--input', '-'], {
        body: existing ? `${existing}\n\n${section}` : section,
      })
      for (const item of outside) {
        results.push({ key: item.key, status: 'summary' })
        console.log(`  ✓ ${item.path}:${item.line} (outside the diff — added to the review summary)`)
      }
    } catch (err) {
      for (const item of outside) {
        results.push({ key: item.key, status: 'error', message: `Line isn't in the PR diff: ${err.message}` })
      }
    }
  }
} catch (err) {
  fatal = err instanceof Error ? err.message : String(err)
  for (const item of items) {
    if (!results.some((r) => r.key === item.key)) {
      results.push({ key: item.key, status: 'error', message: fatal })
    }
  }
}

await report()

const ok = results.filter((r) => r.status !== 'error').length
if (fatal) {
  console.error(`PR Viz: stopped — ${fatal}`)
  if (/saml|sso/i.test(fatal)) {
    console.error(`  Your organization uses SSO: run \`gh auth refresh --hostname ${host}\` and approve it, then post again.`)
  }
}
console.log(`PR Viz: ${ok}/${items.length} added to your pending review.`)
console.log(`Open ${reviewUrl} and press "Submit review" when you're happy with them.`)
process.exit(fatal ? 1 : 0)
