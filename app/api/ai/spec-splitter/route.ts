import { NextResponse } from "next/server";
import { getDocuments } from "@/lib/mock-store";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import type { SpecSplitterRequest, SpecSplitterResponse } from "@/types";

// TODO: Supabase Auth 검증 + Claude 3.5 Sonnet API 연동
async function delay() {
  await new Promise((r) => setTimeout(r, 800));
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as SpecSplitterRequest;
  if (!body.project_id || !body.overview_content) {
    return NextResponse.json({ error: "project_id and overview_content are required" }, { status: 400 });
  }

  // Return existing documents if available, otherwise fall back to defaults
  const docs = getDocuments(body.project_id);
  const dbDoc = docs.find((d) => d.doc_type === "01_db_schema");
  const apiDoc = docs.find((d) => d.doc_type === "02_api_routes");
  const uiDoc = docs.find((d) => d.doc_type === "03_frontend_ui");

  const response: SpecSplitterResponse = {
    "01_db_schema": dbDoc?.content ?? DEFAULT_SPECS.db,
    "02_api_routes": apiDoc?.content ?? DEFAULT_SPECS.api,
    "03_frontend_ui": uiDoc?.content ?? DEFAULT_SPECS.ui,
  };
  return NextResponse.json(response);
}
