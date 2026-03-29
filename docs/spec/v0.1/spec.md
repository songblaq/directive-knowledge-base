# DKB Spec v0.1

## 1. 목적

DKB(Directive Knowledge Base)는 **역할 아티팩트**를 다루는 지식 체계이다.

여기서 역할 아티팩트는 다음을 포함한다.

- agent
- skill
- plugin
- workflow
- command

DKB의 목적은 위 아티팩트를

1. 원본 그대로 수집하고,
2. 정규화하고,
3. 다차원 점수로 측정하고,
4. verdict를 부여하고,
5. 실제 사용용 pack으로 재구성하는 것이다.

## 2. 개념 정의

### 2.1 DKB
DKB는 시스템의 본체이다.  
지식의 수집, 보존, 정규화, 측정, 판정, 재구성을 담당한다.

### 2.2 DG
DG(Directive Graph)는 DKB 내부 표현 모델이다.  
항목을 **다차원 좌표의 하나의 점**으로 보고, 점들 간의 거리·관계·군집을 해석하는 방식이다.

즉,

- **DKB = 본체**
- **DG = 해석 모델**

이다.

### 2.3 원본과 적용의 분리
DKB는 원본을 바로 소비하지 않는다.

- 원본은 **Origin Layer**에 보존한다.
- 실제 사용은 **Application Layer**에서 재구성한다.

이 구조를 통해 다음이 가능해진다.

- 중복 제거
- 변종 통합
- 위험 항목 제외
- 목적별 pack 구성
- 설명 가능한 추천

## 3. 설계 원칙

### 3.1 원본 불변 원칙
원본 스냅샷은 수정하지 않는다.  
정규화, 병합, 요약, 추천은 파생 레이어에서만 수행한다.

### 3.2 점수와 verdict 분리
점수는 측정값이다.  
verdict는 정책 판단 결과이다.

### 3.3 공식성과 신뢰성 분리
공식성(officialness)과 신뢰성(trustworthiness)은 서로 다른 차원이다.

### 3.4 인기와 신뢰 분리
stars, forks, mentions, installs는 adoption 신호이며 trust 신호가 아니다.

### 3.5 설명 가능성
모든 점수와 verdict는 근거를 설명할 수 있어야 한다.

### 3.6 모델 버전 관리
동일한 원본도 scoring model 버전에 따라 결과가 달라질 수 있다.  
따라서 차원 모델과 verdict 정책은 모두 버전 관리한다.

### 3.7 로컬 우선 수집
수집과 정규화는 로컬 런타임 우선으로 설계한다.  
원격 플랫폼은 **발견 채널**로만 사용한다.

## 4. 대상 범위

### 4.1 포함
- README
- SKILL.md
- prompt 문서
- agent 문서
- workflow 문서
- command 문서
- plugin 내 지시문 관련 문서
- 라이선스 텍스트
- 사용 예시
- 설치 설명
- 입출력 예시

### 4.2 제외
v0.1에서 다음은 핵심 분류 대상이 아니다.

- 실행 바이너리 자체
- 패키지 매니페스트 자체
- 설치 경로 자체
- 배포 플랫폼 운영 기능
- 마켓플레이스 기능

다만 위 요소는 **증거 메타데이터**로 저장할 수 있다.

## 5. 레이어 구조

```text
DKB
├─ Origin Layer
│  ├─ Source
│  ├─ Snapshot
│  └─ Raw Directive
├─ Canonical Layer
│  ├─ Canonical Directive
│  ├─ Evidence
│  └─ Relations
├─ DG Layer
│  ├─ Dimension Model
│  ├─ Dimension Scores
│  └─ Cluster / Neighborhood
├─ Verdict Layer
│  ├─ Provenance
│  ├─ Trust
│  ├─ Legal
│  ├─ Lifecycle
│  └─ Recommendation
└─ Application Layer
   ├─ Packs
   ├─ Filters
   ├─ Search
   └─ Compare / Explain
```

## 6. 엔티티 모델

### 6.1 Source
원본 출처 정보.

필수 속성:
- source_id
- source_kind
- origin_uri
- owner_name
- canonical_source_name
- provenance_hint
- first_seen_at
- last_seen_at
- metadata

### 6.2 Source Snapshot
특정 시점의 원본 캡처.

필수 속성:
- snapshot_id
- source_id
- captured_at
- revision_ref
- revision_type
- checksum
- license_text
- raw_blob_uri
- capture_status
- snapshot_meta

### 6.3 Raw Directive
스냅샷에서 추출된 개별 원본 항목.

필수 속성:
- raw_directive_id
- snapshot_id
- raw_name
- entry_path
- declared_type
- content_format
- language_code
- summary_raw
- body_raw
- metadata

### 6.4 Evidence
점수와 verdict의 근거가 되는 증거.

필수 속성:
- evidence_id
- raw_directive_id
- evidence_kind
- excerpt
- location_ref
- weight_hint
- evidence_meta

### 6.5 Canonical Directive
정규화된 논리 개체.

필수 속성:
- directive_id
- preferred_name
- normalized_summary
- primary_human_label
- scope
- status
- canonical_meta

### 6.6 Raw to Canonical Map
원본과 정규화 개체 매핑.

필수 속성:
- mapping_id
- raw_directive_id
- directive_id
- mapping_score
- mapping_reason
- mapping_status

### 6.7 Dimension Model
점수 체계 버전.

필수 속성:
- dimension_model_id
- model_key
- version
- description
- config
- is_active
- created_at

### 6.8 Dimension Score
차원별 측정 결과.

