## 1. 개요

- **Framework:** Next.js App Router (`app/api/...`)
- **인증 인가:** 모든 API는 supabase or Neon Auth Token (Bearer) 검증 필수. (미인증 시 `401 Unauthorized`)
- **핵심 원칙:** 마크다운 파일 조작은 반드시 GitHub API를 거쳐 레포지토리에 직접 커밋함 (진실의 원천 유지).

## 2. API 엔드포인트 상세

### 2.1 문서 관리 및 GitHub 연동 (Source of Truth)

**`POST /api/github/documents/sync`**

- **기능:** 대시보드에서 작성/수정된 `.md` 문서를 GitHub 레포지토리에 커밋하고 `documents` DB 상태를 업데이트.
- **Request:**JSON
    
    `{
      "project_id": "uuid",
      "doc_type": "01_db_schema",
      "content": "# Markdown content...",
      "commit_message": "Update DB schema for users table"
    }`
    
- **Response (200 OK):** `{"status": "success", "commit_sha": "abc1234..."}`

**`PUT /api/documents/lock`**

- **기능:** 특정 문서의 상태를 'Draft'에서 'Final'로 변경 (Workflow Locking 트리거).
- **Request:** `{"document_id": "uuid", "status": "Final"}`
- **Response (200 OK):** `{"status": "locked", "next_phase_unlocked": true}`

### 2.2 AI 에이전트 연동 (Spec Splitter & Judge)

**`POST /api/ai/spec-splitter`**

- **기능:** `00_overview.md`를 Claude 3.5 Sonnet API에 전송하여 DB, API, UI 명세서 초안을 분할 생성.
- **Request:**JSON
    
    `{
      "project_id": "uuid",
      "overview_content": "전체 기획 내용..."
    }`
    
- **Response (200 OK):**JSON
    
    `{
      "01_db_schema": "마크다운 내용...",
      "02_api_routes": "마크다운 내용...",
      "03_frontend_ui": "마크다운 내용..."
    }`
    

**`POST /api/ai/judge`**

- **기능:** 사용자가 작성한 코드가 마크다운 명세서와 일치하는지 GPT-4o-mini를 통해 검증.
- **Request:**JSON
    
    `{
      "target_doc_type": "02_api_routes",
      "code_snippet": "export async function POST..."
    }`
    
- **Response (200 OK):**JSON
    
    `{
      "is_valid": true,
      "feedback": "규격에 정확히 일치합니다.",
      "violation_points": []
    }`
    

### 2.3 프롬프트 인젝터 및 조립

**`POST /api/prompts/assemble`**

- **기능:** 현재 확정된('Final') 명세서들을 불러와 Cursor/v0용 문맥 맞춤형 프롬프트 생성.
- **Request:** `{"project_id": "uuid", "target_phase": "step3_ui_generation"}`
- **Response (200 OK):**JSON
    
    `{
      "assembled_prompt": "당신은 프론트엔드 개발자입니다. 다음 01_db와 02_api를 바탕으로..."
    }`
    

### 2.4 DB 마이그레이션 모니터 (supabase or Neon 제어)

**`POST /api/database/migrate`**

- **기능:** UI에서 입력한 SQL 쿼리를 supabase or Neon에 직접 실행하고 `migration_logs`에 기록.
- **Request:**JSON
    
    `{
      "project_id": "uuid",
      "sql_query": "CREATE TABLE test (id serial);"
    }`
    
- **Response (200 OK):** `{"status": "success", "log_id": "uuid"}`
- **Error (400 Bad Request):** `{"status": "failed", "error_message": "syntax error..."}`

## 3. 공통 에러 핸들링 (Error Codes)

- `400 Bad Request`: 필수 파라미터 누락 또는 잘못된 요청
- `401 Unauthorized`: 유효하지 않은 세션/토큰
- `403 Forbidden`: Workflow Locking 위반 (이전 단계 미완료 시 접근)
- `500 Internal Server Error`: 외부 API(GitHub, OpenAI, Anthropic) 통신 실패