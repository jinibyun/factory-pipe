"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Lock, Home, ChevronLeft } from "lucide-react";
import { useWorkflow } from "@/contexts/workflow-context";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PHASES = [
  { n: 1 as const, label: "Requirements", sub: "요구사항 입력" },
  { n: 2 as const, label: "Spec Splitter", sub: "명세서 분할 · Lock" },
  { n: 3 as const, label: "Prompt Injector", sub: "프롬프트 조립" },
  { n: 4 as const, label: "Migration", sub: "DB 마이그레이션" },
];

export function PhaseNavigator({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const { getPhaseStatus, canAccessPhase } = useWorkflow();
  const [title, setTitle] = useState<string>("...");

  useEffect(() => {
    apiClient
      .getProject(projectId)
      .then((p) => setTitle(p.name))
      .catch(() => setTitle(projectId));
  }, [projectId]);

  const match = pathname.match(/\/phase\/(\d+)/);
  const currentPhase = match ? Number(match[1]) : 1;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/20 backdrop-blur-sm">
      {/* Project Header */}
      <div className="border-b border-border px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workflow
        </p>
        <p className="mt-2 truncate text-sm font-semibold text-foreground">
          {title}
        </p>
      </div>

      {/* Phase Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {PHASES.map(({ n, label, sub }) => {
          const status = getPhaseStatus(n, currentPhase);
          const href = `/project/${projectId}/phase/${n}`;
          const blocked = !canAccessPhase(n);

          const icon =
            status === "locked" || blocked ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/50">
                <Lock className="size-3.5 text-muted-foreground" />
              </span>
            ) : status === "completed" ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check className="size-4" strokeWidth={2.5} />
              </span>
            ) : status === "current" ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-foreground/10 text-xs font-bold text-foreground">
                {n}
              </span>
            ) : (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                {n}
              </span>
            );

          const content = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                status === "current" && "bg-white/5 shadow-sm",
                (status === "locked" || blocked) &&
                  "cursor-not-allowed opacity-50",
                !(status === "locked" || blocked) &&
                  status !== "current" &&
                  "hover:bg-white/5"
              )}
            >
              {icon}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight",
                    status === "current"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Phase {n}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                  {sub}
                </p>
              </div>
            </div>
          );

          if (blocked) {
            return (
              <div
                key={n}
                role="link"
                aria-disabled
                onClick={(e) => e.preventDefault()}
                title="이전 단계를 먼저 확정하세요"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={n}
              href={href}
              className="block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          모든 프로젝트
        </Link>
      </div>
    </aside>
  );
}
