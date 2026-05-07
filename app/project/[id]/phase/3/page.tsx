"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Check,
  CheckCircle,
  Unlock,
  Zap,
  Monitor,
  Sparkles,
} from "lucide-react";
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
        target_phase:
          target === "cursor"
            ? "step3_ui_generation_cursor"
            : "step3_ui_generation_v0",
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
                <Zap className="size-5 text-muted-foreground" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Phase 3
                  </span>
                  {locks.phase3 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <CheckCircle className="size-3" />
                      완료됨
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-xl font-semibold text-foreground">
                  프롬프트 인젝터
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Final 명세(Phase 2 저장본)를 한 덩어리 프롬프트로 조립합니다.
            </p>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-4 px-8 py-6">
            {/* Target Toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card/30 p-1">
              <button
                type="button"
                onClick={() => setTarget("cursor")}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  target === "cursor"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="size-4" />
                Cursor용
              </button>
              <button
                type="button"
                onClick={() => setTarget("v0")}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
                  target === "v0"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="size-4" />
                v0용
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copy}
                disabled={loading || !text}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground",
                  "transition-all hover:bg-white/5",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-400" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={locks.phase3}
                onClick={() => {
                  if (
                    confirm(
                      "프롬프트를 복사하고 외부 도구에 적용했나요? Phase 4(Migration)를 잠금 해제합니다."
                    )
                  ) {
                    lockPhase(3);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background",
                  "transition-all hover:bg-foreground/90",
                  "disabled:pointer-events-none disabled:opacity-40"
                )}
              >
                <Unlock className="size-4" />
                {locks.phase3 ? "Phase 4 잠금 해제됨 ✓" : "완료 → Phase 4 잠금 해제"}
              </button>
            </div>

            {error && (
              <div className="animate-fade-in rounded-lg bg-destructive/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Output */}
            {loading ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-input bg-muted/20">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
                  프롬프트 조립 중...
                </div>
              </div>
            ) : (
              <div className="relative flex-1">
                <textarea
                  readOnly
                  value={text}
                  rows={24}
                  className={cn(
                    "min-h-[460px] w-full resize-y rounded-xl border border-input bg-muted/20 px-4 py-4 font-mono text-xs leading-relaxed text-foreground",
                    "outline-none"
                  )}
                />
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-muted-foreground">
                    읽기 전용
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
