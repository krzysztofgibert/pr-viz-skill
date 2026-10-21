#!/usr/bin/env bash
# Install the /pr-viz skill into a project.
# Community repo: https://github.com/krzysztofgibert/pr-viz-skill
# Viewer: https://pr-viz.com
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/krzysztofgibert/pr-viz-skill/main/install.sh | bash
#   PR_VIZ_SKILL_REF=v0.1.10 curl -fsSL .../install.sh | bash
#   ./install.sh /path/to/project
set -euo pipefail

repo="krzysztofgibert/pr-viz-skill"
ref="${PR_VIZ_SKILL_REF:-main}"
dest="${1:-.}"

copy_tree() {
  local rel="$1"
  mkdir -p "${dest}/$(dirname "$rel")"
  rm -rf "${dest}/${rel}"
  cp -a "${src}/${rel}" "${dest}/${rel}"
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

copy_tree "skills/pr-viz"
for dir in \
  .agents/skills/pr-viz \
  .github/skills/pr-viz \
  .cursor/skills/pr-viz \
  .claude/skills/pr-viz \
  .windsurf/skills/pr-viz \
  .continue/skills/pr-viz
do
  copy_tree "$dir"
done
cp "${src}/.cursorrules" "${dest}/.cursorrules"
cp "${src}/.windsurfrules" "${dest}/.windsurfrules"

base="$(sed -n 's/.*"baseUrl"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${dest}/skills/pr-viz/host.json" | head -n 1)"
echo "Installed /pr-viz into ${dest}"
echo "Viewer: ${base:-https://pr-viz.com}"
echo "In your IDE: /pr-viz https://github.com/org/repo/pull/123"
