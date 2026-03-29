# DKB — Directive Knowledge Base

## What is DKB?
DKB is a **generic, domain-agnostic multi-dimensional knowledge management framework**.
It uses "Directive Graph (DG)" to represent knowledge across 34 dimensions in 6 groups.
DKB is NOT limited to AI — it can be applied to any knowledge domain (history, science, math, etc.).

## This Repository
Specification and conceptual documentation for the DKB framework.
- No executable code — pure documentation
- Defines the DG dimension model, API contract, conformance requirements

## Repository Structure
```
docs/
  concept/          # Vision, glossary
  spec/v0.1/        # Specification (spec, dimension-model, api-contract, conformance)
  architecture/     # Pipeline overview
  profiles/         # Storage profiles (PostgreSQL)
  references.md     # External references
web/                # Future: documentation website
```

## Ecosystem (4 repos)
| Repo | Role |
|------|------|
| **directive-knowledge-base** (this) | Spec & concepts |
| **dkb-runtime** | Implementation engine (Python 3.12+) |
| **ai-store-dkb** | AI ecosystem collection instance |
| **agent-prompt-dkb** | Agent prompt curation & export instance |

## Dependency Chain
```
directive-knowledge-base (spec)
    -> dkb-runtime (engine)
        -> ai-store-dkb (collection)
        -> agent-prompt-dkb (curation)
```

## Key Terms
- **DG (Directive Graph)**: Multi-dimensional scoring model (6 groups, 34 dimensions)
- **Directive**: A unit of knowledge managed in DKB
- **Verdict**: Policy decision on 5 axes (provenance, trust, legal, lifecycle, recommendation)
- **Pack**: Curated selection of directives

## Contributing
- Documentation follows Markdown
- All work tracked via GitHub Issues
