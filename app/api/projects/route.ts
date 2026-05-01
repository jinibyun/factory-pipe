import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, projects, documents } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import type { CreateProjectRequest, ProjectRow } from "@/types";

// Placeholder user until Neon Auth is wired up
const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

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

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    return NextResponse.json(rows.map(toProjectRow));
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateProjectRequest;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Ensure dev user exists (replaced by real auth later)
    await db
      .insert(users)
      .values({ id: DEV_USER_ID, email: "dev@factory-pipe.local" })
      .onConflictDoNothing();

    const [project] = await db
      .insert(projects)
      .values({
        userId: DEV_USER_ID,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        status: "active",
      })
      .returning();

    // Seed the four default spec documents for the new project
    await db.insert(documents).values([
      {
        projectId: project.id,
        docType: "00_overview",
        content: body.overview_draft ?? "",
        status: "Draft",
        version: 1,
      },
      {
        projectId: project.id,
        docType: "01_db_schema",
        content: DEFAULT_SPECS.db,
        status: "Draft",
        version: 1,
      },
      {
        projectId: project.id,
        docType: "02_api_routes",
        content: DEFAULT_SPECS.api,
        status: "Draft",
        version: 1,
      },
      {
        projectId: project.id,
        docType: "03_frontend_ui",
        content: DEFAULT_SPECS.ui,
        status: "Draft",
        version: 1,
      },
    ]);

    return NextResponse.json(toProjectRow(project), { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
