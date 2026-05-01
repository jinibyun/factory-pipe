import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { LockDocumentRequest, LockDocumentResponse } from "@/types";

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as LockDocumentRequest;
    if (!body.document_id) {
      return NextResponse.json({ error: "document_id is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(documents)
      .set({ status: "Final", updatedAt: new Date() })
      .where(eq(documents.id, body.document_id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const response: LockDocumentResponse = {
      status: "locked",
      next_phase_unlocked: true,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[PUT /api/documents/lock]", err);
    return NextResponse.json({ error: "Failed to lock document" }, { status: 500 });
  }
}
