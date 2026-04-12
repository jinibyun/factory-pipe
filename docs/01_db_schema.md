## 1. 개요

- **Database**: supabase or Neon (PostgreSQL) [6]
- **인증**: supabase or Neon Auth 연동 (`auth.users`) [6, 11]
- **원칙**: 모든 테이블은 RLS(Row Level Security)를 활성화하여 데이터 접근을 철저히 통제함 [26].

## 2. 테이블 설계 (Tables & Relationships)

### 2.1 `users` (사용자 프로필)

supabase or Neon `auth.users` 생성 시 트리거를 통해 자동 생성되는 확장 프로필 테이블.

- `id` (uuid, PK) - `auth.users.id` 참조 (Cascade)
- `email` (text, unique)
- `github_username` (text, nullable) - GitHub 연동 시 저장
- `created_at` (timestamptz)

### 2.2 `projects` (프로젝트 메타데이터)

- `id` (uuid, PK)
- `user_id` (uuid, FK) - `users.id` 참조 (Cascade)
- `name` (text) - 프로젝트명
- `description` (text, nullable)
- `status` (text) - default: 'active'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2.3 `documents` (.md 파일 상태 및 이력)

진실의 원천인 마크다운 파일들의 상태를 관리.

- `id` (uuid, PK)
- `project_id` (uuid, FK) - `projects.id` 참조 (Cascade)
- `doc_type` (text) - ex: '00_overview', '01_db_schema', '02_api_routes'
- `content` (text) - 실제 마크다운 텍스트
- `status` (text) - 'Draft', 'Final', 'Implemented' 중 택 1 (기본값: 'Draft')
- `version` (int) - 리비전 관리용 (기본값: 1)
- `updated_at` (timestamptz)

### 2.4 `migration_logs` (DB 변경 이력)

- `id` (uuid, PK)
- `project_id` (uuid, FK) - `projects.id` 참조 (Cascade)
- `sql_query` (text) - 실행된 마이그레이션 쿼리
- `status` (text) - 'success', 'failed'
- `applied_at` (timestamptz) - default: now()

### 2.5 `requirements` (사용자 입력 요구사항)

- `id` (uuid, PK)
- `project_id` (uuid, FK) - `projects.id` 참조 (Cascade)
- `question_key` (text) - ex: 'core_value', 'target_user'
- `answer_text` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2.6 `prompts` (프롬프트 템플릿 자산)

시스템 레벨에서 관리되는 공통 자산 테이블.

- `id` (uuid, PK)
- `phase` (text) - ex: 'step1_notebooklm', 'step4_stitching'
- `template_content` (text) - 인젝션 가능한 변수({{VAR}})가 포함된 텍스트
- `version` (int)
- `created_at` (timestamptz)

## 3. RLS (Row Level Security) 정책

`prompts` (시스템 공통) 테이블을 제외한 모든 데이터는 소유자만 접근 가능 [26].

SQL

- `- Projects 테이블 예시ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECTUSING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERTWITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETEUSING (auth.uid() = user_id);`

*(위 RLS 패턴을 `documents`, `migration_logs`, `requirements` 테이블의 `project_id`를 조인하여 동일하게 적용)*

## 4. 인덱스 (Indexes)

조회 성능을 위한 필수 인덱스 설계 [26].

- `CREATE INDEX idx_projects_user_id ON projects(user_id);`
- `CREATE INDEX idx_documents_project_id ON documents(project_id);`
- `CREATE INDEX idx_documents_doc_type ON documents(doc_type);`