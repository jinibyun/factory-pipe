import { NextResponse } from "next/server";
import { upsertDocument } from "@/lib/mock-store";
import type { SyncDocumentRequest, SyncDocumentResponse } from "@/types";

// TODO: Supabase Auth 검증 + 실제 GitHub API 연동
async function delay() {
  await new Promise((r) => setTimeout(r, 600));
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as SyncDocumentRequest;
  if (!body.project_id || !body.doc_type || body.content === undefined) {
    return NextResponse.json({ error: "project_id, doc_type, content are required" }, { status: 400 });
  }

  upsertDocument(body.project_id, body.doc_type, body.content);

  const fakeSha = `mock-${Date.now().toString(16)}`;
  const response: SyncDocumentResponse = {
    status: "success",
    commit_sha: fakeSha,
  };
  return NextResponse.json(response);
}
