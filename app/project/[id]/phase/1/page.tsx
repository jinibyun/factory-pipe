"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useWorkflow } from "@/contexts/workflow-context";
import { loadProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

const REQ_KEY = (id: string) => `factory-pipe-requirements-${id}`;

export default function Phase1Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { locks, lockPhase } = useWorkflow();
  const [body, setBody] = useState("");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const projects = loadProjects();
    const p = projects.find((x) => x.id === projectId);
    setProjectName(p?.name ?? projectId);
    try {
      const saved = localStorage.getItem(REQ_KEY(projectId));
      if (saved) setBody(saved);
      else if (p?.overviewDraft) setBody(p.overviewDraft);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  const save = useCallback(() => {
    try {
      localStorage.setItem(REQ_KEY(projectId), body);
    } catch {
      /* ignore */
    }
  }, [projectId, body]);

  const finalize = () => {
    save();
    if (
      !confirm(
        "Phase 1을 확정하면 요구사항 단계가 완료됩니다. 계속할까요?",
      )
    ) {
      return;
    }
    lockPhase(1);
  };

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
          onBlur={save}
          rows={18}
          className="min-h-[320px] w-full flex-1 resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="# Requirements&#10;..."
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            className={cn(
              "rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground",
              "hover:bg-accent/40",
            )}
          >
            저장
          </button>
          <button
            type="button"
            onClick={finalize}
            disabled={locks.phase1}
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
