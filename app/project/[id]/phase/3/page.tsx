"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhaseAccessGuard } from "@/components/phase-access-guard";
import { useWorkflow } from "@/contexts/workflow-context";
import { DEFAULT_SPECS } from "@/lib/spec-defaults";
import { cn } from "@/lib/utils";

type Target = "cursor" | "v0";

const SPEC_KEY = (id: string, name: "db" | "api" | "ui") =>
  `factory-pipe-spec-${id}-${name}`;

function loadFinalSpecs(projectId: string) {
  try {
    return {
      db:
        localStorage.getItem(SPEC_KEY(projectId, "db")) ?? DEFAULT_SPECS.db,
      api:
        localStorage.getItem(SPEC_KEY(projectId, "api")) ?? DEFAULT_SPECS.api,
      ui:
        localStorage.getItem(SPEC_KEY(projectId, "ui")) ?? DEFAULT_SPECS.ui,
    };
  } catch {
    return { ...DEFAULT_SPECS };
  }
}

function assemblePrompt(target: Target, specs: ReturnType<typeof loadFinalSpecs>) {
  const header =
    target === "cursor"
      ? "# Cursor — 구현 프롬프트 (Final 명세 기반)\n\n다음 명세를 준수해 코드를 작성하세요.\n"
      : "# v0 — UI 프롬프트 (Final 명세 기반)\n\n다음 명세를 반영한 화면을 생성하세요.\n";

  return [
    header,
    "\n## 01 DB\n",
    specs.db,
    "\n\n## 02 API\n",
    specs.api,
    "\n\n## 03 UI\n",
    specs.ui,
    target === "cursor"
      ? "\n\n---\n스택: Next.js App Router, TypeScript, Tailwind. API는 Route Handlers.\n"
      : "\n\n---\n스택: Next.js, Tailwind, shadcn/ui 스타일.\n",
  ].join("");
}

export default function Phase3Page() {
  const params = useParams();
  const projectId = params.id as string;
  const { canAccessPhase } = useWorkflow();
  const [target, setTarget] = useState<Target>("cursor");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    setText(assemblePrompt(target, loadFinalSpecs(projectId)));
  }, [target, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/30"
              >
                {copied ? "복사됨" : "Copy to Clipboard"}
              </button>
            </div>

            <textarea
              readOnly
              value={text}
              rows={24}
              className="min-h-[420px] w-full flex-1 resize-y rounded-lg border border-input bg-muted/30 px-4 py-3 font-mono text-xs text-foreground"
            />
          </div>
        </div>
      )}
    </>
  );
}
