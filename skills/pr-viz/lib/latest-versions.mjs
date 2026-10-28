/**
 * Soft latest-version lookups for preflight (viewer on Docker Hub, skill on GitHub).
 */
import { compareSemver, parseSemver } from './semver.mjs'

const HUB_TAGS =
  'https://hub.docker.com/v2/repositories/gprojekt/pr-viz/tags?page_size=25&ordering=-last_updated'
const SKILL_LATEST_RELEASE =
  'https://api.github.com/repos/krzysztofgibert/pr-viz-skill/releases/latest'

/**
 * @param {string} url
 * @param {number} timeoutMs
 * @param {string} [accept]
 */
async function getJson(url, timeoutMs, accept = 'application/json') {
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
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: false, status: 0, json: null }
  }
}

/**
 * @returns {Promise<string | null>}
 */
export async function fetchLatestViewerVersion() {
  const res = await getJson(HUB_TAGS, 6000)
  if (!res.ok || !res.json) return null
  const names = (res.json.results || [])
    .map((row) => String(row?.name || ''))
    .filter((name) => /^\d+\.\d+\.\d+$/.test(name))
  let newest = null
  for (const name of names) {
    if (!newest || compareSemver(name, newest) > 0) newest = name
  }
  return newest
}

/**
 * @returns {Promise<string | null>}
 */
export async function fetchLatestSkillVersion() {
  const res = await getJson(SKILL_LATEST_RELEASE, 6000, 'application/vnd.github+json')
  if (!res.ok || !res.json) return null
  const tag = String(res.json.tag_name || '').replace(/^v/, '')
  return parseSemver(tag) ? tag : null
}
