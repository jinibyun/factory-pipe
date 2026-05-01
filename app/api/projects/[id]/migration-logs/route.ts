import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrationLogs } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import type { MigrationLogRow } from "@/types";

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function toMigrationLogRow(l: typeof migrationLogs.$inferSelect): MigrationLogRow {
  return {
    id: l.id,
    project_id: l.projectId,
    sql_query: l.sqlQuery,
    status: l.status as "success" | "failed",
    applied_at: toIso(l.appliedAt),
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
      .from(migrationLogs)
      .where(eq(migrationLogs.projectId, id))
      .orderBy(desc(migrationLogs.appliedAt));
    return NextResponse.json(rows.map(toMigrationLogRow));
  } catch (err) {
    console.error("[GET /api/projects/[id]/migration-logs]", err);
    return NextResponse.json({ error: "Failed to fetch migration logs" }, { status: 500 });
  }
}
