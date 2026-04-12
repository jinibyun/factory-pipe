import { NextResponse } from "next/server";
import { addMigrationLog } from "@/lib/mock-store";
import type { MigrateRequest, MigrateResponse } from "@/types";

// TODO: supabase or Neon Auth 검증 + 실제 supabase or Neon SQL 실행
async function delay() {
  await new Promise((r) => setTimeout(r, 700));
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as MigrateRequest;
  if (!body.project_id || !body.sql_query?.trim()) {
    return NextResponse.json({ error: "project_id and sql_query are required" }, { status: 400 });
  }

  // Simulate a syntax error for obviously broken queries
  const sql = body.sql_query.trim();
  const hasSyntaxError = sql.toLowerCase().startsWith("invalid");

  if (hasSyntaxError) {
    const log = addMigrationLog(body.project_id, sql, "failed");
    const response: MigrateResponse = {
      status: "failed",
      log_id: log.id,
      error_message: "Mock syntax error: query starts with 'invalid'",
    };
    return NextResponse.json(response, { status: 400 });
  }

  const log = addMigrationLog(body.project_id, sql, "success");
  const response: MigrateResponse = {
    status: "success",
    log_id: log.id,
  };
  return NextResponse.json(response);
}
