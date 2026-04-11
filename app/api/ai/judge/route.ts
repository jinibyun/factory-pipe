import { NextResponse } from "next/server";
import type { JudgeRequest, JudgeResponse } from "@/types";

// TODO: Supabase Auth 검증 + GPT-4o-mini API 연동
async function delay() {
  await new Promise((r) => setTimeout(r, 500));
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as JudgeRequest;
  if (!body.target_doc_type || !body.code_snippet) {
    return NextResponse.json({ error: "target_doc_type and code_snippet are required" }, { status: 400 });
  }

  const response: JudgeResponse = {
    is_valid: true,
    feedback: "Mock 검증 통과: 코드가 명세서와 일치합니다.",
    violation_points: [],
  };
  return NextResponse.json(response);
}
