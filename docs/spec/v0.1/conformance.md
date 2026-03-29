# DKB Conformance v0.1

DKB v0.1 구현체가 갖춰야 할 최소 요건.

## 필수 요건

1. **원본 스냅샷 저장**: Source → Snapshot → RawDirective 체인 지원
2. **원본과 정규화 분리**: RawDirective와 CanonicalDirective 별도 관리
3. **차원별 점수 저장**: DimensionModel 기반 점수 저장 (6그룹 34차원)
4. **점수 설명 저장**: 각 점수에 대한 explanation 필드 필수
5. **Verdict 상태 저장**: provenance, trust, legal, lifecycle, recommendation 5축
6. **중복/변종 관계 표현**: DirectiveRelation으로 관계 표현
7. **Pack 구성**: selection_policy 기반 curated pack 생성
8. **키워드 검색**: 최소 full-text search 지원
9. **점수 모델 버전 관리**: DimensionModel에 version 필드 필수
10. **감사 로그**: AuditEvent 기록

## 권장 요건

- 의미 검색 (벡터 기반)
- 하이브리드 검색 (키워드 + 벡터)
- Export 기능 (SKILL.md, Claude Code skills 등)
- Import 기능 (다른 DKB 인스턴스에서 데이터 가져오기)

## 저장 프로파일

DKB는 특정 DB를 강제하지 않지만, 기본 권장 프로파일은:
- PostgreSQL + JSONB + Full Text Search + pgvector

대체 프로파일은 `docs/profiles/` 참조.
