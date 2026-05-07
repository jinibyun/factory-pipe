"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  GitBranch,
  Lock,
  CheckCircle,
  FileCode2,
  Wand2,
} from "lucide-react";
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

const TABS: { id: Tab; label: string; file: string }[] = [
  { id: "db", label: "01 DB", file: "01_db_schema.md" },
  { id: "api", label: "02 API", file: "02_api_routes.md" },
  { id: "ui", label: "03 UI", file: "03_frontend_ui.md" },
];

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
      const mapped: Record<Tab, DocumentRow | null> = {
        db: null,
        api: null,
        ui: null,
      };
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
      await loadDocuments();
      showMsg(`Sync 완료: ${res.commit_sha.slice(0, 8)}...`);
      void docId;
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Sync 실패");
    } finally {
      setSyncing(false);
    }
  };

  const approveLock = async () => {
    if (
      !confirm(
        "세 명세를 Final로 확정합니다. 이후 Phase 3·4에서 이 버전을 기준으로 진행합니다. 계속할까요?"
      )
    ) {
      return;
    }
    setLocking(true);
    setStatusMsg(null);
    try {
      const freshDocs = await apiClient.getDocuments(projectId);

      for (const t of ["db", "api", "ui"] as Tab[]) {
        const docType = TAB_DOC_TYPE[t];
        await apiClient.syncDocument({
          project_id: projectId,
          doc_type: docType,
          content: content[t],
          commit_message: `Final lock: ${docType}`,
        });
      }

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
      const overviewContent =
        overviewDoc.find((r) => r.question_key === "overview")?.answer_text ??
        "";
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

  return (
    <>
      <PhaseAccessGuard projectId={projectId} phase={2} />
      {!canAccessPhase(2) ? (
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
                <FileCode2 className="size-5 text-muted-foreground" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Phase 2
                  </span>
                  {locks.phase2 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle className="size-3" />
                      완료됨
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-xl font-semibold text-foreground">
                  명세서 분할 및 Lock
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              AI 생성 명세 3종을 검토·수정한 뒤 Final로 확정하세요.
            </p>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col px-8 py-6">
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
                  불러오는 중...
                </div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-border pb-3">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                        tab === t.id
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {t.label}
                      <span className="hidden text-xs opacity-60 sm:inline">
                        {t.file}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={generateWithAI}
                    disabled={splitting}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground",
                      "transition-all hover:bg-white/5",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                  >
                    <Wand2 className="size-4" />
                    {splitting ? "생성 중..." : "AI 명세 생성"}
                  </button>
                  <button
                    type="button"
                    onClick={githubSync}
                    disabled={syncing}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground",
                      "transition-all hover:bg-white/5",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                  >
                    <GitBranch className="size-4" />
                    {syncing ? "동기화 중..." : "GitHub Sync"}
                  </button>
                  <button
                    type="button"
                    onClick={approveLock}
                    disabled={locks.phase2 || locking}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background",
                      "transition-all hover:bg-foreground/90",
                      "disabled:pointer-events-none disabled:opacity-40"
                    )}
                  >
                    <Lock className="size-4" />
                    {locks.phase2
                      ? "Final 확정됨"
                      : locking
                        ? "확정 중..."
                        : "Approve & Lock to Final"}
                  </button>
                </div>

                {statusMsg && (
                  <p className="mt-3 animate-fade-in text-xs text-emerald-400">
                    {statusMsg}
                  </p>
                )}

                {/* Editor */}
                <textarea
                  value={content[tab]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setContent((prev) => ({ ...prev, [tab]: v }));
                  }}
                  rows={22}
                  className={cn(
                    "mt-4 min-h-[420px] w-full flex-1 resize-y rounded-xl border border-input bg-background/80 px-4 py-4 font-mono text-sm text-foreground",
                    "outline-none transition-all placeholder:text-muted-foreground/50",
                    "focus:border-ring focus:ring-2 focus:ring-ring/20"
                  )}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
