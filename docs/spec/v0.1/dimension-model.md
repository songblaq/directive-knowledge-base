# DKB Dimension Model v0.1

## 1. 개요

DKB는 단일 분류를 사용하지 않는다.  
대신 하나의 directive를 **여러 차원의 점수 벡터**로 표현한다.

## 2. 전체 구조

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

## 3. 그룹별 정의

### 3.1 Form
해당 항목이 어떤 형태적 성향을 강하게 띠는가.

- skillness
- agentness
- workflowness
- commandness
- pluginness

### 3.2 Function
어떤 작업 목적을 띠는가.

- planning
- review
- coding
- research
- ops
- writing
- content
- orchestration

### 3.3 Execution
어떻게 작동하는가.

- atomicity
- autonomy
- multi_stepness
- tool_dependence
- composability
- reusability

### 3.4 Governance
출처, 법적 상태, 운영 건전성 관련.

- officialness
- legal_clarity
- maintenance_health
- install_verifiability
- trustworthiness

### 3.5 Adoption
실사용과 관심도 신호.

- star_signal
- fork_signal
- mention_signal
- install_signal
- freshness

### 3.6 Clarity
설명과 이해 가능성.

- naming_clarity
- description_clarity
- io_clarity
- example_coverage
- overlap_ambiguity_inverse

## 4. 점수 스케일

모든 점수는 `0.0 ~ 1.0` 범위로 저장한다.

### 해석 기준
- 0.00 ~ 0.19: 매우 낮음
- 0.20 ~ 0.39: 낮음
- 0.40 ~ 0.59: 보통
- 0.60 ~ 0.79: 높음
- 0.80 ~ 1.00: 매우 높음

## 5. confidence 스케일

각 점수는 confidence를 함께 가진다.

- 0.00 ~ 0.29: 약한 근거
- 0.30 ~ 0.59: 보통 근거
- 0.60 ~ 0.79: 강한 근거
- 0.80 ~ 1.00: 매우 강한 근거

## 6. score 계산 전략

### 6.1 rule-based
- 파일명 패턴
- 본문 키워드
- 예시 유무
- 사용 조건
- 도구 호출 문맥
- README 설명 구조
- 설치 및 실행 가이드 구조

### 6.2 llm-assisted
- 문서 설명 요약
- 역할 추론
- 입력/출력 형태 해석
- overlap ambiguity 보정

### 6.3 external signals
- stars
- forks
- 최신성
- release cadence
- docs completeness

## 7. 설명 가능성 저장

모든 score는 explanation을 남긴다.

예:
- `"본문에 'plan', 'steps', 'checklist' 패턴이 반복되어 planning score 상승"`
- `"실제 도구 호출 예시가 없어 tool_dependence confidence 낮음"`

## 8. role score 계산

각 역할 점수는 별도 weight를 가진다.

```text
skill_score(x)    = σ(W_skill · DG(x) + b_skill)
agent_score(x)    = σ(W_agent · DG(x) + b_agent)
workflow_score(x) = σ(W_workflow · DG(x) + b_workflow)
command_score(x)  = σ(W_command · DG(x) + b_command)
plugin_score(x)   = σ(W_plugin · DG(x) + b_plugin)
```

## 9. 중복 판단과의 연결

dimension vector는 dedupe와 pack 생성에도 사용한다.

- role similarity
- function overlap
- execution overlap
- clarity 차이
- governance 차이

## 10. v0.1 운영 원칙

- dimension은 늘릴 수 있으나 기존 의미를 임의 변경하지 않는다.
- 새 버전이 나오면 `dimension_model.version`을 올린다.
- 동일 directive에 대해 여러 모델 버전 점수를 공존 저장할 수 있다.
