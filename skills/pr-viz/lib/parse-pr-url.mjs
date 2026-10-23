/** Parse a GitHub / GitHub Enterprise pull-request URL. */

/**
 * @param {string} raw
 * @returns {{ host: string, owner: string, repo: string, number: number, url: string } | null}
 */
export function parsePrUrl(raw) {
  const match = String(raw || '')
    .trim()
    .match(
      /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?\/pull\/(\d+)(?:\/[^?#]*)?\/?(?:[?#].*)?$/i,
    )
  if (!match) return null
  const [, host, owner, repoRaw, number] = match
  const repo = repoRaw.replace(/\.git$/i, '')
  const cleanHost = host.toLowerCase()
  return {
    host: cleanHost,
    owner,
    repo,
    number: Number(number),
    url: `https://${cleanHost}/${owner}/${repo}/pull/${number}`,
  }
}
