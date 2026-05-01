"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Target = "cursor" | "v0";

export default function Phase3Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { canAccessPhase, locks, lockPhase } = useWorkflow();
  const [target, setTarget] = useState<Target>("cursor");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assemble = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.assemblePrompt({
        project_id: projectId,
        target_phase: target === "cursor" ? "step3_ui_generation_cursor" : "step3_ui_generation_v0",
      });
      setText(res.assembled_prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "프롬프트 생성 실패");
    } finally {
      setLoading(false);
    }
  }, [projectId, target]);

  useEffect(() => {
    assemble();
  }, [assemble]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <PhaseAccessGuard projectId={projectId} phase={3} />
      {!canAccessPhase(3) ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          올바른 단계로 이동하는 중…
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <header className="border-b border-border px-8 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Phase 3
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              프롬프트 인젝터
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Final 명세(Phase 2 저장본)를 한 덩어리 프롬프트로 조립합니다.
            </p>
          </header>

          <div className="flex flex-1 flex-col gap-4 px-8 py-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTarget("cursor")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium",
                  target === "cursor"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent/30",
                )}
              >
                Cursor용
              </button>
              <button
                type="button"
                onClick={() => setTarget("v0")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium",
                  target === "v0"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent/30",
                )}
              >
                v0용
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copy}
                disabled={loading || !text}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/30 disabled:opacity-50"
              >
                {copied ? "복사됨" : "Copy to Clipboard"}
              </button>
              <button
                type="button"
                disabled={locks.phase3}
                onClick={() => {
                  if (
                    confirm(
                      "프롬프트를 복사하고 외부 도구에 적용했나요? Phase 4(Migration)를 잠금 해제합니다.",
                    )
                  ) {
                    lockPhase(3);
                  }
                }}
                className={cn(
                  "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
                  "hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {locks.phase3 ? "Phase 4 잠금 해제됨 ✓" : "완료 → Phase 4 잠금 해제"}
              </button>
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            {loading ? (
              <p className="text-sm text-muted-foreground">프롬프트 조립 중…</p>
            ) : (
              <textarea
                readOnly
                value={text}
                rows={24}
                className="min-h-[420px] w-full flex-1 resize-y rounded-lg border border-input bg-muted/30 px-4 py-3 font-mono text-xs text-foreground"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
