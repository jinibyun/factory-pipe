## 1. 개요

- **Framework:** Next.js App Router (`app/api/...`), TypeScript
- **ORM:** Drizzle ORM + `@neondatabase/serverless` (Neon HTTP 드라이버)
- **인증:** 현재 미구현 — 모든 API는 인증 없이 동작 (`DEV_USER_ID` 고정 사용). Neon Auth Bearer 토큰 검증은 추후 적용 예정.
- **공통 에러 응답 형식:** `{ "error": "메시지" }`

## 2. API 엔드포인트 상세

### 2.1 프로젝트 관리

---

**`GET /api/projects`**

- **기능:** 전체 프로젝트 목록 조회 (생성일 역순 정렬)
- **Response (200 OK):** `ProjectRow[]`

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "description": "string | null",
    "status": "active",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

- **Error (500):** DB 조회 실패

---

**`POST /api/projects`**

- **기능:** 신규 프로젝트 생성. `DEV_USER_ID` 유저를 upsert한 뒤 프로젝트 insert. 생성 시 `documents` 테이블에 `00_overview`, `01_db_schema`, `02_api_routes`, `03_frontend_ui` 4개 row를 자동 시딩.
- **Request Body:**

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "overview_draft": "string (optional) — 00_overview 문서 초기 내용"
}
```

- **Response (201 Created):** `ProjectRow`
- **Error (400):** `name` 누락
- **Error (500):** DB 오류

---

**`GET /api/projects/[id]`**

- **기능:** 특정 프로젝트 단건 조회
- **Response (200 OK):** `ProjectRow`
- **Error (404):** 프로젝트 없음
- **Error (500):** DB 오류

---

**`PATCH /api/projects/[id]`**

- **기능:** 프로젝트 부분 수정 (`name`, `description`, `status` 중 전달된 필드만 업데이트). `updated_at` 자동 갱신.
- **Request Body (모두 optional):**

```json
{
  "name": "string",
  "description": "string",
  "status": "string"
}
```

- **Response (200 OK):** 업데이트된 `ProjectRow`
- **Error (404):** 프로젝트 없음
- **Error (500):** DB 오류

---

**`GET /api/projects/[id]/documents`**

- **기능:** 특정 프로젝트의 모든 문서(4종) 조회
- **Response (200 OK):** `DocumentRow[]`

```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "doc_type": "00_overview | 01_db_schema | 02_api_routes | 03_frontend_ui",
    "content": "string",
    "status": "Draft | Final | Implemented",
    "version": 1,
    "updated_at": "ISO8601"
  }
]
```

- **Error (500):** DB 오류

---

**`GET /api/projects/[id]/requirements`**

- **기능:** 특정 프로젝트의 요구사항 목록 조회
- **Response (200 OK):** `RequirementRow[]`

```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "question_key": "string",
    "answer_text": "string",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
]
```

---

**`POST /api/projects/[id]/requirements`**

- **기능:** 요구사항 upsert. `question_key`가 이미 존재하면 `answer_text` 업데이트, 없으면 신규 삽입. (DB unique 제약 없음 — 코드에서 중복 체크)
- **Request Body:**

```json
{
  "question_key": "string (required)",
  "answer_text": "string"
}
```

- **Response (201 Created):** `RequirementRow`
- **Error (400):** `question_key` 누락
- **Error (500):** DB 오류

---

**`GET /api/projects/[id]/migration-logs`**

- **기능:** 특정 프로젝트의 마이그레이션 실행 이력 조회 (`applied_at` 역순)
- **Response (200 OK):** `MigrationLogRow[]`

```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "sql_query": "string",
    "status": "success | failed",
    "applied_at": "ISO8601"
  }
]
```

---

### 2.2 문서 관리

---

**`POST /api/github/documents/sync`**

- **기능:** `documents` 테이블에 해당 `(project_id, doc_type)` 문서를 upsert. 이미 존재하면 `content` 업데이트 + `version` +1. 없으면 신규 insert. GitHub 실제 커밋은 **미구현 (TODO)** — 임시 SHA (`sha-{timestamp}`) 반환.
- **Request Body:**

```json
{
  "project_id": "uuid",
  "doc_type": "00_overview | 01_db_schema | 02_api_routes | 03_frontend_ui",
  "content": "string",
  "commit_message": "string"
}
```

- **Response (200 OK):** `{ "status": "success", "commit_sha": "sha-..." }`
- **Error (400):** `project_id`, `doc_type`, `content` 중 누락
- **Error (500):** DB 오류

---

**`PUT /api/documents/lock`**

- **기능:** 특정 문서의 `status`를 `'Final'`로 변경. `updated_at` 갱신.
- **Request Body:** `{ "document_id": "uuid", "status": "Final" }`
- **Response (200 OK):** `{ "status": "locked", "next_phase_unlocked": true }`
- **Error (400):** `document_id` 누락
- **Error (404):** 문서 없음
- **Error (500):** DB 오류

---

### 2.3 AI 에이전트 연동

---

**`POST /api/ai/spec-splitter`**

- **기능:** 해당 프로젝트의 `documents` 테이블에서 3개 명세서(`01_db_schema`, `02_api_routes`, `03_frontend_ui`) 내용을 조회하여 반환. **현재 AI 호출 미구현 (TODO: Claude 3.5 Sonnet 연동 예정)** — DB에 저장된 내용 그대로 반환, 없으면 DEFAULT_SPECS fallback.
- **Request Body:**

```json
{
  "project_id": "uuid",
  "overview_content": "string"
}
```

- **Response (200 OK):**

```json
{
  "01_db_schema": "string",
  "02_api_routes": "string",
  "03_frontend_ui": "string"
}
```

- **Error (400):** `project_id` 또는 `overview_content` 누락
- **Error (500):** DB 오류

---

**`POST /api/ai/judge`**

- **기능:** 코드 스니펫이 명세서와 일치하는지 검증. **현재 Mock 구현** — 항상 `is_valid: true` 반환 (TODO: GPT-4o-mini API 연동 예정).
- **Request Body:**

```json
{
  "target_doc_type": "string",
  "code_snippet": "string"
}
```

- **Response (200 OK):**

```json
{
  "is_valid": true,
  "feedback": "string",
  "violation_points": []
}
```

- **Error (400):** `target_doc_type` 또는 `code_snippet` 누락

---

### 2.4 프롬프트 조립

---

**`POST /api/prompts/assemble`**

- **기능:** `documents` 테이블에서 `01_db_schema`, `02_api_routes`, `03_frontend_ui` 내용을 읽어 `target_phase`에 맞는 Cursor용/v0용 프롬프트 문자열 조립. `target_phase`에 `"cursor"` 포함 또는 `"step3_ui_generation"`이면 Cursor 헤더/푸터 적용, 그 외엔 v0 헤더/푸터. **`prompts` 테이블은 현재 미사용 — 템플릿 하드코딩 상태.**
- **Request Body:**

```json
{
  "project_id": "uuid",
  "target_phase": "step3_ui_generation_cursor | step3_ui_generation_v0"
}
```

- **Response (200 OK):** `{ "assembled_prompt": "string" }`
- **Error (400):** `project_id` 또는 `target_phase` 누락
- **Error (500):** DB 오류

---

### 2.5 DB 마이그레이션

---

**`POST /api/database/migrate`**

- **기능:** `db.execute(sql.raw(...))` 로 임의 SQL을 Neon DB에 직접 실행. 실행 결과(성공/실패 모두) `migration_logs` 테이블에 기록. SQL 실패 시에도 log row는 삽입됨.
- **Request Body:**

```json
{
  "project_id": "uuid",
  "sql_query": "string — 실행할 SQL"
}
```

- **Response (200 OK):** `{ "status": "success", "log_id": "uuid" }`
- **Error (400):** SQL 실행 실패 시 `{ "status": "failed", "log_id": "uuid", "error_message": "string" }`
- **Error (400):** `project_id` 또는 `sql_query` 누락
- **Error (500):** 요청 처리 자체 실패

---

## 3. 공통 에러 핸들링 (Error Codes)

| 코드 | 의미 | 현재 구현 여부 |
|------|------|--------------|
| `400 Bad Request` | 필수 파라미터 누락 또는 SQL 실행 실패 | ✅ 구현됨 |
| `401 Unauthorized` | 유효하지 않은 세션/토큰 | ❌ 미구현 (Auth 연동 후 적용 예정) |
| `403 Forbidden` | Workflow Locking 위반 | ❌ 미구현 (클라이언트 측 가드로만 처리) |
| `404 Not Found` | 리소스 없음 | ✅ 구현됨 (projects, documents) |
| `500 Internal Server Error` | DB 통신 실패 또는 외부 API 오류 | ✅ 구현됨 |
