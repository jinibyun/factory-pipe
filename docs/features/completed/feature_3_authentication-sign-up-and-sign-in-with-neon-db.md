# [Feature #3] authentication sign up and sign in with neon db

---
> 🤖 **Cursor Agent 작업 지시서 (System Prompt)**
> 너는 에이전시의 수석 개발자다. 주어진 마스터 문서(@01_db_schema.md, @02_api_routes.md, @03_frontend_ui.md)는 시스템 뼈대 파악을 위해 반드시 읽되, 절대 직접 수정하지 마라.
> 
> **[작업 3단계 프로세스 - 엄수할 것]**
> 1. **작업 중**: 이 Feature MD의 요구사항과 마스터 MD(참조용)를 보고 코드를 짠다. 스택은 [Next.js + Tailwind + Neon/Supabase Auth]로 고정한다.
> 2. **작업 완료 직후**: 마스터 문서는 건드리지 말고, 이 Feature MD 하단 [반영된 최종 스펙]에 변경된 스펙만 요약 기록해라.
> 3. **다음 작업 시작 전 (역동기화 준비)**: 개발자가 별도의 '역동기화 프롬프트'를 내리기 전까지 마스터 문서는 현재 상태를 유지한다.
---

## 1. 요구사항 명세 (Issue Content)
- sign in and sign up with neon db
- front page should have the link on the top right.
- main entrance page should be login / sing up age.
- once login, the page should show logout button
- until user log in successfully, user cannot move to the project list page.

## 2. 반영된 최종 스펙 (AI 작업 결과물)

### DB 변경
- `users` 테이블에 `password_hash TEXT` 컬럼 추가 (nullable, ALTER TABLE 마이그레이션 완료)
- Drizzle 스키마(`lib/schema.ts`) `users` 정의에 `passwordHash` 필드 추가

### 신규 API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 이메일+비밀번호 회원가입, HTTP-only JWT 쿠키 설정 |
| POST | `/api/auth/login` | 이메일+비밀번호 로그인, HTTP-only JWT 쿠키 설정 |
| POST | `/api/auth/logout` | 세션 쿠키 삭제 |
| GET | `/api/auth/me` | 현재 로그인 유저 정보 반환 (`userId`, `email`) |

### 신규 파일
| 파일 | 역할 |
|------|------|
| `lib/auth.ts` | JWT 서명/검증 유틸 (Edge-safe, `jose` 사용) |
| `lib/session.ts` | 서버 전용 세션 읽기 (`next/headers` cookies) |
| `middleware.ts` | `/login`, `/signup`, `/api/auth/*` 제외 전체 라우트 보호 |
| `app/login/page.tsx` | 로그인 UI (`/login`) |
| `app/signup/page.tsx` | 회원가입 UI (`/signup`) |

### 수정 파일
- `app/page.tsx`: 헤더 우측에 로그인 유저 이메일 + 로그아웃 버튼 추가
- `app/api/projects/route.ts`: `DEV_USER_ID` 제거 → 세션 `userId` 사용. `GET`도 로그인 유저의 프로젝트만 조회
- `.env.local`: `AUTH_SECRET` 추가

### 인증 흐름
1. 미로그인 → 모든 페이지 접근 시 `/login` 리다이렉트 (Next.js 미들웨어)
2. 로그인/회원가입 성공 → HTTP-only 쿠키(`fp-session`)에 7일 만료 JWT 저장 → `/` 이동
3. 로그아웃 → 쿠키 삭제 → `/login` 이동
4. 패키지: `jose` (JWT), `bcryptjs` (비밀번호 해시)

---
### ⚠️ 개발자 전용: 역동기화 프롬프트 템플릿 (복사해서 사용)
아래 프롬프트를 복사하여 새 채팅창에 입력하고 마스터 문서를 최신화하세요.
```text
@01_db_schema.md @02_api_routes.md @03_frontend_ui.md @(현재 작업한 코드 폴더/파일들)
현재 구현된 실제 소스 코드를 정답으로 간주하고, 변경된 사항을 바탕으로 마스터 MD 파일 3개를 최신화(덮어쓰기)해. 코드는 절대 수정하지 마.
```
