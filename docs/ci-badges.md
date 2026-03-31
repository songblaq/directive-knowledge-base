# CI status badge snippets

Use at the top of each repository README (adjust alt text if you prefer).

## directive-knowledge-base

```markdown
![CI](https://github.com/songblaq/directive-knowledge-base/actions/workflows/ci.yml/badge.svg)
```

## dkb-runtime

```markdown
![CI](https://github.com/songblaq/dkb-runtime/actions/workflows/ci.yml/badge.svg)
```

## ai-store-dkb

```markdown
![CI](https://github.com/songblaq/ai-store-dkb/actions/workflows/ci.yml/badge.svg)
```

## agent-prompt-dkb

```markdown
![CI](https://github.com/songblaq/agent-prompt-dkb/actions/workflows/ci.yml/badge.svg)
```

## Cross-repo dispatch setup

1. Create a PAT (fine-grained or classic) with permission to trigger workflows on `songblaq/ai-store-dkb` and `songblaq/agent-prompt-dkb`.
2. In **directive-knowledge-base** and **dkb-runtime**, add repository secret `CROSS_REPO_DISPATCH_TOKEN` with that PAT.
3. Ensure downstream `ci.yml` includes `repository_dispatch` with `types: [dkb-upstream-trigger]` (see `.github/workflows/downstream-trigger.yml` in this repo).
