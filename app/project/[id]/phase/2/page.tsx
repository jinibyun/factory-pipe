"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import { cn } from "@/lib/utils";
import type { DocumentRow } from "@/types";

type Tab = "db" | "api" | "ui";

const TAB_DOC_TYPE: Record<Tab, DocumentRow["doc_type"]> = {
  db: "01_db_schema",
  api: "02_api_routes",
  ui: "03_frontend_ui",
};

export default function Phase2Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { locks, lockPhase, canAccessPhase } = useWorkflow();
  const [tab, setTab] = useState<Tab>("db");
  const [docs, setDocs] = useState<Record<Tab, DocumentRow | null>>({
    db: null,
    api: null,
    ui: null,
  });
  const [content, setContent] = useState<Record<Tab, string>>({
    db: DEFAULT_SPECS.db,
    api: DEFAULT_SPECS.api,
    ui: DEFAULT_SPECS.ui,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [locking, setLocking] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const showMsg = (msg: string, ms = 4000) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), ms);
  };

  const loadDocuments = useCallback(async () => {
    try {
      const rawDocs = await apiClient.getDocuments(projectId);
      const mapped: Record<Tab, DocumentRow | null> = { db: null, api: null, ui: null };
      const texts: Record<Tab, string> = {
        db: DEFAULT_SPECS.db,
        api: DEFAULT_SPECS.api,
        ui: DEFAULT_SPECS.ui,
      };
      for (const t of ["db", "api", "ui"] as Tab[]) {
        const match = rawDocs.find((d) => d.doc_type === TAB_DOC_TYPE[t]);
        if (match) {
          mapped[t] = match;
          texts[t] = match.content;
        }
      }
      setDocs(mapped);
      setContent(texts);
    } catch {
      // Keep defaults if API call fails
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const githubSync = async () => {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const docId = docs[tab];
      const res = await apiClient.syncDocument({
        project_id: projectId,
        doc_type: TAB_DOC_TYPE[tab],
        content: content[tab],
        commit_message: `Update ${TAB_DOC_TYPE[tab]}`,
      });
      // Update the local doc id if we got a new record back via re-fetch
      await loadDocuments();
      showMsg(`GitHub Sync: commit ${res.commit_sha.slice(0, 10)}… 완료`);
      void docId; // suppress unused warning
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Sync 실패");
    } finally {
      setSyncing(false);
    }
  };

  const approveLock = async () => {
    if (
      !confirm(
        "세 명세를 Final로 확정합니다. 이후 Phase 3·4에서 이 버전을 기준으로 진행합니다. 계속할까요?",
      )
    ) {
      return;
    }
    setLocking(true);
    setStatusMsg(null);
    try {
      // Sync all three tabs first, then lock each document
      const freshDocs = await apiClient.getDocuments(projectId);

      for (const t of ["db", "api", "ui"] as Tab[]) {
        const docType = TAB_DOC_TYPE[t];
        // Sync current content
        await apiClient.syncDocument({
          project_id: projectId,
          doc_type: docType,
          content: content[t],
          commit_message: `Final lock: ${docType}`,
        });
      }

      // Re-fetch to get the updated document IDs, then lock
      const updatedDocs = await apiClient.getDocuments(projectId);
      for (const t of ["db", "api", "ui"] as Tab[]) {
        const doc = updatedDocs.find((d) => d.doc_type === TAB_DOC_TYPE[t]);
        if (doc) {
          await apiClient.lockDocument({ document_id: doc.id, status: "Final" });
        }
      }

      void freshDocs;
      lockPhase(2);
      showMsg("세 명세가 Final로 확정되었습니다.");
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Lock 실패");
    } finally {
      setLocking(false);
    }
  };

  const generateWithAI = async () => {
    setSplitting(true);
    setStatusMsg(null);
    try {
      const overviewDoc = await apiClient.getRequirements(projectId);
      const overviewContent = overviewDoc.find((r) => r.question_key === "overview")?.answer_text ?? "";
      const res = await apiClient.splitSpec({
        project_id: projectId,
        overview_content: overviewContent,
      });
      setContent({
        db: res["01_db_schema"],
        api: res["02_api_routes"],
        ui: res["03_frontend_ui"],
      });
      showMsg("AI 명세 생성 완료 (검토 후 저장/확정하세요)");
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "AI 생성 실패");
    } finally {
      setSplitting(false);
    }
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
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중…</p>
            ) : (
              <>
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
                    onClick={generateWithAI}
                    disabled={splitting}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/30 disabled:opacity-50"
                  >
                    {splitting ? "생성 중…" : "AI 명세 생성"}
                  </button>
                  <button
                    type="button"
                    onClick={githubSync}
                    disabled={syncing}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/30 disabled:opacity-50"
                  >
                    {syncing ? "동기화 중…" : "GitHub Sync"}
                  </button>
                  <button
                    type="button"
                    onClick={approveLock}
                    disabled={locks.phase2 || locking}
                    className={cn(
                      "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
                      "hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    {locks.phase2
                      ? "Final 확정됨"
                      : locking
                        ? "확정 중…"
                        : "Approve & Lock to Final"}
                  </button>
                </div>

                {statusMsg ? (
                  <p className="mt-2 text-xs text-muted-foreground">{statusMsg}</p>
                ) : null}

                <textarea
                  value={content[tab]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setContent((prev) => ({ ...prev, [tab]: v }));
                  }}
                  rows={22}
                  className="mt-4 min-h-[400px] w-full flex-1 resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
