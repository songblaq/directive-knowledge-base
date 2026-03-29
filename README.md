# Directive Knowledge Base (DKB)

AI 에이전트/스킬/플러그인/워크플로/커맨드 역할 아티팩트를 체계적으로 관리하기 위한 **지식 체계 명세**.

## What is DKB?

DKB는 오픈소스 AI 도구들의 프롬프트 역할 아티팩트를 **수집 → 정규화 → 다차원 점수화 → verdict 판정 → curated pack 재구성**하는 체계입니다.

- **DKB** = Directive Knowledge Base (본체, 지식 체계)
- **DG** = Directive Graph (내부 다차원 해석 모델)

## Repository Structure

이 프로젝트는 4개 저장소로 구성됩니다:

| Repository | Role |
|---|---|
| **directive-knowledge-base** (this) | 개념, 명세, 웹 문서 |
| [dkb-runtime](../dkb-runtime) | 설치 가능한 구현체 (Python 패키지) |
| [ai-store-dkb](../ai-store-dkb) | AI 전체 리서치/수집 스토어 |
| [agent-prompt-dkb](../agent-prompt-dkb) | 에이전트 프롬프트 큐레이션 + export |

```
directive-knowledge-base (개념/명세)
    ↓
dkb-runtime (pip install 가능한 엔진)
    ↓                      ↓
ai-store-dkb            agent-prompt-dkb
(리서치/수집)           (큐레이션 + export)
                            ↓
                    dist/claude-code/ (사용자가 설치)
```

## Documentation

- [Vision](docs/concept/vision.md) — DKB가 왜 필요한가
- [Glossary](docs/concept/glossary.md) — 용어집
- [Spec v0.1](docs/spec/v0.1/spec.md) — 핵심 명세
- [Dimension Model](docs/spec/v0.1/dimension-model.md) — DG 6그룹 34차원
- [Architecture](docs/architecture/overview.md) — 파이프라인 아키텍처
- [Storage Profiles](docs/profiles/postgresql.md) — PostgreSQL 기본 프로파일
- [Conformance](docs/spec/v0.1/conformance.md) — 구현 요건

## For Users

DKB를 직접 사용할 필요 없이, **agent-prompt-dkb**의 export 결과물만 가져가서 Claude Code, OpenCode 등에 설치하면 됩니다.

## For Developers

자체 DKB 인스턴스를 구축하려면:
1. `pip install dkb-runtime`
2. PostgreSQL + pgvector 설정
3. 자신의 프로젝트에서 dkb-runtime으로 인스턴스 초기화

## License

MIT