필수 속성:
- dimension_score_id
- directive_id
- dimension_model_id
- dimension_group
- dimension_key
- score
- confidence
- explanation
- features
- scored_at

### 6.9 Verdict
정책 판단 결과.

필수 속성:
- verdict_id
- directive_id
- dimension_model_id
- provenance_state
- trust_state
- legal_state
- lifecycle_state
- recommendation_state
- verdict_reason
- policy_trace
- evaluated_at

### 6.10 Relation
지시문 개체 간 관계.

관계 유형 예:
- duplicate_of
- variant_of
- complements
- conflicts_with
- supersedes
- bundle_member_of
- derived_from

### 6.11 Pack
적용용 curated 묶음.

예:
- beginner pack
- safe pack
- review pack
- planning pack
- content creator pack
- experimental pack

## 7. DG 차원 정의

DG는 **다차원 좌표계**이다.  
각 개체 x는 하나의 점으로 표현된다.

```text
DG(x) = [
  Form(x),
  Function(x),
  Execution(x),
  Governance(x),
  Adoption(x),
  Clarity(x)
]
```

### 7.1 Form
형태적 성향.

- skillness
- agentness
- workflowness
- commandness
- pluginness

### 7.2 Function
무슨 일을 하려는가.

- planning
- review
- coding
- research
- ops
- writing
- content
- orchestration

### 7.3 Execution
어떻게 작동하는가.

- atomicity
- autonomy
- multi_stepness
- tool_dependence
- composability
- reusability

### 7.4 Governance
출처/법적/신뢰 관련 성향.

- officialness
- legal_clarity
- maintenance_health
- install_verifiability
- trustworthiness

### 7.5 Adoption
확산과 실사용 신호.

- star_signal
- fork_signal
- mention_signal
- install_signal
- freshness

### 7.6 Clarity
사람이 이해하고 고를 수 있는 정도.

- naming_clarity
- description_clarity
- io_clarity
- example_coverage
- overlap_ambiguity_inverse

## 8. 점수 함수

전체 벡터:

```text
D(x) = concat(
  Form(x),
  Function(x),
  Execution(x),
  Governance(x),
  Adoption(x),
  Clarity(x)
)
```

역할 점수 함수:

```text
role_score_r(x) = σ(W_r · D(x) + b_r)
```

대표 역할 점수:
- skill_score(x)
- agent_score(x)
- workflow_score(x)
- command_score(x)
- plugin_score(x)

### 8.1 해석 예시

```text
skill_score    = 0.81
agent_score    = 0.44
workflow_score = 0.73
command_score  = 0.58
plugin_score   = 0.22
```

이 경우:
- 단순 분류상 skill로 본다기보다
- skill 성향과 workflow 성향이 동시에 높다고 본다

## 9. 중복/병합 함수

### 9.1 중복 후보 함수

```text
duplicate_candidate(x, y) =
  0.40 * semantic_similarity(x, y) +
  0.25 * role_similarity(x, y) +
  0.20 * io_similarity(x, y) +
  0.15 * naming_similarity(x, y) -
  conflict_penalty(x, y)
```

### 9.2 Pack 유틸리티 함수

```text
pack_utility(G, A) =
  Σ fit_to_goal(G, a)
  + 0.50 * trust_score(a)
  + 0.30 * clarity_score(a)
  + 0.20 * freshness_score(a)
  - overlap_penalty(A)
```

- G: 목표
- A: 선택된 항목 집합

이 식은 pack 구성의 기본 목적 함수다.

## 10. Verdict 모델

### 10.1 Provenance
- official
- vendor
- community
- individual
- unknown

### 10.2 Trust
- unknown
- reviewing
- verified
- caution
- blocked

### 10.3 Legal
- clear
- custom
- no_license
- removed
- restricted

### 10.4 Lifecycle
- active
- stale
- dormant
- archived
- disappeared

### 10.5 Recommendation
- candidate
- preferred
- merged
- excluded
- deprecated

## 11. Pack 모델

Pack은 목적 중심으로 만든다.

### 11.1 기본 pack 타입
- safe
- lean
- starter
- role
- experimental
- custom

### 11.2 예시
- Safe Review Pack
- Planning Starter Pack
- Coding Workflow Pack
- Content Creator Pack

## 12. 저장 전략

### 12.1 기본안
- PostgreSQL
- JSONB
- Full Text Search
- pgvector
- 로컬 파일 저장소

### 12.2 저장 역할
- PostgreSQL: 구조화 데이터, 관계, verdict, pack, audit
- JSONB: 차원 feature, 추출 결과, 정책 trace
- FTS: 키워드 검색
- pgvector: 의미 검색, 유사도, 군집 후보
- 파일 저장소: 원문, blob, archive

## 13. 비기능 요구사항

- 원본 스냅샷 immutable 보장
- 차원 모델 버전 관리
- verdict 정책 버전 관리
- explainability 저장
- 감사 로그 저장
- 로컬 우선 실행
- 검색/점수/pack 생성 분리
- 추후 통계/군집 분석 가능성 확보

## 14. v0.1 제외 사항

- 완전 자동 큐레이션
- 공개 마켓플레이스
- 사용자 협업 권한 시스템
- 대규모 소셜 수집 자동화
- 그래프 DB 별도 도입
- 다중 테넌시

## 15. v0.1 산출물

- DKB Spec
- DKB Architecture
- Storage Profiles
- Runtime Handoff
- PostgreSQL DDL
- Dimension Model JSON
- Verdict Policy JSON
- Pack Examples JSON
