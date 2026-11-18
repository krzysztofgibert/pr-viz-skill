#!/usr/bin/env node
/**
 * Open the map immediately, then let the review fill the same cards.
 *
 *   node skills/pr-viz/scripts/publish-skeleton.mjs <github-pr-url>
 *
 * Prints one JSON line:
 *   {"action":"cached","id","url"}  finished map for this commit — stop
 *   {"action":"resume","id"}        a judged map is already on disk — keep going
 *   {"action":"draft","id"}         cards have their diffs; add the judgment, then publish
 *
 * Writes diagrams/<id>.json, diagrams/<id>.meta.json, and diagrams/<id>.diff
 * so the review can continue without fetching the pull request again.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildSkeleton,
  diagramId,
  identityFromUrl,
  isCompleteDiagram,
  parseDiffFiles,
} from '../lib/skeleton.mjs'

const prUrl = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (!prUrl) {
  console.error('Usage: node skills/pr-viz/scripts/publish-skeleton.mjs <github-pr-url>')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const publishScript = path.join(here, 'publish-diagram.mjs')
const diagramsDir = path.resolve(process.cwd(), 'diagrams')

function publish(file) {
  const output = execFileSync(process.execPath, [publishScript, file], {
    encoding: 'utf8',
  })
  const url = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('http'))
  return url || ''
}

function report(action, id, url) {
  console.log(JSON.stringify({ action, id, url }))
}

async function fetchPull(url) {
  try {
    const viewRaw = execFileSync(
      'gh',
      [
        'pr',
        'view',
        url,
        '--json',
        'number,title,author,headRefOid,url,body,headRefName',
      ],
      { encoding: 'utf8' },
    )
    const diff = execFileSync('gh', ['pr', 'diff', url], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
    return { view: JSON.parse(viewRaw), diff, via: 'gh' }
  } catch {
    /* public REST, when gh is missing or logged out */
  }
  const identity = identityFromUrl(url)
  if (!identity) throw new Error('Not a GitHub pull request URL')
  const api = `https://api.github.com/repos/${identity.owner}/${identity.repo}/pulls/${identity.number}`
  const viewRes = await fetch(api, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'pr-viz-skeleton',
    },
  })
  if (!viewRes.ok) {
    throw new Error(`Could not read the pull request (${viewRes.status})`)
  }
  const body = await viewRes.json()
  const diffRes = await fetch(api, {
    headers: {
      Accept: 'application/vnd.github.diff',
      'User-Agent': 'pr-viz-skeleton',
    },
  })
  if (!diffRes.ok) {
    throw new Error(`Could not read the diff (${diffRes.status})`)
  }
  const diff = await diffRes.text()
  return {
    view: {
      number: body.number,
      title: body.title,
      author: { login: body.user?.login || '' },
      headRefOid: body.head?.sha || '',
      url: body.html_url || url,
      body: body.body || '',
      headRefName: body.head?.ref || '',
    },
    diff,
    via: 'rest',
  }
}

function prMeta(view, url) {
  const identity = identityFromUrl(view.url || url)
  if (!identity) throw new Error('Could not read owner and repo from the pull request URL')
  const author =
    view.author && typeof view.author === 'object'
      ? view.author.login || ''
      : typeof view.author === 'string'
        ? view.author
        : ''
  return {
    url: view.url || url,
    owner: identity.owner,
    repo: identity.repo,
    number: view.number || identity.number,
    title: view.title || '',
    author,
    headSha: view.headRefOid || '',
    branch: view.headRefName || '',
    description: typeof view.body === 'string' ? view.body : '',
  }
}

const loaded = await fetchPull(prUrl)
const pr = prMeta(loaded.view, prUrl)
if (!pr.headSha) {
  console.error('The pull request has no head SHA')
  process.exit(1)
}
const id = diagramId(pr)
const jsonPath = path.join(diagramsDir, `${id}.json`)
fs.mkdirSync(diagramsDir, { recursive: true })
fs.writeFileSync(path.join(diagramsDir, `${id}.meta.json`), `${JSON.stringify(pr, null, 2)}\n`)
fs.writeFileSync(path.join(diagramsDir, `${id}.diff`), loaded.diff.endsWith('\n') ? loaded.diff : `${loaded.diff}\n`)

if (fs.existsSync(jsonPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    if (isCompleteDiagram(existing)) {
      report('cached', id, publish(jsonPath))
      process.exit(0)
    }
    const judged = Array.isArray(existing.blocks)
      && existing.blocks.some((block) => block && String(block.description || '').trim())
    if (judged) {
      report('resume', id, '')
      process.exit(0)
    }
  } catch {
    /* rewrite a broken file */
  }
}

const files = parseDiffFiles(loaded.diff)
const skeleton = buildSkeleton({ id, pr, files })
fs.writeFileSync(jsonPath, `${JSON.stringify(skeleton, null, 2)}\n`)
report('draft', id, '')
