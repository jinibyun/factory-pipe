import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { DocumentRow, DocType, DocStatus } from "@/types";

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function toDocumentRow(d: typeof documents.$inferSelect): DocumentRow {
  return {
    id: d.id,
    project_id: d.projectId,
    doc_type: d.docType as DocType,
    content: d.content,
    status: d.status as DocStatus,
    version: d.version,
    updated_at: toIso(d.updatedAt),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, id));
    return NextResponse.json(rows.map(toDocumentRow));
  } catch (err) {
    console.error("[GET /api/projects/[id]/documents]", err);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
