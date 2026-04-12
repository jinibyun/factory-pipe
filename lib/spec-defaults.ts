export const DEFAULT_SPECS = {
  db: `# 01 DB Schema (draft)

## 개요
supabase or Neon(Postgres) 기준 스키마 초안입니다.

## 테이블 예시
| 테이블 | 설명 |
|--------|------|
| projects | 파이프라인 프로젝트 |
| specs | 명세 버전 |
`,
  api: `# 02 API Routes (draft)

## 개요
Next.js Route Handlers 기준 API 초안입니다.

## 엔드포인트
- \`GET /api/projects\` — 목록
- \`POST /api/projects\` — 생성
`,
  ui: `# 03 Frontend UI (draft)

## 개요
대시보드·워크플로 화면 명세입니다.

## 화면
- 프로젝트 목록 / 생성
- Phase 네비게이션 + 단계별 패널
`,
} as const;
