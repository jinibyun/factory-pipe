## 1. 개요

- **Framework:** Next.js 14 (App Router, **JavaScript**)
- **Styling & UI:** Tailwind CSS, Shadcn UI (Dark 모드 기본 적용)
- **State Management: React Context API** (전역 Workflow Lock 상태 관리)
- **디자인 컨셉:** Vercel 대시보드 형태의 군더더기 없는 B2B SaaS 레이아웃.

## 2. 공통 레이아웃 (Layout Structure)

**`app/project/[id]/layout.js`**

### 2.1 좌측 사이드바 (Phase Navigator)

프로젝트 진행 단계를 보여주는 내비게이션 바. 상태에 따라 시각적 피드백 제공.

- **Phase 1:** 요구사항 입력 (Requirements)
- **Phase 2:** 명세서 분할 및 확정 (Spec Splitter & Lock)
- **Phase 3:** 프롬프트 조립 (Prompt Injector)
- **Phase 4:** DB 마이그레이션 (Migration Monitor)
- **상태 인디케이터:** * `Completed`: 이전 단계가 'Final'로 Lock 됨.
    - `Current`: 현재 진행 중인 단계.
    - `Locked`: 이전 단계가 끝나지 않아 접근 불가 (클릭 시 라우팅 차단).

### 2.2 우측 메인 패널 (Main Content Area)

선택된 Phase에 따라 동적으로 바뀌는 작업 영역.

## 3. 핵심 화면 상세 요구사항

### 3.1 프로젝트 목록 및 생성 (`app/page.js`)

- **기능:** 내 프로젝트 목록 조회 및 신규 프로젝트 생성.
- **UI 요소:** * 'New Project' 버튼 클릭 시 모달 오픈.
    - 프로젝트명, 설명 입력 및 `00_overview.md` 초안을 붙여넣는 대형 Textarea.

### 3.2 Phase 2: 명세서 분할 및 Lock (`app/project/[id]/phase/2/page.js`)

- **기능:** AI 생성 명세서(`01_db`, `02_api`, `03_ui`) 검토 및 확정.
- **UI 요소:**
    - **Markdown 뷰어/에디터:** 탭(Tab) 형태로 3개 파일 전환 조회/수정.
    - **동기화 버튼:** `[GitHub Sync]` (수정 사항 커밋).
    - **Workflow Lock 제어:** `[Approve & Lock to Final]` 버튼 및 확정 경고 팝업.

### 3.3 Phase 3: 프롬프트 인젝터 (`app/project/[id]/phase/3/page.js`)

- **기능:** 'Final' 명세서 기반 Cursor/v0용 프롬프트 자동 조립.
- **UI 요소:**
    - **타겟 선택기:** `[Cursor용]` vs `[v0용]`
    - **결과물 출력:** 읽기 전용 텍스트 영역 및 `[Copy to Clipboard]` 버튼.

### 3.4 Phase 4: 마이그레이션 모니터 (`app/project/[id]/phase/4/page.js`)

- **기능:** UI에서 Supabase SQL 실행 및 스키마 파일 강제 동기화.
- **UI 요소:**
    - **SQL 에디터:** 쿼리 입력 코드 블록.
    - **실행 버튼:** `[Execute & Sync]`
    - **로그 패널:** `migration_logs` 성공/실패 실시간 텍스트 출력.

## 4. 프론트엔드 로직 (Workflow Locking 방어 로직)

1. **WorkflowContext 설정:** `app/layout.js` 또는 프로젝트 레이아웃에서 `Provider`로 프로젝트 상태(Lock 여부) 공유.
2. **접근 제어:** 특정 Phase 접근 시 Context의 상태값을 확인하여, 이전 단계가 'Final'이 아니면 `/phase/2`로 리다이렉트 또는 접근 차단 오버레이 표시.