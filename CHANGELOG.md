# Release notes

## 0.1.20 — 2026-10-22

Matches viewer image `gprojekt/pr-viz:0.1.20`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Name the image Free to Run and the viewer Source Closed. (#14)


## 0.1.19 — 2026-10-22

Matches viewer image `gprojekt/pr-viz:0.1.19`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Brand the viewer and add Cloudflare Web Analytics (#13)


## 0.1.18 — 2026-10-22

Matches viewer image `gprojekt/pr-viz:0.1.18`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Pin the release signer to Cosign 2.4.3. (#12)


## 0.1.16 — 2026-10-21

Matches viewer image `gprojekt/pr-viz:0.1.16`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Rename the skill link and the two ways to post a comment. (#10)


## 0.1.15 — 2026-10-21

Matches viewer image `gprojekt/pr-viz:0.1.15`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Rename the skill navigation link to GitHub. (#7)


## 0.1.14 — 2026-10-21

Matches viewer image `gprojekt/pr-viz:0.1.14`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Write the published tag into the Docker Hub tags table. (#9)


## 0.1.13 — 2026-10-21

Matches viewer image `gprojekt/pr-viz:0.1.13`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Put the skill repository next to Docker Hub and drop the Enterprise link. (#6)


## 0.1.10 — 2026-10-21

First public release of the /pr-viz skill. It matches the viewer running at
[pr-viz.com](https://pr-viz.com) and the image `gprojekt/pr-viz:0.1.10`.

- Install in VS Code (GitHub Copilot), Cursor, Claude Code, or Windsurf.
- `/pr-viz <github-pr-url>` builds a needs-review and AI-accepted map and opens it in the browser.
- Default viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Your own viewer: `docker pull gprojekt/pr-viz:0.1.10` from [Docker Hub](https://hub.docker.com/r/gprojekt/pr-viz).
- The diagram viewer and server are not in this repository.

Install:

```bash
curl -fsSL https://raw.githubusercontent.com/krzysztofgibert/pr-viz-skill/v0.1.10/install.sh | bash
```
