## 1. 개요

- **Database**: Neon (PostgreSQL 17, `aws-us-east-1`)
- **ORM**: Drizzle ORM (`drizzle-orm` + `drizzle-orm/neon-http`)
- **드라이버**: `@neondatabase/serverless` (HTTP 기반 서버리스 드라이버)
- **인증**: 이메일/비밀번호 기반 자체 인증 구현 완료 (`jose` JWT + `bcryptjs` 비밀번호 해시). `fp-session` HTTP-only 쿠키로 세션 관리. 이전에 사용하던 `DEV_USER_ID` 플레이스홀더 완전 제거.
- **원칙**: 모든 테이블은 RLS(Row Level Security) 활성화 예정. 현재는 미적용 상태.

## 2. 테이블 설계 (Tables & Relationships)

### 2.1 `users` (사용자 프로필)

회원가입(`POST /api/auth/signup`) 시 `bcrypt(12)` 해시된 비밀번호와 함께 row가 생성됨.

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `email` | text | NOT NULL, UNIQUE | — | 로그인 식별자 |
| `password_hash` | text | nullable | — | bcrypt 해시 (rounds=12). OAuth 등 외부 인증 시 NULL 허용 예정 |
| `github_username` | text | nullable | — | GitHub 연동 시 저장 |
| `created_at` | timestamptz | NOT NULL | `now()` | |

### 2.2 `projects` (프로젝트 메타데이터)

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `user_id` | uuid | NOT NULL, FK → `users.id` ON DELETE CASCADE | — | |
| `name` | text | NOT NULL | — | |
| `description` | text | nullable | — | |
| `status` | text | NOT NULL | `'active'` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | PATCH 시 갱신 |

### 2.3 `documents` (.md 파일 상태 및 이력)

프로젝트 생성 시 `00_overview`, `01_db_schema`, `02_api_routes`, `03_frontend_ui` 4개 row가 자동 시딩됨.

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `project_id` | uuid | NOT NULL, FK → `projects.id` ON DELETE CASCADE | — | |
| `doc_type` | text | NOT NULL | — | `'00_overview'` \| `'01_db_schema'` \| `'02_api_routes'` \| `'03_frontend_ui'` |
| `content` | text | NOT NULL | — | 실제 마크다운 텍스트 |
| `status` | text | NOT NULL, CHECK | `'Draft'` | `'Draft'` \| `'Final'` \| `'Implemented'` |
| `version` | integer | NOT NULL | `1` | sync 시 +1 증가 |
| `updated_at` | timestamptz | NOT NULL | `now()` | |

**CHECK 제약**: `documents_status_check` — `status IN ('Draft', 'Final', 'Implemented')`

### 2.4 `migration_logs` (DB 변경 이력)

SQL 실행 성공/실패 모두 기록됨 (`/api/database/migrate` 참고).

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `project_id` | uuid | NOT NULL, FK → `projects.id` ON DELETE CASCADE | — | |
| `sql_query` | text | NOT NULL | — | 실행된 SQL |
| `status` | text | NOT NULL, CHECK | — | `'success'` \| `'failed'` |
| `applied_at` | timestamptz | NOT NULL | `now()` | |

**CHECK 제약**: `migration_logs_status_check` — `status IN ('success', 'failed')`

### 2.5 `requirements` (사용자 입력 요구사항)

`(project_id, question_key)` 조합으로 upsert 처리됨 (DB 레벨 unique 제약 없음, 코드에서 중복 체크).

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `project_id` | uuid | NOT NULL, FK → `projects.id` ON DELETE CASCADE | — | |
| `question_key` | text | NOT NULL | — | 예: `'overview'` |
| `answer_text` | text | NOT NULL | — | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | upsert 시 갱신 |

### 2.6 `prompts` (프롬프트 템플릿 자산)

시스템 레벨 공통 자산 테이블. 현재 `/api/prompts/assemble`은 이 테이블을 조회하지 않고 코드 내 하드코딩된 템플릿을 사용함. 향후 DB 기반 동적 템플릿 관리 시 활성화 예정.

| 컬럼 | 타입 | 제약 | 기본값 | 비고 |
|------|------|------|--------|------|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | |
| `phase` | text | NOT NULL | — | 예: `'step3_ui_generation_cursor'` |
| `template_content` | text | NOT NULL | — | `{{VAR}}` 변수 포함 가능 |
| `version` | integer | NOT NULL | `1` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |

## 3. 테이블 관계 (Relationships)

```
users (1)
  └── projects (N)  [user_id → users.id, CASCADE]
        ├── documents (N)       [project_id → projects.id, CASCADE]
        ├── migration_logs (N)  [project_id → projects.id, CASCADE]
        └── requirements (N)    [project_id → projects.id, CASCADE]

prompts  (독립 테이블 — FK 없음)
```

## 4. RLS (Row Level Security) 정책

> **현재 미적용 상태.** Auth 구현 완료 후 아래 패턴으로 적용 예정.

`prompts` (시스템 공통) 테이블을 제외한 모든 테이블에 소유자 기반 정책 적용 계획:

```sql
-- Projects 테이블 예시
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);
```

*(위 RLS 패턴을 `documents`, `migration_logs`, `requirements` 테이블에 `project_id`를 통해 동일하게 적용)*

## 5. 인덱스 (Indexes)

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
```
