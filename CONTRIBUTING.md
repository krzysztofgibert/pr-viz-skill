# Contributing

All changes land through a pull request. Direct pushes to `main` are blocked.

**Only [@krzysztofgibert](https://github.com/krzysztofgibert) may approve and merge.**
Automated publish opens a `publish/v*` PR and stops — it does not merge.

Before merge, CI must be green:

- **Skill files** — required layout, script syntax, LF `install.sh`
- **Unit tests** — `node --test` for semver / PR URL parsing (+ CLI smoke)
- **ShellCheck** — `install.sh`
- **Actionlint** — GitHub Actions workflows
- **Security scan** — Trivy (vuln/secret/misconfig) and Gitleaks
- **CodeQL** — JavaScript in the skill scripts
- **Snyk** / **SonarQube** — optional; run when `SNYK_TOKEN` / `SONAR_TOKEN` are set on this repo

After you merge a publish PR, re-run **Publish skill** on `hyurii/pr-viz` (or push the matching `v*` tag on the skill repo) so the release tag and GitHub Release are created.
