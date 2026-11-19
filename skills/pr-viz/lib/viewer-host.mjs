import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const FALLBACK_BASE = 'http://127.0.0.1:8080'

function readBaseUrl(file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    const url = typeof raw?.baseUrl === 'string' ? raw.baseUrl.trim() : ''
    return url ? url.replace(/\/+$/, '') : ''
  } catch {
    return ''
  }
}

/**
 * Where /pr-viz publishes.
 * PR_VIZ_BASE_URL, then host.local.json (personal, not shipped), then host.json.
 */
export function resolveViewerBase(env = process.env, dir = packDir) {
  const fromEnv = String(env.PR_VIZ_BASE_URL || '').trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  return (
    readBaseUrl(path.join(dir, 'host.local.json')) ||
    readBaseUrl(path.join(dir, 'host.json')) ||
    FALLBACK_BASE
  )
}

/** Public SaaS viewer only — self-hosted hosts never match. */
export function isPrVizComViewer(baseUrl) {
  try {
    const raw = String(baseUrl || '').trim()
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`)
    const host = u.hostname.toLowerCase()
    return host === 'pr-viz.com' || host === 'www.pr-viz.com'
  } catch {
    return false
  }
}

export function envFlagTrue(name, env = process.env) {
  const v = String(env[name] || '')
    .trim()
    .toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}
