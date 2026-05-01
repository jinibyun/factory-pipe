import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { SyncDocumentRequest, SyncDocumentResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SyncDocumentRequest;
    if (!body.project_id || !body.doc_type || body.content === undefined) {
      return NextResponse.json(
        { error: "project_id, doc_type, content are required" },
        { status: 400 },
      );
    }

    // Upsert: update existing doc or insert new one
    const [existing] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.projectId, body.project_id),
          eq(documents.docType, body.doc_type),
        ),
      );

    if (existing) {
      await db
        .update(documents)
        .set({
          content: body.content,
          version: existing.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, existing.id));
    } else {
      await db.insert(documents).values({
        projectId: body.project_id,
        docType: body.doc_type,
        content: body.content,
        status: "Draft",
        version: 1,
      });
    }

    // TODO: replace with real GitHub API commit
    const fakeSha = `sha-${Date.now().toString(16)}`;
    const response: SyncDocumentResponse = {
      status: "success",
      commit_sha: fakeSha,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[POST /api/github/documents/sync]", err);
    return NextResponse.json({ error: "Failed to sync document" }, { status: 500 });
  }
}
