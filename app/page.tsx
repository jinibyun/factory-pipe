"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addProject,
  loadProjects,
  type Project,
} from "@/lib/projects";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [overviewDraft, setOverviewDraft] = useState("");

  const refresh = useCallback(() => {
    setProjects(loadProjects());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}`;
    addProject({
      id,
      name: name.trim(),
      description: description.trim(),
      overviewDraft: overviewDraft.trim(),
    });
    setName("");
    setDescription("");
    setOverviewDraft("");
    setModalOpen(false);
    refresh();
    window.location.href = `/project/${id}/phase/1`;
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.18),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(0_0%_100%_/_0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%_/_0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
      />

      <header className="relative border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Sparkles className="size-4 text-foreground" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Factory Pipe
              </p>
              <p className="text-[11px] text-muted-foreground">
                Spec → Prompt → Migration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background",
              "shadow-sm transition hover:bg-foreground/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            <Plus className="size-4" />
            New Project
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              프로젝트
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              워크플로 단계별로 명세를 확정하고, 프롬프트 조립과 DB 마이그레이션까지
              한 흐름으로 진행합니다.
            </p>
          </div>
        </div>

        <div className="mt-10">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-card/40 px-6 py-20 text-center backdrop-blur-sm">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <FolderKanban className="size-7 text-muted-foreground" />
              </div>
              <p className="mt-6 text-sm font-medium text-foreground">
                아직 프로젝트가 없습니다
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                New Project로 시작하면 Phase 1부터 순서대로 진행할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
              >
                <Plus className="size-4" />
                프로젝트 만들기
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/project/${p.id}/phase/1`}
                    className="group block rounded-2xl border border-white/10 bg-card/50 p-5 shadow-sm ring-1 ring-white/5 transition hover:border-white/20 hover:bg-card/80"
                  >
                    <p className="font-medium text-foreground group-hover:text-primary">
                      {p.name}
                    </p>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        설명 없음
                      </p>
                    )}
                    <p className="mt-4 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="new-project-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="new-project-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              새 프로젝트
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              이름과 개요를 넣으면 워크플로가 시작됩니다.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  프로젝트명
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="예: factory-pipe"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  설명
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder="한 줄 설명"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  00_overview.md 초안
                </label>
                <textarea
                  value={overviewDraft}
                  onChange={(e) => setOverviewDraft(e.target.value)}
                  rows={10}
                  className="mt-1.5 w-full resize-y rounded-lg border border-input bg-background/80 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
                  placeholder={"# Overview\n..."}
                  spellCheck={false}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:bg-accent/40"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
