"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { useWorkflow } from "@/contexts/workflow-context";
import { loadProjects } from "@/lib/projects";
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
  const [title, setTitle] = useState(projectId);

  useEffect(() => {
    const p = loadProjects().find((x) => x.id === projectId);
    if (p?.name) setTitle(p.name);
  }, [projectId]);

  const match = pathname.match(/\/phase\/(\d+)/);
  const currentPhase = match ? Number(match[1]) : 1;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/30">
      <div className="border-b border-border px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workflow
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {title}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {PHASES.map(({ n, label, sub }) => {
          const status = getPhaseStatus(n, currentPhase);
          const href = `/project/${projectId}/phase/${n}`;
          const blocked = !canAccessPhase(n);

          const icon =
            status === "locked" || blocked ? (
              <Lock className="size-4 shrink-0 text-muted-foreground" />
            ) : status === "completed" ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
            ) : status === "current" ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-semibold text-primary">
                {n}
              </span>
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
                {n}
              </span>
            );

          const content = (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                status === "current" && "bg-accent/50",
                (status === "locked" || blocked) &&
                  "cursor-not-allowed opacity-60",
                !(status === "locked" || blocked) && "hover:bg-accent/30",
              )}
            >
              {icon}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-foreground">
                  Phase {n}: {label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
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
            <Link key={n} href={href} className="block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← 모든 프로젝트
        </Link>
      </div>
    </aside>
  );
}
