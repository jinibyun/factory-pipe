import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { ProjectRow } from "@/types";

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function toProjectRow(p: typeof projects.$inferSelect): ProjectRow {
  return {
    id: p.id,
    user_id: p.userId,
    name: p.name,
    description: p.description,
    status: p.status,
    created_at: toIso(p.createdAt),
    updated_at: toIso(p.updatedAt),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(toProjectRow(project));
  } catch (err) {
    console.error("[GET /api/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<{
      name: string;
      description: string;
      status: string;
    }>;

    const updates: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(toProjectRow(updated));
  } catch (err) {
    console.error("[PATCH /api/projects/[id]]", err);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
