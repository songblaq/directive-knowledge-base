# DKB Architecture

## 1. 목표

이 문서는 DKB를 실제 런타임 팀이 구현할 수 있도록 **구성요소**, **데이터 흐름**, **런타임 분리**, **최소 배포 구조**를 정의한다.

## 2. 권장 전체 구조

```text
                ┌───────────────────────┐
                │   Source Discovery    │
                │ (Git / local / list)  │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │    Collector Layer    │
                │ clone / fetch / scan  │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │     Snapshot Vault    │
                │ raw files / archives   │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Extraction Layer    │
                │ readme / skill / docs │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Canonicalization     │
                │ dedupe / mapping      │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  DG Scoring Engine    │
                │ rules + llm + embeds  │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Verdict Engine      │
                │ policy interpretation │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │      Pack Engine      │
                │ safe / lean / custom  │
                └───────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
      ┌───────────────────┐   ┌───────────────────┐
      │ Search / Compare  │   │  Admin / Review   │
      └───────────────────┘   └───────────────────┘
```

## 3. 실행 단위

### 3.1 Collector
역할:
- git repo clone/fetch
- local folder scan
- manual archive import
- snapshot 생성
- 파일 해시 계산

입력:
- source 목록
- 수집 정책

출력:
- raw snapshot files
- snapshot metadata

### 3.2 Extractor
역할:
- README 파싱
- SKILL.md 파싱
- prompt/agent/workflow/command 문서 파싱
- license 텍스트 수집
- 설명, 예시, I/O 후보 추출

입력:
- snapshot

출력:
- raw_directive
- evidence 후보

### 3.3 Canonicalizer
역할:
- 원본 항목 정규화
- 중복/변형/보완 관계 생성
- raw → canonical 매핑

입력:
- raw_directive
- evidence
- 텍스트 유사도
- 규칙

출력:
- canonical_directive
- relation
- mapping

### 3.4 DG Scoring Engine
역할:
- dimension feature 계산
- rule-based score 계산
- llm-assisted score 보정
- explanation 생성

입력:
- canonical_directive
- evidence
- dimension model config
- embeddings

출력:
- dimension_score

### 3.5 Verdict Engine
역할:
- provenance 판단
- trust 판단
- legal 판단
- lifecycle 판단
- recommendation 판단

입력:
- dimension_score
- evidence
- policy config

출력:
- verdict

### 3.6 Pack Engine
역할:
- 목적별 pack 생성
- 중복 제거
- 안전 기준 반영
- 초보자 pack / 실험용 pack 분리

입력:
- dimension_score
- verdict
- pack goal

출력:
- pack
- pack_item

## 4. 데이터 흐름

### 4.1 수집 흐름
1. source 등록
2. collector 실행
3. snapshot 생성
4. raw 파일 저장
5. DB snapshot metadata 저장

### 4.2 분석 흐름
1. extractor 실행
2. raw_directive 생성
3. evidence 생성
4. canonicalizer 실행
5. canonical_directive 생성

### 4.3 측정 흐름
1. embedding 생성
2. feature 추출
3. dimension_score 계산
4. explanation 저장

### 4.4 판정 흐름
1. policy load
2. dimension_score 읽기
3. evidence 읽기
4. verdict 생성
5. audit_event 저장

### 4.5 적용 흐름
1. pack goal 정의
2. eligible directives 필터링
3. 중복 제거
4. priority 정렬
5. pack_item 생성

## 5. 런타임 분리

### 5.1 추천 분리
- `collector`
- `pipeline`
- `api`
- `ui`
- `db`

### 5.2 초기 단계 단일 프로세스도 가능
v0.1에서는 아래 구조로도 시작 가능하다.

- Python monolith
- FastAPI
- background jobs
- PostgreSQL
- local filesystem

### 5.3 추후 분리 기준
다음 조건에서 분리 권장:
- source 수 증가
- embedding 비용 증가
- pack generation 복잡도 증가
- 관리자 리뷰 흐름 필요
- API latency 요구 증가

## 6. 저장소 역할

### 6.1 PostgreSQL
system of record

저장 대상:
- source
- snapshot
- raw_directive metadata
- evidence
- canonical_directive
- dimension_score
- verdict
- pack
- audit_event

### 6.2 Local File Storage
원본과 스냅샷 저장

저장 대상:
- cloned repo
- raw markdown
- license text
- archived zip/tar
- parsed artifacts (optional cache)

### 6.3 pgvector
canonical_directive semantic retrieval
evidence semantic retrieval
dedupe 후보 탐색

### 6.4 FTS
정확도 높은 키워드 기반 탐색
README / skill / prompt / explanation 검색

## 7. 최소 API 역할

### 7.1 Source
- source 등록
- source 목록
- source 상태 조회

### 7.2 Snapshot
- snapshot 생성
- snapshot 목록
- snapshot 상세 조회

### 7.3 Directive
- raw_directive 목록
- canonical_directive 목록
- detail 조회
- relation 조회

### 7.4 Score
- dimension score 조회
- score explain 조회
- 비교 조회

### 7.5 Verdict
- verdict 조회
- verdict override
- review 상태 변경

### 7.6 Pack
- pack 생성
- pack 조회
- pack export

### 7.7 Search
- keyword search
- semantic search
- hybrid search
- filter search

## 8. 운영 모드

### 8.1 Manual Mode
수동 source 등록
수동 수집
수동 리뷰
수동 pack 확정

### 8.2 Scheduled Local Mode
로컬 크론 / systemd timer
주기 수집
주기 점수 계산
주기 verdict refresh

v0.1 권장 시작점은 Manual Mode + 일부 Scheduled Local Mode 이다.

## 9. 보안 및 운영 원칙

- 원본 snapshot은 immutable 처리
- 외부 source credential 최소화
- 명시적 allowlist source만 수집
- 위험 script 자동 실행 금지
- license 불명 source는 caution
- no_license는 기본 exclusion 후보
- pack export 시 원본/파생 정보 구분 표시

## 10. v0.1 권장 배포 형태

### 10.1 개발
- Docker Compose
- pgvector enabled Postgres
- local mounted storage
- FastAPI dev server

### 10.2 운영
- Postgres managed or self-hosted
- application runner
- dedicated storage volume
- job runner
- backup

## 11. 권장 모듈 구조

```text
dkb/
  app/
    api/
    services/
    models/
    repositories/
    jobs/
    scoring/
    verdict/
    packs/
  scripts/
  tests/
  migrations/
  config/
  storage/
```
