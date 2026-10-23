# Contributing

All changes land through a pull request. Direct pushes to `main` are blocked by
a repository ruleset.

Before merge, CI must be green:

- **Skill files** — required layout, script syntax, LF `install.sh`
- **ShellCheck** — `install.sh`
- **Actionlint** — GitHub Actions workflows
- **Security scan** — Trivy (vuln/secret/misconfig) and Gitleaks
- **CodeQL** — JavaScript in the skill scripts

Automated publishes from the viewer release open a `publish/v*` PR, wait for
the same checks, then squash-merge.
