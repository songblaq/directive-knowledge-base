# DKB Storage Profiles

## 1. 목적

DKB는 하나의 저장소에 모든 것을 억지로 몰아넣기보다, **기본 권장안**과 **대체 프로파일**을 함께 제공한다.

v0.1의 기본 권장안은 **PostgreSQL 중심**이다.

## 2. 기본 프로파일: PostgreSQL First

### 구성
- PostgreSQL
- JSONB
- Full Text Search
- pgvector
- Local File Storage

### 잘 맞는 이유
- 구조화 데이터와 비정형 메타데이터를 같이 다룰 수 있다.
- 원본/정규화/점수/verdict/pack을 같은 DB에서 관리할 수 있다.
- FTS와 vector를 한 저장소에서 조합할 수 있다.
- ACID, JOIN, audit, migrations, backup 흐름이 단순하다.
- v0.1 구현 범위에 가장 균형이 좋다.

### 권장 사용처
- DKB Core 첫 구현
- 관리형 백오피스 중심 제품
- source provenance와 verdict 이력이 중요한 경우
- 검색 + 운영 + 정책이 동시에 필요한 경우

### 약점
- 벡터 전용 엔진보다 ANN 튜닝 자유도는 좁을 수 있다.
- 초대규모 semantic search 전용 시스템으로 확장할 경우 재검토 필요

## 3. 프로파일 비교

### 3.1 PostgreSQL + pgvector
역할:
- 기본 저장소
- system of record
- hybrid search 중심 허브

장점:
- 관계형 + JSONB + FTS + vector 통합
- 단일 운영 표면
- migrations / indexes / constraints / audit에 강함

단점:
- vector-only 엔진만큼 specialized 하지는 않음

추천도:
- **v0.1 최고 추천**

### 3.2 Qdrant
역할:
- vector-first retrieval engine
- filtering 강한 semantic retrieval

장점:
- payload filtering이 강함
- vector 중심 검색 성능 설계가 명확함
- semantic retrieval 전용 마이크로서비스로 좋음

단점:
- DKB의 system of record를 맡기에는 구조화 운영 데이터가 흩어짐
- verdict / pack / audit / 관계 모델은 별도 저장소가 필요함

추천도:
- **보조 엔진**
- vector retrieval 전용 분리 시 유력

### 3.3 Weaviate
역할:
- 검색 포털 지향형 vector+keyword/hybrid 시스템

장점:
- hybrid search 개념이 명확함
- vector + BM25를 쉽게 결합
- 검색 제품화 관점에서 편리함

단점:
- DKB의 정책·이력·정규화 코어로 두기엔 저장소 경계가 어색함

추천도:
- public discovery search를 키울 때 검토

### 3.4 OpenSearch
역할:
- 대규모 검색 포털
- hybrid query / relevance tuning

장점:
- 검색 확장성이 좋음
- keyword + semantic query pipeline 구성에 유리

단점:
- 운영 비용과 복잡성이 PostgreSQL보다 큼
- v0.1 코어 저장소로는 과함

추천도:
- 대규모 public search 단계에서 검토

### 3.5 Neo4j
역할:
- graph relationship / path analysis
- knowledge graph projection

장점:
- 관계 탐색, 경로 질의, topology 분석에 강함
- DG 시각화/분석 확장에 유리

단점:
- v0.1 DKB의 system of record로는 과한 선택
- 원본/점수/verdict/pack을 중심으로 한 운영 코어보다 graph analysis에 특화

추천도:
- DG 분석 기능이 제품 중심이 될 때 보조 또는 확장 저장소로 검토

### 3.6 SQLite FTS5
역할:
- 초경량 로컬 프로토타입

장점:
- 설치가 쉬움
- 단일 사용자 테스트에 적합

단점:
- 장기 운영과 멀티프로세스 파이프라인에 한계
- vector / verdict / audit / scale 측면에서 부족

추천도:
- PoC 전용

## 4. 최종 권장안

### v0.1
- **PostgreSQL + JSONB + FTS + pgvector + Local File Storage**

### v0.2 이후 조건부 확장
- semantic retrieval 부하 증가 → Qdrant 보조 엔진 검토
- public search 확대 → Weaviate 또는 OpenSearch 검토
- 관계 분석 / 경로 탐색 확대 → Neo4j 보조 저장소 검토

## 5. 선택 기준표

| 기준 | PostgreSQL | Qdrant | Weaviate | OpenSearch | Neo4j | SQLite |
|---|---|---|---|---|---|---|
| system of record | 매우 적합 | 낮음 | 낮음 | 보통 | 보통 | 낮음 |
| vector search | 적합 | 매우 강함 | 강함 | 강함 | 보통 | 낮음 |
| FTS | 강함 | 약함 | 보통 | 매우 강함 | 약함 | 보통 |
| JSON/metadata | 강함 | 보통 | 보통 | 강함 | 보통 | 낮음 |
| 관계 모델 | 적합 | 약함 | 약함 | 약함 | 매우 강함 | 낮음 |
| 운영 단순성 | 강함 | 보통 | 보통 | 낮음 | 보통 | 매우 강함 |
| v0.1 적합성 | 최고 | 보조 | 보조 | 후순위 | 후순위 | PoC |

## 6. DKB 저장 전략 결론

DKB의 핵심은 **검색 엔진**이 아니라 **지식 운영 코어**다.  
따라서 v0.1의 기본 저장소는 PostgreSQL이 가장 적합하다.
