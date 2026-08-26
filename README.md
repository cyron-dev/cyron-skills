# Cyron Skills

Reusable Codex skills written and maintained by [Cyron](https://github.com/cyron-dev). They cover plain-language communication, logic and scope checks, evidence-based progress, workflow verification, and Unity review.

This is a plain skills repository, not a Codex plugin. It does not use `plugin.json` or `agents/openai.yaml`.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `human` | Explain or rewrite material in natural, plain language without losing facts or caveats. |
| `regression-slop` | Prevent a bug fix or refactor from breaking behavior that already works. |
| `scope-drift` | Keep implementation changes inside the user's authorized outcome. |
| `no-logic-slop` | Detect contradictory states, mixed scopes, misleading labels, and invalid fallbacks. |
| `no-progress-slop` | Report progress from verified state instead of activity or confidence. |
| `no-business-slop` | Stop implementations from silently inventing business rules. |
| `no-workflow-slop` | Verify complete workflows, transitions, gates, retries, and rollback paths. |
| `no-product-scope-slop` | Check product artifacts and handoffs against explicit authority and scope evidence. |
| `unity-human-review` | Produce traceable human-review evidence for Unity scenes, runtime journeys, prefabs, and assets. |
| `unity-legend-asset-pipeline` | Audit and govern Unity asset production, import, repair, and approval workflows. |

## Install with Codex Skill Installer

You do not need to download this repository first. Give Codex the GitHub repository URL and ask it to use `$skill-installer`.

Install one skill:

```text
Use $skill-installer to install:
https://github.com/cyron-dev/cyron-skills/tree/main/skills/human
```

Install all skills:

```text
Use $skill-installer to install every skill under skills/ from:
https://github.com/cyron-dev/cyron-skills
```

For a deterministic all-skills install, the paths are:

```text
skills/human
skills/regression-slop
skills/scope-drift
skills/no-logic-slop
skills/no-progress-slop
skills/no-business-slop
skills/no-workflow-slop
skills/no-product-scope-slop
skills/unity-human-review
skills/unity-legend-asset-pipeline
```

Codex installs each selected directory into `~/.codex/skills/<skill-name>`. Newly installed skills become available on the next turn. Installation stops if a destination directory already exists.

## Manual installation

If you already downloaded or cloned the repository, copy the selected folders from `skills/` into your Codex skills directory:

```text
~/.codex/skills/
```

On Windows, the default location is usually:

```text
C:\Users\<username>\.codex\skills\
```

Keep each complete skill directory together. Some skills include required `references/` or `scripts/` folders in addition to `SKILL.md`.

## Repository layout

```text
skills/
  <skill-name>/
    SKILL.md
    references/   # optional
    scripts/      # optional
```

## License

MIT. See [LICENSE](LICENSE).
