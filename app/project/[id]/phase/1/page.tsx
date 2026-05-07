"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Save, CheckCircle, FileText, Sparkles } from "lucide-react";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function Phase1Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { locks, lockPhase } = useWorkflow();
  const [body, setBody] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [project, reqs] = await Promise.all([
          apiClient.getProject(projectId),
          apiClient.getRequirements(projectId),
        ]);
        if (cancelled) return;
        setProjectName(project.name);
        const overview = reqs.find((r) => r.question_key === "overview");
        if (overview) {
          setBody(overview.answer_text);
        }
      } catch {
        // Project may not exist in mock store yet (page refresh after server restart)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const save = useCallback(async () => {
    if (!body.trim()) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await apiClient.upsertRequirement(projectId, {
        question_key: "overview",
        answer_text: body,
      });
      setStatusMsg("저장됨");
      setTimeout(() => setStatusMsg(null), 2000);
    } catch {
      setStatusMsg("저장 실패");
    } finally {
      setSaving(false);
    }
  }, [projectId, body]);

  const finalize = async () => {
    if (
      !confirm("Phase 1을 확정하면 요구사항 단계가 완료됩니다. 계속할까요?")
    ) {
      return;
    }
    await save();
    lockPhase(1);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/30 px-8 py-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <FileText className="size-5 text-muted-foreground" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Phase 1
              </span>
              {locks.phase1 && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle className="size-3" />
                  완료됨
                </span>
              )}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              요구사항 입력
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {projectName} — 프로젝트 요구사항과 개요를 정리합니다. 저장 후 Phase 2로
          진행할 수 있습니다.
        </p>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            프로젝트 요구사항을 자유롭게 작성하세요. Markdown 형식을 권장합니다.
          </p>
          {statusMsg && (
            <span className="animate-fade-in text-xs text-emerald-400">
              {statusMsg}
            </span>
          )}
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          className={cn(
            "min-h-[360px] w-full flex-1 resize-y rounded-xl border border-input bg-background/80 px-4 py-4 font-mono text-sm text-foreground",
            "outline-none transition-all placeholder:text-muted-foreground/50",
            "focus:border-ring focus:ring-2 focus:ring-ring/20"
          )}
          placeholder={"# Requirements\n\n프로젝트 요구사항을 작성하세요..."}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground",
              "transition-all hover:bg-white/5",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <Save className="size-4" />
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={finalize}
            disabled={locks.phase1 || saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background",
              "transition-all hover:bg-foreground/90",
              "disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            <Sparkles className="size-4" />
            {locks.phase1 ? "Phase 1 확정됨" : "Phase 1 확정 (Final)"}
          </button>
        </div>
      </div>
    </div>
  );
}
