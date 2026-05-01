## 1. 개요

- **Framework:** Next.js 16.2.2 (App Router, **TypeScript**)
- **Styling & UI:** Tailwind CSS v3, Dark 모드 기본 적용 (`className="dark"`)
- **State Management:** React Context API — `WorkflowContext` (`contexts/workflow-context.tsx`)
- **아이콘:** `lucide-react`, `@radix-ui/react-icons`
- **디자인 컨셉:** Vercel 대시보드 스타일의 B2B SaaS 레이아웃. 배경 그리드 패턴 + 방사형 그래디언트 오버레이.

## 2. 라우팅 구조 (Route Tree)

```
app/
├── page.tsx                          → / (프로젝트 목록 홈)
├── layout.tsx                        → 루트 레이아웃 (html, body, Geist 폰트)
└── project/
    └── [id]/
        ├── page.tsx                  → /project/[id] → /project/[id]/phase/1 리다이렉트
        ├── layout.tsx                → WorkflowProvider + PhaseNavigator 사이드바
        └── phase/
            ├── 1/page.tsx            → Phase 1: 요구사항 입력
            ├── 2/page.tsx            → Phase 2: 명세서 분할 및 Lock
            ├── 3/page.tsx            → Phase 3: 프롬프트 인젝터
            └── 4/page.tsx            → Phase 4: 마이그레이션 모니터
```

## 3. 공통 레이아웃 (Layout Structure)

**`app/project/[id]/layout.tsx`** — Server Component

- `params.id`를 받아 `WorkflowProvider`와 `PhaseNavigator`를 조합한 2-컬럼 레이아웃 렌더링.

```
┌────────────────┬──────────────────────────────┐
│  PhaseNavigator│      Main Content (children)  │
│  (w-64, 좌측)  │      (flex-1, 우측)            │
└────────────────┴──────────────────────────────┘
```

### 3.1 `PhaseNavigator` 컴포넌트 (`components/phase-navigator.tsx`)

- **Client Component** (`"use client"`)
- `usePathname()`으로 현재 phase 번호 추출 (`/phase/:n` 패턴 매칭)
- `useWorkflow()`에서 `getPhaseStatus`, `canAccessPhase` 사용
- 4개 Phase 아이템 렌더링. Phase 상태별 아이콘:
  - `completed`: `<Check>` 아이콘 + 원형 배지 (bg-primary/20)
  - `current`: 숫자 배지 (border-2 border-primary)
  - `locked` / `blocked`: `<Lock>` 아이콘 + opacity-60 + 클릭 비활성화
  - `idle`: 숫자 배지 (border border-border)
- 프로젝트명: `useEffect`에서 `apiClient.getProject()` 호출로 실제 이름 표시

## 4. 전역 상태 — WorkflowContext (`contexts/workflow-context.tsx`)

**Client-side 전용**, `"use client"`.

### PhaseLocks 타입

```typescript
type PhaseLocks = {
  phase1: boolean;  // Phase 1 확정 여부 → Phase 2 잠금 해제
  phase2: boolean;  // Phase 2 확정 여부 → Phase 3 잠금 해제
  phase3: boolean;  // Phase 3 완료 여부 → Phase 4 잠금 해제
  phase4: boolean;  // Phase 4 완료 여부 → 전체 워크플로 완성
};
```

### 핵심 동작

| 항목 | 설명 |
|------|------|
| **초기값** | 모두 `false` (SSR Hydration 불일치 방지) |
| **localStorage 동기화** | mount 후 `useEffect`에서 `localStorage` 읽어 상태 갱신 |
| **API 동기화** | mount 시 `apiClient.getDocuments()` 호출 → 문서 `status === 'Final'` 기반으로 `phase1/2` 자동 도출, ratchet-forward merge |
| **저장** | `lockPhase(n)` 호출 시 localStorage에 즉시 저장 |

### canAccessPhase 로직

```
phase 1 → 항상 접근 가능
phase 2 → locks.phase1 === true
phase 3 → locks.phase2 === true
phase 4 → locks.phase3 === true
```

### getPhaseStatus 로직

```
locks에 해당 phase lock이 false이면 → "locked"
phase === currentPhase → "current"
해당 locks.phaseN === true → "completed"
그 외 → "idle"
```

## 5. 핵심 화면 상세

### 5.1 홈 — 프로젝트 목록 (`app/page.tsx`)

- **Client Component**
- **API 호출:** `GET /api/projects` (마운트 시)
- **UI 요소:**
  - 헤더: `Sparkles` 아이콘 + "Factory Pipe" 로고 + `[New Project]` 버튼
  - 프로젝트 카드 그리드 (`sm:grid-cols-2`): 이름, 설명, 생성일 표시
  - 프로젝트 없을 시 빈 상태 안내 + `[프로젝트 만들기]` 버튼
  - **New Project 모달** (`role="dialog"`, `aria-modal`):
    - 프로젝트명 (required), 설명 (optional)
    - `00_overview.md` 초안 textarea (monospace, resize-y)
    - 생성 완료 시 `/project/{id}/phase/1`으로 이동

