"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
    return () => { cancelled = true; };
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
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border px-8 py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phase 1
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          요구사항 입력
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{projectName}</p>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-8 py-6">
        <p className="text-sm text-muted-foreground">
          프로젝트 요구사항과 개요를 정리합니다. 저장 후 Phase 2로 진행할 수
          있습니다.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          className="min-h-[320px] w-full flex-1 resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="# Requirements&#10;..."
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cn(
              "rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground",
              "hover:bg-accent/40 disabled:opacity-50",
            )}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          {statusMsg ? (
            <span className="text-xs text-muted-foreground">{statusMsg}</span>
          ) : null}
          <button
            type="button"
            onClick={finalize}
            disabled={locks.phase1 || saving}
            className={cn(
              "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            {locks.phase1 ? "Phase 1 확정됨" : "Phase 1 확정 (Final)"}
          </button>
        </div>
      </div>
    </div>
  );
}
