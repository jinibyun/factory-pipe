import { NextResponse } from "next/server";
import { getDocuments } from "@/lib/mock-store";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import type { AssembleRequest, AssembleResponse } from "@/types";

// TODO: Supabase Auth 검증 + 실제 프롬프트 템플릿 DB 조회
async function delay() {
  await new Promise((r) => setTimeout(r, 400));
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as AssembleRequest;
  if (!body.project_id || !body.target_phase) {
    return NextResponse.json({ error: "project_id and target_phase are required" }, { status: 400 });
  }

  const docs = getDocuments(body.project_id);
  const dbContent = docs.find((d) => d.doc_type === "01_db_schema")?.content ?? DEFAULT_SPECS.db;
  const apiContent = docs.find((d) => d.doc_type === "02_api_routes")?.content ?? DEFAULT_SPECS.api;
  const uiContent = docs.find((d) => d.doc_type === "03_frontend_ui")?.content ?? DEFAULT_SPECS.ui;

  const isCursor = body.target_phase.includes("cursor") || body.target_phase === "step3_ui_generation";
  const header = isCursor
    ? "# Cursor — 구현 프롬프트 (Final 명세 기반)\n\n다음 명세를 준수해 코드를 작성하세요.\n"
    : "# v0 — UI 프롬프트 (Final 명세 기반)\n\n다음 명세를 반영한 화면을 생성하세요.\n";

  const footer = isCursor
    ? "\n\n---\n스택: Next.js App Router, TypeScript, Tailwind. API는 Route Handlers.\n"
    : "\n\n---\n스택: Next.js, Tailwind, shadcn/ui 스타일.\n";

  const assembled_prompt = [
    header,
    "\n## 01 DB\n",
    dbContent,
    "\n\n## 02 API\n",
    apiContent,
    "\n\n## 03 UI\n",
    uiContent,
    footer,
  ].join("");

  const response: AssembleResponse = { assembled_prompt };
  return NextResponse.json(response);
}
