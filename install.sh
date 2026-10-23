#!/usr/bin/env bash
# Install the /pr-viz skill into a project.
# Community repo: https://github.com/krzysztofgibert/pr-viz-skill
# Viewer: https://pr-viz.com
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/krzysztofgibert/pr-viz-skill/main/install.sh | bash
#   PR_VIZ_SKILL_REF=v0.1.21 curl -fsSL .../install.sh | bash
#   ./install.sh /path/to/project
#   ./install.sh /path/to/project all          # force every IDE adapter
#   ./install.sh /path/to/project cursor      # force one IDE
#
# Default: auto-detect which IDE folders / signals are present in the project
# (and common editor env vars). If nothing matches, install all adapters so a
# shared team repo still works for every editor.
set -euo pipefail

repo="krzysztofgibert/pr-viz-skill"
ref="${PR_VIZ_SKILL_REF:-main}"
dest="${1:-.}"
mode="${2:-auto}"   # auto | all | cursor | claude | windsurf | vscode | agents | continue

SKILL_WATCH="https://github.com/krzysztofgibert/pr-viz-skill"
SKILL_WATCH_HINT="Watch releases: ${SKILL_WATCH}/subscription (Watch → Custom → Releases)"

copy_tree() {
  local rel="${1:?rel required}"
  mkdir -p "${dest:?}/$(dirname "$rel")"
  rm -rf "${dest:?}/${rel}"
  cp -a "${src:?}/${rel}" "${dest}/${rel}"
}

detect_ides() {
  local found=()
  # Project markers (checked first)
  [[ -d "${dest}/.cursor" || -f "${dest}/.cursorrules" ]] && found+=(cursor)
  [[ -d "${dest}/.claude" ]] && found+=(claude)
  [[ -d "${dest}/.windsurf" || -f "${dest}/.windsurfrules" ]] && found+=(windsurf)
  [[ -d "${dest}/.continue" ]] && found+=(continue)
  [[ -d "${dest}/.agents" || -d "${dest}/.zed" ]] && found+=(agents)
  [[ -d "${dest}/.github/skills" || -d "${dest}/.github/prompts" || -d "${dest}/.vscode" ]] && found+=(vscode)

  # Editor / agent environment signals (when installing into cwd from that IDE)
  if [[ -n "${CURSOR_TRACE_ID:-}${CURSOR_AGENT:-}" || "${TERM_PROGRAM:-}" == "vscode" && -n "${CURSOR_SESSION_ID:-}" ]]; then
    found+=(cursor)
  fi
  if [[ -n "${CLAUDECODE:-}${CLAUDE_CODE:-}" ]]; then
    found+=(claude)
  fi
  if [[ -n "${VSCODE_PID:-}${VSCODE_INJECTION:-}" || "${TERM_PROGRAM:-}" == "vscode" ]]; then
    found+=(vscode)
  fi
  if [[ -n "${CONTINUE_GLOBAL_DIR:-}" ]]; then
    found+=(continue)
  fi

  # De-dupe while keeping order
  local out=() seen="|"
  local id
  for id in "${found[@]+"${found[@]}"}"; do
    case "$seen" in
      *"|$id|"*) ;;
      *)
        out+=("$id")
        seen="${seen}${id}|"
        ;;
    esac
  done
  if ((${#out[@]})); then
    printf '%s\n' "${out[@]}"
  fi
}

resolve_ides() {
  # Sets global: IDE_LIST (newline-separated), AUTO_FALLBACK_ALL (0|1)
  AUTO_FALLBACK_ALL=0
  case "$mode" in
    all)
      IDE_LIST=$'cursor\nclaude\nwindsurf\nvscode\nagents\ncontinue'
      ;;
    auto)
      IDE_LIST="$(detect_ides || true)"
      if [[ -z "$IDE_LIST" ]]; then
        AUTO_FALLBACK_ALL=1
        IDE_LIST=$'cursor\nclaude\nwindsurf\nvscode\nagents\ncontinue'
      fi
      ;;
    cursor|claude|windsurf|vscode|agents|continue)
      IDE_LIST="$mode"
      ;;
    *)
      echo "Unknown IDE mode: $mode (use auto|all|cursor|claude|windsurf|vscode|agents|continue)" >&2
      exit 2
      ;;
  esac
}

install_ide() {
  local id="$1"
  case "$id" in
    cursor)
      copy_tree ".cursor/skills/pr-viz"
      cp "${src}/.cursorrules" "${dest}/.cursorrules"
      ;;
    claude)
      copy_tree ".claude/skills/pr-viz"
      ;;
    windsurf)
      copy_tree ".windsurf/skills/pr-viz"
      cp "${src}/.windsurfrules" "${dest}/.windsurfrules"
      ;;
    vscode)
      copy_tree ".github/skills/pr-viz"
      ;;
    agents)
      copy_tree ".agents/skills/pr-viz"
      ;;
    continue)
      copy_tree ".continue/skills/pr-viz"
      ;;
  esac
}

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

if [[ -f "${BASH_SOURCE[0]:-}" && -d "$(dirname "${BASH_SOURCE[0]}")/skills/pr-viz" ]]; then
  src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  if [[ "$ref" == v* ]]; then
    url="https://codeload.github.com/${repo}/tar.gz/refs/tags/${ref}"
  else
    url="https://codeload.github.com/${repo}/tar.gz/refs/heads/${ref}"
  fi
  curl -fsSL "$url" -o "${tmpdir}/src.tgz"
  tar -xzf "${tmpdir}/src.tgz" -C "$tmpdir"
  src="$(find "$tmpdir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
fi

mkdir -p "$dest"
copy_tree "skills/pr-viz"

resolve_ides
installed=()
while IFS= read -r id; do
  [[ -z "$id" ]] && continue
  install_ide "$id"
  installed+=("$id")
done <<< "$IDE_LIST"

base="$(sed -n 's/.*"baseUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${dest}/skills/pr-viz/host.json" | head -n 1)"
echo "Installed /pr-viz into ${dest}"
echo "Viewer: ${base:-https://pr-viz.com}"
if ((${#installed[@]})); then
  echo "IDE adapters: $(IFS=', '; echo "${installed[*]}")"
else
  echo "IDE adapters: (none — only skills/pr-viz)"
fi
if [[ "$AUTO_FALLBACK_ALL" == "1" ]]; then
  echo "No IDE markers found — installed every adapter. Re-run with a mode to narrow:"
  echo "  ./install.sh ${dest} cursor   # or claude|windsurf|vscode|agents|continue|all"
fi
echo "In your IDE: /pr-viz https://github.com/org/repo/pull/123"
echo "${SKILL_WATCH_HINT}"
