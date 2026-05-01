import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirements } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import type { RequirementRow, UpsertRequirementRequest } from "@/types";

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function toRequirementRow(r: typeof requirements.$inferSelect): RequirementRow {
  return {
    id: r.id,
    project_id: r.projectId,
    question_key: r.questionKey,
    answer_text: r.answerText,
    created_at: toIso(r.createdAt),
    updated_at: toIso(r.updatedAt),
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
      .from(requirements)
      .where(eq(requirements.projectId, id));
    return NextResponse.json(rows.map(toRequirementRow));
  } catch (err) {
    console.error("[GET /api/projects/[id]/requirements]", err);
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpsertRequirementRequest;
    if (!body.question_key?.trim()) {
      return NextResponse.json({ error: "question_key is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(requirements)
      .where(
        and(
          eq(requirements.projectId, id),
          eq(requirements.questionKey, body.question_key),
        ),
      );

    let result: typeof requirements.$inferSelect;

    if (existing) {
      const [updated] = await db
        .update(requirements)
        .set({ answerText: body.answer_text ?? "", updatedAt: new Date() })
        .where(eq(requirements.id, existing.id))
        .returning();
      result = updated;
    } else {
      const [created] = await db
        .insert(requirements)
        .values({
          projectId: id,
          questionKey: body.question_key,
          answerText: body.answer_text ?? "",
        })
        .returning();
      result = created;
    }

    return NextResponse.json(toRequirementRow(result), { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects/[id]/requirements]", err);
    return NextResponse.json({ error: "Failed to upsert requirement" }, { status: 500 });
  }
}
