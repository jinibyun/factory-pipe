import { NextResponse } from "next/server";
import { lockDocument } from "@/lib/mock-store";
import type { LockDocumentRequest, LockDocumentResponse } from "@/types";

// TODO: Supabase Auth 검증 + Workflow Locking 규칙 검증
async function delay() {
  await new Promise((r) => setTimeout(r, 300));
}

export async function PUT(req: Request) {
  await delay();
  const body = (await req.json()) as LockDocumentRequest;
  if (!body.document_id) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 });
  }

  const doc = lockDocument(body.document_id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const response: LockDocumentResponse = {
    status: "locked",
    next_phase_unlocked: true,
  };
  return NextResponse.json(response);
}
