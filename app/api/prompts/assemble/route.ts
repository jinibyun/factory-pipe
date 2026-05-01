import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import type { AssembleRequest, AssembleResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssembleRequest;
    if (!body.project_id || !body.target_phase) {
      return NextResponse.json(
        { error: "project_id and target_phase are required" },
        { status: 400 },
      );
    }

    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, body.project_id));

    const find = (type: string) =>
      docs.find((d) => d.docType === type)?.content;

    const dbContent = find("01_db_schema") ?? DEFAULT_SPECS.db;
    const apiContent = find("02_api_routes") ?? DEFAULT_SPECS.api;
    const uiContent = find("03_frontend_ui") ?? DEFAULT_SPECS.ui;

    const isCursor =
      body.target_phase.includes("cursor") ||
      body.target_phase === "step3_ui_generation";

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
  } catch (err) {
    console.error("[POST /api/prompts/assemble]", err);
    return NextResponse.json({ error: "Failed to assemble prompt" }, { status: 500 });
  }
}
