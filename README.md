# /pr-viz skill

Free IDE skill that turns a GitHub pull request into a two-zone review map.
Use it in VS Code, Cursor, Claude Code, or Windsurf. Your model reads the pull
request. The map opens at [pr-viz.com](https://pr-viz.com) or on a viewer you run.

[![Skill release](https://img.shields.io/github/v/release/krzysztofgibert/pr-viz-skill?label=skill)](https://github.com/krzysztofgibert/pr-viz-skill/releases)
[![Viewer image](https://img.shields.io/docker/v/gprojekt/pr-viz/latest?label=viewer)](https://hub.docker.com/r/gprojekt/pr-viz)

![PR Viz sample review map](docs/demo.gif)

Live sample: [pr-viz.com/d/sample](https://pr-viz.com/d/sample)

## Where to find PR Viz

| | |
|---|---|
| Viewer | [pr-viz.com](https://pr-viz.com) |
| Sample map | [pr-viz.com/d/sample](https://pr-viz.com/d/sample) |
| Docker image | [hub.docker.com/r/gprojekt/pr-viz](https://hub.docker.com/r/gprojekt/pr-viz) |
| This repository | the skill for your IDE |

The map is a web page, not a Mermaid diagram in the chat. The model that reads
the pull request is the one already configured in your IDE. Diagram JSON,
including short code excerpts, is sent only to the viewer in
[`skills/pr-viz/host.json`](skills/pr-viz/host.json). That file points at
`https://pr-viz.com` until you change it.

The viewer and the server are not in this repository. They ship as the Docker
image. This repository is the skill, so you can read it before you install it.

## Install

From the project where you want the skill:

```bash
curl -fsSL https://raw.githubusercontent.com/krzysztofgibert/pr-viz-skill/main/install.sh | bash
```

Pin a release:

```bash
PR_VIZ_SKILL_REF=v0.1.10 curl -fsSL https://raw.githubusercontent.com/krzysztofgibert/pr-viz-skill/v0.1.10/install.sh | bash
```

Or clone and install from the checkout:

```bash
git clone https://github.com/krzysztofgibert/pr-viz-skill.git
cd pr-viz-skill
./install.sh /path/to/your/project
```

`install.sh` copies `skills/pr-viz/`, the IDE adapter folders, `.cursorrules`,
and `.windsurfrules`. It does not copy this repo's CI workflows into your project.

A self-hosted viewer can also offer **Download skill for this host**
(`/api/skill-pack.zip`). That zip is the same skill with `host.json` already
set to that server.

## Use

In the IDE chat:

```text
/pr-viz https://github.com/org/repo/pull/123
```

The skill publishes the map and replies with the URL. It does not paste the
review into the chat, and it does not ask for a GitHub token.

## IDEs

| IDE | Folder |
|-----|--------|
| VS Code / GitHub Copilot | `.github/skills/pr-viz/` |
| Cursor | `.cursor/skills/pr-viz/` |
| Claude Code | `.claude/skills/pr-viz/` |
| Windsurf | `.windsurf/skills/pr-viz/` |
| Zed, Codex, OpenCode, Amp, Continue, and other Agent Skills hosts | `.agents/skills/pr-viz/` or `.continue/skills/pr-viz/` |

Needs Node.js 18 or newer. `gh` is only needed for private pull requests. The
skill says what is missing before it asks you for anything.

`.cursorrules` and `.windsurfrules` point the agent at
[`skills/pr-viz/SKILL.md`](skills/pr-viz/SKILL.md).

## Verify the viewer image

Each release signs `gprojekt/pr-viz` with Cosign. The matching public key is
[`cosign.pub`](cosign.pub) in this repository and
[pr-viz.com/cosign.pub](https://pr-viz.com/cosign.pub). The private key is not
in this repository.

```bash
cosign verify --key cosign.pub --insecure-ignore-tlog=true gprojekt/pr-viz:<version>
```

Use the tag you pulled. `--insecure-ignore-tlog` skips the public Sigstore
transparency log, so the check works on an air-gapped network. Trust is the
public key above.

## Your own viewer

```bash
docker pull gprojekt/pr-viz:latest
docker compose up -d
```

Then set `baseUrl` in `skills/pr-viz/host.json`, or export `PR_VIZ_BASE_URL`,
to the address you open. Image tags and release notes are on
[Docker Hub](https://hub.docker.com/r/gprojekt/pr-viz).

## Release notes

Notes for each skill release are in [CHANGELOG.md](CHANGELOG.md) and on
[GitHub Releases](https://github.com/krzysztofgibert/pr-viz-skill/releases).
A pr-viz image release publishes the matching skill tag, these notes, and the
Docker Hub overview.

## Community

Open an issue here for install problems and skill ideas. Skill files are
published from the pr-viz release, so a pull request on this repo can be
replaced by the next release. An issue is the request that stays put.

## License

This repository is [MIT](LICENSE). You may use, copy, and modify the skill.

The viewer image `gprojekt/pr-viz` is Free to Run: free to download and run,
including an unchanged copy in a private registry. The viewer is Source Closed.
Its source is not in this repository. You may not copy or modify that source,
and you may not publish a changed image as your own product.
