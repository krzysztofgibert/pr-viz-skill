# Contributing

All changes land through a pull request. Direct pushes to `main` are blocked.

**[@krzysztofgibert](https://github.com/krzysztofgibert) or [@hyurii](https://github.com/hyurii)** may approve and merge each other’s PRs. GitHub never shows **Approve** on a PR you authored. Only the repo **Admin** (`@krzysztofgibert`) has ruleset **bypass** so they can merge their own PRs once CI is green (UI: merge despite missing approval). `@hyurii` (write) does not get bypass. Automated publish opens a `publish/v*` PR and stops — it does not merge.

Before merge, CI must be green:

- **Skill files** — required layout, script syntax, LF `install.sh`
- **Unit tests** — `node --test` for semver / PR URL parsing (+ CLI smoke)
- **ShellCheck** — `install.sh`
- **Actionlint** — GitHub Actions workflows
- **Security scan** — Trivy (vuln/secret/misconfig) and Gitleaks
- **CodeQL** — JavaScript in the skill scripts
- **Snyk** / **SonarQube** — optional; run when `SNYK_TOKEN` / `SONAR_TOKEN` are set on this repo

After you merge a publish PR, owners re-run **Publish skill** on the private
viewer repo (or push the matching `v*` tag on this skill repo) so the release
tag and GitHub Release are created.
