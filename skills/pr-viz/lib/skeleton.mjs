/**
 * Prep for /pr-viz: real diff lines on every card, before the review is written.
 * The browser stays closed until the judgment is in the file.
 * A finished diagram for the same head SHA is reused instead of rebuilt.
 */

const PHASES = new Set(['files', 'findings', 'prompts', 'done'])

function pathFromGitLine(line) {
  const match = line.match(
    /^diff --git (?:"a\/(.+)"|a\/(.+?)) (?:"b\/(.+)"|b\/(.+))$/,
  )
  return match?.[3] || match?.[4] || match?.[1] || match?.[2] || ''
}

/**
 * Each changed file with its unified-diff lines.
 * `lineNumber` is the new-file line for context and additions.
 */
export function parseDiffFiles(diff) {
  /** @type {{ filePath: string, diff: { kind: 'add' | 'del' | 'context', text: string, lineNumber?: number }[] }[]} */
  const files = []
  /** @type {Map<string, (typeof files)[number]>} */
  const byPath = new Map()
  let current = null
  let newLine = 0
  let inHunk = false
  for (const line of String(diff || '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      const file = pathFromGitLine(line)
      inHunk = false
      if (!file || file === '/dev/null') {
        current = null
        continue
      }
      current = byPath.get(file)
      if (!current) {
        current = { filePath: file, diff: [] }
        byPath.set(file, current)
        files.push(current)
      }
      continue
    }
    if (!current) continue
    if (line.startsWith('@@')) {
      const hunk = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/)
      newLine = hunk ? Number(hunk[1]) : 1
      inHunk = true
      continue
    }
    if (!inHunk || line.startsWith('\\')) continue
    if (line.startsWith('+')) {
      current.diff.push({ kind: 'add', text: line.slice(1), lineNumber: newLine })
      newLine += 1
    } else if (line.startsWith('-')) {
      current.diff.push({ kind: 'del', text: line.slice(1) })
    } else if (line.startsWith(' ')) {
      current.diff.push({ kind: 'context', text: line.slice(1), lineNumber: newLine })
      newLine += 1
    }
  }
  return files
}

/** Paths touched by a unified diff, in order, without duplicates. */
export function parseDiffPaths(diff) {
  return parseDiffFiles(diff).map((file) => file.filePath)
}

/** How many diff lines a card stores. The rest of the file stays out of the window. */
export const CARD_DIFF_LIMIT = 14

/** A short excerpt around the first change, not the whole file. */
export function clipDiff(lines, limit = CARD_DIFF_LIMIT) {
  const rows = Array.isArray(lines) ? lines : []
  if (rows.length <= limit) return rows
  const changeAt = rows.findIndex((line) => line && (line.kind === 'add' || line.kind === 'del'))
  const start = changeAt < 0 ? 0 : Math.max(0, changeAt - 2)
  return rows.slice(start, start + limit)
}

export function diagramId({ owner, repo, number, headSha }) {
  const short = String(headSha || '')
    .replace(/^v/, '')
    .slice(0, 7)
  const raw = `${owner}-${repo}-${number}-${short}`
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^-+/, '')
  return safe.slice(0, 180) || 'diagram'
}

/** A map we can show again without analyzing. In-progress maps are not complete. */
export function isCompleteDiagram(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.blocks)) return false
  if (data.blocks.some((block) => block && block.pending === true)) return false
  const phase = data.build && data.build.phase
  if (phase) return PHASES.has(phase) && phase === 'done'
  return data.blocks.length > 0
}

/**
 * Local draft only. Every card already has its diff.
 * Do not publish this. The first publish is after the judgment is written.
 * @param {{ id: string, pr: object, files: { filePath: string, diff: object[] }[], createdAt?: string }} input
 */
export function buildSkeleton(input) {
  const files = Array.isArray(input.files) ? input.files : []
  const createdAt = input.createdAt || new Date().toISOString()
  return {
    id: input.id,
    version: 1,
    createdAt,
    summary: 'Review in progress. Explain and Add comment are still being written.',
    build: { phase: 'findings', label: 'Writing findings' },
    pr: input.pr,
    blocks: files.map((file, index) => {
      const filePath = typeof file === 'string' ? file : file.filePath
      const diff = clipDiff(typeof file === 'string' ? [] : file.diff)
      return {
        id: `f-${index + 1}`,
        zone: 'review',
        title: filePath.split('/').pop() || filePath,
        description: '',
        filePath,
        diff,
        reviewPaste: '',
        explainPrompt: '',
      }
    }),
    edges: [],
  }
}

/** owner / repo / number from a GitHub pull URL. */
export function identityFromUrl(url) {
  const match = String(url || '').match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i)
  if (!match) return null
  return { owner: match[1], repo: match[2], number: Number(match[3]) }
}
