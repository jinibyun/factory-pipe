"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import { cn } from "@/lib/utils";

type Tab = "db" | "api" | "ui";

const SPEC_KEY = (id: string, tab: Tab) => `factory-pipe-spec-${id}-${tab}`;

export default function Phase2Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { locks, lockPhase, canAccessPhase } = useWorkflow();
  const [tab, setTab] = useState<Tab>("db");
  const [db, setDb] = useState("");
  const [api, setApi] = useState("");
  const [ui, setUi] = useState("");
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    try {
      setDb(
        localStorage.getItem(SPEC_KEY(projectId, "db")) ?? DEFAULT_SPECS.db,
      );
      setApi(
        localStorage.getItem(SPEC_KEY(projectId, "api")) ?? DEFAULT_SPECS.api,
      );
      setUi(
        localStorage.getItem(SPEC_KEY(projectId, "ui")) ?? DEFAULT_SPECS.ui,
      );
    } catch {
      setDb(DEFAULT_SPECS.db);
      setApi(DEFAULT_SPECS.api);
      setUi(DEFAULT_SPECS.ui);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = (t: Tab, value: string) => {
    try {
      localStorage.setItem(SPEC_KEY(projectId, t), value);
    } catch {
      /* ignore */
    }
  };

  const current = tab === "db" ? db : tab === "api" ? api : ui;
  const setCurrent =
    tab === "db" ? setDb : tab === "api" ? setApi : setUi;

  const githubSync = () => {
    persist(tab, current);
    setSyncMsg(`GitHub Sync: ${tab} 스냅샷을 커밋 대기열에 넣었습니다 (데모).`);
    setTimeout(() => setSyncMsg(null), 4000);
  };

  const approveLock = () => {
    if (
      !confirm(
        "세 명세를 Final로 확정합니다. 이후 Phase 3·4에서 이 버전을 기준으로 진행합니다. 계속할까요?",
      )
    ) {
      return;
    }
    persist("db", db);
    persist("api", api);
    persist("ui", ui);
    lockPhase(2);
  };

  const tabs: { id: Tab; label: string; file: string }[] = [
    { id: "db", label: "01 DB", file: "01_db_schema.md" },
    { id: "api", label: "02 API", file: "02_api_routes.md" },
    { id: "ui", label: "03 UI", file: "03_frontend_ui.md" },
  ];

  return (
    <>
      <PhaseAccessGuard projectId={projectId} phase={2} />
      {!canAccessPhase(2) ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          올바른 단계로 이동하는 중…
        </div>
      ) : (
      <div className="flex flex-1 flex-col">
        <header className="border-b border-border px-8 py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase 2
          </p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">
            명세서 분할 및 Lock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI 생성 명세 3종을 검토·수정한 뒤 Final로 확정하세요.
          </p>
        </header>

        <div className="flex flex-1 flex-col px-8 py-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
              >
                {t.label}
                <span className="ml-1.5 text-xs opacity-70">{t.file}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={githubSync}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/30"
            >
              GitHub Sync
            </button>
            <button
              type="button"
              onClick={approveLock}
              disabled={locks.phase2}
              className={cn(
                "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              {locks.phase2
                ? "Final 확정됨"
                : "Approve & Lock to Final"}
            </button>
          </div>
          {syncMsg ? (
            <p className="mt-2 text-xs text-muted-foreground">{syncMsg}</p>
          ) : null}

          <textarea
            value={current}
            onChange={(e) => {
              const v = e.target.value;
              setCurrent(v);
            }}
            onBlur={() =>
              persist(
                tab,
                tab === "db" ? db : tab === "api" ? api : ui,
              )
            }
            rows={22}
            className="mt-4 min-h-[400px] w-full flex-1 resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      )}
    </>
  );
}
