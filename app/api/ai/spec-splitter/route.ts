import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import type { SpecSplitterRequest, SpecSplitterResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SpecSplitterRequest;
    if (!body.project_id || !body.overview_content) {
      return NextResponse.json(
        { error: "project_id and overview_content are required" },
        { status: 400 },
      );
    }

    // TODO: replace with Claude 3.5 Sonnet API call that actually splits the overview
    // For now, fetch existing document contents from DB and return them
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, body.project_id));

    const find = (type: string) =>
      docs.find((d) => d.docType === type)?.content;

    const response: SpecSplitterResponse = {
      "01_db_schema": find("01_db_schema") ?? DEFAULT_SPECS.db,
      "02_api_routes": find("02_api_routes") ?? DEFAULT_SPECS.api,
      "03_frontend_ui": find("03_frontend_ui") ?? DEFAULT_SPECS.ui,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/ai/spec-splitter]", err);
    return NextResponse.json({ error: "Failed to split spec" }, { status: 500 });
  }
}
