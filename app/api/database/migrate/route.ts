import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { migrationLogs } from "@/lib/schema";
import { sql } from "drizzle-orm";
import type { MigrateRequest, MigrateResponse } from "@/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MigrateRequest;
    if (!body.project_id || !body.sql_query?.trim()) {
      return NextResponse.json(
        { error: "project_id and sql_query are required" },
        { status: 400 },
      );
    }

    const rawQuery = body.sql_query.trim();

    try {
      // Execute the raw SQL against Neon
      await db.execute(sql.raw(rawQuery));

      // Record success in migration_logs
      const [log] = await db
        .insert(migrationLogs)
        .values({
          projectId: body.project_id,
          sqlQuery: rawQuery,
          status: "success",
        })
        .returning();

      const response: MigrateResponse = { status: "success", log_id: log.id };
      return NextResponse.json(response);
    } catch (sqlErr) {
      const errorMessage =
        sqlErr instanceof Error ? sqlErr.message : String(sqlErr);

      // Record failure in migration_logs even when SQL fails
      const [log] = await db
        .insert(migrationLogs)
        .values({
          projectId: body.project_id,
          sqlQuery: rawQuery,
          status: "failed",
        })
        .returning();

      const response: MigrateResponse = {
        status: "failed",
        log_id: log.id,
        error_message: errorMessage,
      };
      return NextResponse.json(response, { status: 400 });
    }
  } catch (err) {
    console.error("[POST /api/database/migrate]", err);
    return NextResponse.json({ error: "Failed to process migration request" }, { status: 500 });
  }
}