### 5.2 Phase 1 — 요구사항 입력 (`app/project/[id]/phase/1/page.tsx`)

- **Client Component**, 접근 제한 없음 (Phase 1은 항상 접근 가능)
- **API 호출:**
  - 마운트 시: `GET /api/projects/[id]` + `GET /api/projects/[id]/requirements` (병렬)
  - 저장: `POST /api/projects/[id]/requirements` (`question_key: "overview"`)
- **UI 요소:**
  - 요구사항 자유 입력 textarea (monospace, resize-y, rows=18)
  - `[저장]` 버튼 → `apiClient.upsertRequirement()` 호출
  - `[Phase 1 확정 (Final)]` 버튼 → `save()` 후 `lockPhase(1)` 호출 → Phase 2 잠금 해제
  - 확정 후 버튼 텍스트 "Phase 1 확정됨"으로 변경 + disabled

### 5.3 Phase 2 — 명세서 분할 및 Lock (`app/project/[id]/phase/2/page.tsx`)

- **Client Component**, `<PhaseAccessGuard phase={2} />`로 접근 제어
- **API 호출:**
  - 마운트/재로드 시: `GET /api/projects/[id]/documents`
  - AI 생성: `GET /api/projects/[id]/requirements` + `POST /api/ai/spec-splitter`
  - 동기화: `POST /api/github/documents/sync`
  - 확정: `POST /api/github/documents/sync` (3개) → `PUT /api/documents/lock` (3개) → `lockPhase(2)`
- **UI 요소:**
  - 탭 전환: `[01 DB]`, `[02 API]`, `[03 UI]` (현재 탭 bg-primary 활성화)
  - `[AI 명세 생성]` 버튼 → spec-splitter 호출, 결과를 textarea에 반영
  - `[GitHub Sync]` 버튼 → 현재 탭 내용 DB에 저장 (GitHub 실제 커밋 미구현)
  - `[Approve & Lock to Final]` 버튼 → confirm 후 3개 문서 sync + lock + `lockPhase(2)`. 확정 후 "Final 확정됨" + disabled
  - 편집 가능 textarea (monospace, resize-y, rows=22)
  - 상태 메시지 (4초 후 자동 사라짐)

### 5.4 Phase 3 — 프롬프트 인젝터 (`app/project/[id]/phase/3/page.tsx`)

- **Client Component**, `<PhaseAccessGuard phase={3} />`로 접근 제어
- **API 호출:** `target` 변경 또는 마운트 시 `POST /api/prompts/assemble` 자동 실행
- **UI 요소:**
  - 타겟 선택: `[Cursor용]` / `[v0용]` 토글 (선택 시 즉시 재조립)
  - `[Copy to Clipboard]` 버튼 → 2초간 "복사됨" 피드백
  - `[완료 → Phase 4 잠금 해제]` 버튼 → confirm 후 `lockPhase(3)` 호출 → Phase 4 잠금 해제. 완료 후 "Phase 4 잠금 해제됨 ✓" + disabled
  - 읽기 전용 textarea (monospace, rows=24, bg-muted/30)

### 5.5 Phase 4 — 마이그레이션 모니터 (`app/project/[id]/phase/4/page.tsx`)

- **Client Component**, `<PhaseAccessGuard phase={4} />`로 접근 제어
- **API 호출:**
  - 마운트 시: `GET /api/projects/[id]/migration-logs`
  - SQL 실행: `POST /api/database/migrate` → 완료 후 로그 재조회
- **UI 요소:**
  - SQL 편집 textarea (monospace, resize-y, rows=14, `spellCheck={false}`)
  - `[Execute & Sync]` 버튼 → SQL을 Neon DB에 직접 실행, 결과를 로그 패널에 표시
  - `[마이그레이션 완료로 표시]` 버튼 → confirm 후 `lockPhase(4)` 호출 → 전체 워크플로 완성. 완료 후 "마이그레이션 완료 ✓" + disabled
  - `migration_logs` 패널: `[시간] 성공/실패: SQL 앞 60자…` 형식 텍스트 출력

## 6. 공통 컴포넌트

### `PhaseAccessGuard` (`components/phase-access-guard.tsx`)

- `canAccessPhase(phase)`가 `false`이면 해당 phase의 최소 허용 phase로 리다이렉트 처리

## 7. 디자인 시스템

- **다크 모드:** `<html className="dark">` 전역 적용, CSS 변수(`--background`, `--foreground` 등) 기반
- **Tailwind 주요 패턴:**
  - 카드: `rounded-2xl border border-white/10 bg-card/50`
  - 주요 버튼: `bg-primary text-primary-foreground rounded-md hover:bg-primary/90`
  - 보조 버튼: `border border-border rounded-md hover:bg-accent/30`
  - 비활성: `disabled:pointer-events-none disabled:opacity-40`
  - 입력: `border border-input bg-background rounded-lg focus-visible:ring-2 focus-visible:ring-ring`
  - 모노스페이스 에디터: `font-mono text-sm bg-background`
- **suppressHydrationWarning:** `<html>`에 적용 (Hydration 경고 억제)
