#!/usr/bin/env node
/**
 * Work out what /pr-viz needs for one PR and exactly what (if anything) to ask
 * the user. Never reads, prints, or asks for GitHub tokens.
 *
 * Usage: node skills/pr-viz/scripts/preflight.mjs <github-pr-url>
 * Prints JSON: { ok, ask[], notice[], fetch, pr, server, github, updates }
 *   ok      true when nothing needs the user to continue
 *   ask     exact requests for the user (empty = ask nothing) — must wait
 *   notice  soft update hints — tell the user, do not wait
 *   fetch   "gh" (GitHub CLI) | "rest" (public REST API) | null
 *   updates skill/viewer current vs latest (best-effort; may be null offline)
 */
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePrUrl } from '../lib/parse-pr-url.mjs'
import { compareSemver } from '../lib/semver.mjs'
import {
  fetchLatestSkillVersion,
  fetchLatestViewerVersion,
} from '../lib/latest-versions.mjs'
import { envFlagTrue, isPrVizComViewer } from '../lib/viewer-host.mjs'

const MIN_NODE_MAJOR = 18
const DOCKER_RUN =
  'docker run --rm -p 8080:8080 -v pr-viz-data:/var/lib/pr-viz/diagrams gprojekt/pr-viz:latest'
const INSTALL_PAGE = 'https://pr-viz.com/install'
const DOCKER_PULL = 'docker pull gprojekt/pr-viz:latest'

function run(cmd, args, timeoutMs = 15_000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        missing: error?.code === 'ENOENT',
        stdout: String(stdout || ''),
        stderr: String(stderr || ''),
      })
    })
  })
}

