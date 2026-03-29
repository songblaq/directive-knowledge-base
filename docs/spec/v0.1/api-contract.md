# DKB API Contract v0.1

## 1. API 스타일

- REST first
- JSON request/response
- 관리자/시스템용 API 우선
- 검색과 배치 작업을 분리

## 2. 엔드포인트 개요

### Source
- `POST /sources`
- `GET /sources`
- `GET /sources/{source_id}`
- `POST /sources/{source_id}/collect`

### Snapshot
- `GET /snapshots`
- `GET /snapshots/{snapshot_id}`

### Raw Directive
- `GET /raw-directives`
- `GET /raw-directives/{raw_directive_id}`

### Canonical Directive
- `GET /directives`
- `GET /directives/{directive_id}`
- `GET /directives/{directive_id}/relations`
- `GET /directives/{directive_id}/evidence`

### Search
- `POST /search/keyword`
- `POST /search/semantic`
- `POST /search/hybrid`

### Score
- `GET /directives/{directive_id}/scores`
- `GET /directives/{directive_id}/scores/explain`
- `POST /scores/recalculate`

### Verdict
- `GET /directives/{directive_id}/verdict`
- `POST /directives/{directive_id}/verdict/override`

### Pack
- `POST /packs`
- `GET /packs`
- `GET /packs/{pack_id}`
- `POST /packs/{pack_id}/build`
- `GET /packs/{pack_id}/export`

### Admin
- `GET /reviews/pending`
- `POST /reviews/{directive_id}/approve`
- `POST /reviews/{directive_id}/reject`

## 3. 예시 검색 요청

```json
{
  "query": "review oriented planning directives",
  "filters": {
    "trust_state": ["verified", "reviewing"],
    "recommendation_state": ["candidate", "preferred"],
    "score_min": {
      "function.review": 0.70,
      "form.workflowness": 0.55
    }
  },
  "limit": 20
}
```

## 4. 예시 directive detail 응답

```json
{
  "directive_id": "uuid",
  "preferred_name": "review-workflow",
  "summary": "리뷰와 체크리스트 중심 워크플로",
  "scores": {
    "form.skillness": 0.63,
    "form.workflowness": 0.82,
    "function.review": 0.91
  },
  "verdict": {
    "provenance_state": "community",
    "trust_state": "verified",
    "legal_state": "clear",
    "lifecycle_state": "active",
    "recommendation_state": "preferred"
  },
  "relations": [
    {"relation_type": "variant_of", "target_id": "uuid-2"}
  ]
}
```

## 5. v0.1 비목표
- GraphQL
- public auth
- streaming search
- collaborative comments
