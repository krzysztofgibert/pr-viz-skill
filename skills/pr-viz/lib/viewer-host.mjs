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