async function getJson(url, timeoutMs, accept = 'application/vnd.github+json') {
  try {
    const res = await fetch(url, {
      headers: { Accept: accept, 'User-Agent': 'pr-viz-preflight' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const raw = await res.text().catch(() => '')
    let json = null
    if (raw) {
      try {
        json = JSON.parse(raw)
      } catch {
        /* not JSON */
      }
    }
    return {
      status: res.status,
      headers: res.headers,
      text: res.ok ? '' : raw.slice(0, 300),
      json,
    }
  } catch {
    return { status: 0, headers: new Headers(), text: '', json: null }
  }
}

function readHostMeta() {
  try {
    const hostFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'host.json')
    return JSON.parse(fs.readFileSync(hostFile, 'utf8'))
  } catch {
    return {}
  }
}

function apiBase(host) {
  if (host === 'github.com') return 'https://api.github.com'
  if (host.endsWith('.ghe.com')) return `https://api.${host}`
  return `https://${host}/api/v3`
}

function serverBase() {
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

const hostMeta = readHostMeta()
const skillVersion =
  typeof hostMeta.skillVersion === 'string'
    ? hostMeta.skillVersion.replace(/^v/, '')
    : typeof hostMeta.viewerMinVersion === 'string'
      ? hostMeta.viewerMinVersion.replace(/^v/, '')
      : null
const out = {
  ok: false,
  ask: [],
  notice: [],
  fetch: null,
  pr: null,
  server: {
    url: serverBase(),
    reachable: false,
    version: null,
    viewerMinVersion:
      typeof hostMeta.viewerMinVersion === 'string' ? hostMeta.viewerMinVersion : null,
  },
  skill: {
    version: skillVersion,
  },
  updates: {
    viewer: { current: null, latest: null, updateAvailable: false },
    skill: { current: skillVersion, latest: null, updateAvailable: false },
  },
  github: { api: null, public: null, gh: { installed: false, authenticated: false, canRead: null } },
}

const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < MIN_NODE_MAJOR) {
  out.ask.push(
    `Your Node.js is ${process.versions.node}; /pr-viz needs Node.js ${MIN_NODE_MAJOR} or newer (https://nodejs.org). Please upgrade and tell me when done.`,
  )
}

const pr = parsePrUrl(process.argv[2])
if (!pr) {
  out.ask.push(
    'Please send a GitHub pull request link like https://github.com/owner/repo/pull/123.',
  )
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}
out.pr = pr
out.github.api = apiBase(pr.host)

const health = await getJson(`${out.server.url}/api/health`, 4000, 'application/json')
out.server.reachable = health.status === 200
if (health.status === 200 && health.json && typeof health.json.version === 'string') {
  out.server.version = health.json.version.replace(/^v/, '')
}
if (health.status === 403 && /PR_VIZ_ALLOWED_HOSTS/.test(health.text)) {
  const host = new URL(out.server.url).hostname
  out.ask.push(
    `PR Viz at ${out.server.url} refuses its own host name. Please ask whoever runs it to set PR_VIZ_ALLOWED_HOSTS=${host} on the server, then tell me when done.`,
  )
} else if (!out.server.reachable) {
  out.ask.push(
    `PR Viz isn't reachable at ${out.server.url}. Start it (on your machine: \`${DOCKER_RUN}\`), or tell me the URL of your team's PR Viz.`,
  )
} else if (
  out.server.viewerMinVersion &&
  out.server.version &&
  compareSemver(out.server.version, out.server.viewerMinVersion) < 0
) {
  out.ask.push(
    `This skill pack expects viewer ${out.server.viewerMinVersion}+, but ${out.server.url} is running ${out.server.version}. Please update the image (\`${DOCKER_PULL}\`) or reinstall the skill from ${INSTALL_PAGE}, then tell me when done.`,
  )
}

// Soft "newer available" checks — never block; fill notice[] + updates.
out.updates.viewer.current = out.server.version
const [viewerLatest, skillLatest] = await Promise.all([
  fetchLatestViewerVersion(),
  fetchLatestSkillVersion(),
])
out.updates.viewer.latest = viewerLatest
out.updates.skill.latest = skillLatest
if (
  out.server.version &&
  viewerLatest &&
  compareSemver(viewerLatest, out.server.version) > 0
) {
  out.updates.viewer.updateAvailable = true
  // Only soft-notice when not already a hard incompatible ask above.
  const hardViewerAsk = out.ask.some((line) => /expects viewer/i.test(line))
  if (!hardViewerAsk) {
    out.notice.push(
      `A newer PR Viz viewer is available (${out.server.version} → ${viewerLatest}). Update with \`${DOCKER_PULL}\` (or reinstall from ${INSTALL_PAGE}). You can continue with this map; the diagram will also show an update hint.`,
    )
  }
}
if (skillVersion && skillLatest && compareSemver(skillLatest, skillVersion) > 0) {
  out.updates.skill.updateAvailable = true
  out.notice.push(
    `A newer /pr-viz skill is available (${skillVersion} → ${skillLatest}). Reinstall from ${INSTALL_PAGE} when convenient. You can continue; the diagram will show an update hint.`,
  )
}

const anon = await getJson(
  `${out.github.api}/repos/${encodeURIComponent(pr.owner)}/${encodeURIComponent(pr.repo)}/pulls/${pr.number}`,
  6000,
)
const rateLimited =
  (anon.status === 403 || anon.status === 429) &&
  (anon.headers.get('x-ratelimit-remaining') === '0' || anon.headers.has('retry-after'))
if (anon.status === 200) out.github.public = true
else if (anon.status === 404 || (anon.status === 403 && !rateLimited)) out.github.public = false

const ghVersion = await run('gh', ['--version'], 5000)
out.github.gh.installed = ghVersion.ok
if (ghVersion.ok) {
  const status = await run('gh', ['auth', 'status', '--hostname', pr.host], 8000)
  out.github.gh.authenticated = status.ok
  if (status.ok && out.github.public !== true) {
    const view = await run('gh', [
      'api',
      '--hostname',
      pr.host,
      `repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`,
      '--jq',
      '.number',
    ])
    out.github.gh.canRead = view.ok
    out.github.gh.readError = view.ok ? undefined : (view.stderr.trim().split('\n').pop() || '').slice(0, 300)
  }
}

const ghReady = out.github.gh.authenticated
const install = `Install GitHub CLI (https://cli.github.com) and run \`gh auth login --hostname ${pr.host}\``

if (out.github.public === true) {
  out.fetch = ghReady ? 'gh' : 'rest'
} else if (out.github.public === false) {
  if (!out.github.gh.installed) {
    out.ask.push(
      `This PR is private (or the link is wrong). To read it, ${install.charAt(0).toLowerCase()}${install.slice(1)}, then tell me when done.`,
    )
  } else if (!ghReady) {
    out.ask.push(
      `GitHub CLI isn't logged in to ${pr.host}. Please run \`gh auth login --hostname ${pr.host}\` and tell me when done.`,
    )
  } else if (out.github.gh.canRead === false) {
    const sso = /saml|sso/i.test(out.github.gh.readError || '')
    out.ask.push(
      sso
        ? `Your GitHub CLI login can't open this PR because your organization uses SSO. Please run \`gh auth refresh --hostname ${pr.host}\` (and approve SSO in the browser), then tell me when done.`
        : `Your GitHub CLI login can't open this PR (${out.github.gh.readError || 'not found'}). Please check you have access to ${pr.owner}/${pr.repo} and that the link is right, then tell me.`,
    )
  } else {
    out.fetch = 'gh'
  }
} else if (ghReady) {
  out.fetch = 'gh'
} else if (rateLimited) {
  out.ask.push(
    `GitHub's anonymous API limit is used up for now. ${install} so I can read the PR, or try again in about an hour.`,
  )
} else {
  out.ask.push(
    `I couldn't reach ${out.github.api}. Check your network or VPN — or ${install.charAt(0).toLowerCase()}${install.slice(1)} — then tell me when done.`,
  )
}

// Private PR + public pr-viz.com viewer → explicit consent (diagram JSON may
// include short code excerpts). Other viewers (self-host / localhost) → no ask.
// Public PRs → no ask for any viewer.
if (
  out.github.public === false &&
  isPrVizComViewer(out.server.url) &&
  !envFlagTrue('PR_VIZ_ALLOW_HOSTED_VIEWER')
) {
  out.ask.push(
    `This PR looks private (or is not anonymously readable) and the skill pack publishes to ${out.server.url}. Diagram JSON may include short code excerpts. Reply yes to allow publishing there for this session (I will re-run preflight with PR_VIZ_ALLOW_HOSTED_VIEWER=1), or point skills/pr-viz/host.json / PR_VIZ_BASE_URL at your self-hosted viewer and tell me when ready.`,
  )
}

out.ok = out.ask.length === 0
console.log(JSON.stringify(out, null, 2))
