"use client";

import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { cn } from "@/lib/utils";

const DEFAULT_SQL = `-- Supabase / Postgres (예시)
-- create table if not exists migration_logs (
--   id uuid primary key default gen_random_uuid(),
--   message text,
--   created_at timestamptz default now()
-- );
select 1 as ready;`;

export default function Phase4Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { canAccessPhase } = useWorkflow();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString("ko-KR")}] ${line}`,
    ]);
  }, []);

  const execute = () => {
    appendLog("migration_logs: Execute & Sync 요청 (데모)");
    const trimmed = sql.trim();
    if (!trimmed) {
      appendLog("실패: 빈 쿼리");
      return;
    }
    if (trimmed.toLowerCase().startsWith("select")) {
      appendLog("성공: 읽기 쿼리 시뮬레이션 완료");
      appendLog("스키마 파일 동기화 플래그 설정됨 (로컬 데모)");
    } else {
      appendLog("성공: DDL 적용 시뮬레이션 (실제 DB 미연결)");
    }
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
              SQL 실행·로그 확인 (실제 Supabase 연결 전 데모 UI)
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
            <button
              type="button"
              onClick={execute}
              className={cn(
                "w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90",
              )}
            >
              Execute & Sync
            </button>

            <div className="flex flex-1 flex-col rounded-lg border border-border bg-muted/20">
              <div className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                migration_logs
              </div>
              <pre className="max-h-[280px] flex-1 overflow-auto p-3 font-mono text-xs text-foreground">
                {logs.length === 0
                  ? "로그가 여기에 표시됩니다."
                  : logs.join("\n")}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
