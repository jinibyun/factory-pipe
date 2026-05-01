"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MigrationLogRow } from "@/types";

const DEFAULT_SQL = `-- supabase or Neon / Postgres (예시)
-- create table if not exists migration_logs (
--   id uuid primary key default gen_random_uuid(),
--   message text,
--   created_at timestamptz default now()
-- );
select 1 as ready;`;

export default function Phase4Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { canAccessPhase, locks, lockPhase } = useWorkflow();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [logs, setLogs] = useState<MigrationLogRow[]>([]);
  const [executing, setExecuting] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const data = await apiClient.getMigrationLogs(projectId);
      setLogs(data);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const execute = async () => {
    if (!sql.trim()) return;
    setExecuting(true);
    try {
      await apiClient.migrate({ project_id: projectId, sql_query: sql });
      await loadLogs();
    } catch {
      await loadLogs();
    } finally {
      setExecuting(false);
    }
  };

  const formatLog = (log: MigrationLogRow) => {
    const ts = new Date(log.applied_at).toLocaleTimeString("ko-KR");
    const statusLabel = log.status === "success" ? "성공" : "실패";
    const snippet = log.sql_query.slice(0, 60).replace(/\n/g, " ");
    return `[${ts}] ${statusLabel}: ${snippet}${log.sql_query.length > 60 ? "…" : ""}`;
  };

  return (
    <>
      <PhaseAccessGuard projectId={projectId} phase={4} />
      {!canAccessPhase(4) ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          올바른 단계로 이동하는 중…
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <header className="border-b border-border px-8 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Phase 4
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              마이그레이션 모니터
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              SQL 실행·로그 확인 (Mock API — 실제 supabase or Neon 연결 전 단계)
            </p>
          </header>

          <div className="flex flex-1 flex-col gap-4 px-8 py-6">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={execute}
                disabled={executing}
                className={cn(
                  "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                  "hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {executing ? "실행 중…" : "Execute & Sync"}
              </button>
              <button
                type="button"
                disabled={locks.phase4}
                onClick={() => {
                  if (
                    confirm(
                      "마이그레이션을 완료로 표시합니다. 전체 워크플로우가 완성됩니다. 계속할까요?",
                    )
                  ) {
                    lockPhase(4);
                  }
                }}
                className={cn(
                  "rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary",
                  "hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {locks.phase4 ? "마이그레이션 완료 ✓" : "마이그레이션 완료로 표시"}
              </button>
            </div>

            <div className="flex flex-1 flex-col rounded-lg border border-border bg-muted/20">
              <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                migration_logs
              </div>
              <pre className="max-h-[280px] flex-1 overflow-auto p-3 font-mono text-xs text-foreground">
                {logs.length === 0
                  ? "로그가 여기에 표시됩니다."
                  : logs.map(formatLog).join("\n")}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
