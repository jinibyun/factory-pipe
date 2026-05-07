"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Play,
  CheckCircle,
  Database,
  Terminal,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MigrationLogRow } from "@/types";

const DEFAULT_SQL = `-- Supabase or Neon / Postgres (예시)
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
    return { ts, statusLabel, snippet, status: log.status, full: log.sql_query };
  };

  return (
    <>
      <PhaseAccessGuard projectId={projectId} phase={4} />
      {!canAccessPhase(4) ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
            올바른 단계로 이동하는 중...
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="border-b border-border bg-card/30 px-8 py-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Database className="size-5 text-muted-foreground" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Phase 4
                  </span>
                  {locks.phase4 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle className="size-3" />
                      완료됨
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-xl font-semibold text-foreground">
                  마이그레이션 모니터
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              SQL 실행·로그 확인 (Mock API — 실제 Supabase or Neon 연결 전 단계)
            </p>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-6 px-8 py-6">
            {/* SQL Editor */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  SQL Editor
                </span>
              </div>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                rows={12}
                className={cn(
                  "w-full resize-y rounded-xl border border-input bg-background/80 px-4 py-4 font-mono text-sm text-foreground",
                  "outline-none transition-all placeholder:text-muted-foreground/50",
                  "focus:border-ring focus:ring-2 focus:ring-ring/20"
                )}
                spellCheck={false}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={execute}
                disabled={executing}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background",
                  "transition-all hover:bg-foreground/90",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                <Play className="size-4" />
                {executing ? "실행 중..." : "Execute & Sync"}
              </button>
              <button
                type="button"
                disabled={locks.phase4}
                onClick={() => {
                  if (
                    confirm(
                      "마이그레이션을 완료로 표시합니다. 전체 워크플로우가 완성됩니다. 계속할까요?"
                    )
                  ) {
                    lockPhase(4);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 px-4 py-2.5 text-sm font-medium text-emerald-400",
                  "transition-all hover:bg-emerald-500/10",
                  "disabled:pointer-events-none disabled:opacity-40"
                )}
              >
                <CheckCircle2 className="size-4" />
                {locks.phase4 ? "마이그레이션 완료 ✓" : "마이그레이션 완료로 표시"}
              </button>
            </div>

            {/* Logs Panel */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card/30">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  migration_logs
                </span>
                <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {logs.length}개 로그
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {logs.length === 0 ? (
                  <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground/60">
                    로그가 여기에 표시됩니다.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {logs.map((log, idx) => {
                      const { ts, statusLabel, snippet, status } = formatLog(log);
                      return (
                        <li
                          key={idx}
                          className="flex items-start gap-3 rounded-lg bg-white/[0.02] p-3 font-mono text-xs"
                        >
                          {status === "success" ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                          ) : (
                            <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">[{ts}]</span>
                              <span
                                className={
                                  status === "success"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-foreground/80">
                              {snippet}
                              {log.sql_query.length > 60 && "..."}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
