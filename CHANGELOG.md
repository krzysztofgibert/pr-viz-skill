# Release notes

## 0.1.27 — 2026-10-28

Matches viewer image `gprojekt/pr-viz:0.1.27`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Merge pull request #41 from hyurii/fix/viewer-vscode-map-meta
- Merge pull request #40 from hyurii/fix/lighthouse-quick-wins
- Surface soft viewer/skill update notices in preflight and on diagrams.
- Fix incomplete IDE diagram maps: fill PR meta, estimate tokens, edge walkthrough.
- Tune Lighthouse fixes: higher-quality poster JPEG and safer image cache TTL.
- Fix Lighthouse wins: CSP-safe fonts, smaller poster, cache, diagram code-split.


## 0.1.26 — 2026-10-27

Matches viewer image `gprojekt/pr-viz:0.1.26`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Merge pull request #36 from hyurii/fix/ide-docs-tabs
- Merge main into fix/ide-docs-tabs; keep IDE tabs and pin install to v0.1.26.
- Merge pull request #39 from hyurii/fix/lcp-fonts-defer-demo
- Defer home demo iframe and unblock fonts to improve LCP.
- Add site nav and IDE tabs on /docs/* guide pages.


## 0.1.25 — 2026-10-27

Matches viewer image `gprojekt/pr-viz:0.1.25`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Merge pull request #38 from hyurii/chore/seo-og-logos
- Add brand OG image and logo PNGs for directories and social previews.
- Merge pull request #37 from hyurii/fix/private-pr-hosted-viewer-consent
- Ask before publishing private PRs to pr-viz.com.
- Merge pull request #35 from hyurii/fix/packaging-sonar-v8
- Align packaging Sonar action with skill-repo v8.
- Merge pull request #34 from hyurii/fix/admin-only-ruleset-bypass
- Limit skill-repo ruleset bypass to Admin only.
- Merge pull request #33 from hyurii/fix/skill-owner-merge-bypass
- Allow skill-repo owners to merge their own PRs via ruleset bypass.


## 0.1.24 — 2026-10-23

Matches viewer image `gprojekt/pr-viz:0.1.24`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Merge pull request #32 from hyurii/seo-ide-sections-and-headings
- Move IDE guides to Docs; restore home hero copy
- Add light IDE long-tail pages and skill About homepage
- Add SEO meta/OG/JSON-LD and bump skill Actions majors (#31)
- fix: keep curl -d on same invocation in skill-governance (#30)
- fix: hyurii maintain access on skill repo (#29)
- Allow either owner to self-approve skill PRs (#28)
- Require owner approval before merge (no bot merge) (#27)
- fix: treat missing skill PR checks as pending (#26)
- fix: force-with-lease when updating skill publish branches (#25)
- fix: keep skill CI LF check YAML-safe (#24)
- fix: use dismiss_stale_reviews_on_push in skill ruleset (#23)
- Secure the skill repo with CI scans and PR-only main (#22)
- fix: install ffmpeg via setup-ffmpeg in publish-skill (#21)


## 0.1.23 — 2026-10-23

Matches viewer image `gprojekt/pr-viz:0.1.23`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Add the test:e2e:all script the release workflow expects. (#20)


## 0.1.21 — 2026-10-22

Matches viewer image `gprojekt/pr-viz:0.1.21`.

- Viewer: https://pr-viz.com
- Sample map: https://pr-viz.com/d/sample
- Image: https://hub.docker.com/r/gprojekt/pr-viz

- Move the license names onto the docs page. (#15)


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
