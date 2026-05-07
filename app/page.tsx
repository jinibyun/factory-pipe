"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FolderKanban,
  LogOut,
  Plus,
  Sparkles,
  Calendar,
  ChevronRight,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import type { ProjectRow } from "@/types";

type AuthUser = { userId: string; email: string };

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [overviewDraft, setOverviewDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "프로젝트 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d))
      .catch(() => {});
  }, [refresh]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const project = await apiClient.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        overview_draft: overviewDraft.trim() || undefined,
      });
      setName("");
      setDescription("");
      setOverviewDraft("");
      setModalOpen(false);
      window.location.href = `/project/${project.id}/phase/1`;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "프로젝트 생성에 실패했습니다."
      );
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-gradient"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-pattern" />

      {/* Header */}
      <header className="relative border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-lg">
              <Sparkles className="size-4 text-foreground" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Factory Pipe
              </p>
              <p className="text-[11px] text-muted-foreground">
                Spec &rarr; Prompt &rarr; Migration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="hidden rounded-full bg-white/5 px-3 py-1.5 text-xs text-muted-foreground sm:block">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="로그아웃"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground",
                    "transition-all hover:border-white/20 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background",
                "shadow-sm transition-all hover:bg-foreground/90 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <Plus className="size-4" />
              New Project
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              프로젝트
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              워크플로 단계별로 명세를 확정하고, 프롬프트 조립과 DB 마이그레이션까지
              한 흐름으로 진행합니다.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 animate-fade-in rounded-lg bg-destructive/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-10">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-20 text-center backdrop-blur-sm">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <FolderKanban className="size-8 text-muted-foreground" />
              </div>
              <p className="mt-6 text-base font-medium text-foreground">
                아직 프로젝트가 없습니다
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                New Project로 시작하면 Phase 1부터 순서대로 진행할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:bg-foreground/90"
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
                    className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-card/60 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                          <FileText className="size-4 text-muted-foreground" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                            {p.name}
                          </p>
                          {p.description ? (
                            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                              {p.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-sm text-muted-foreground/50">
                              설명 없음
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      {new Date(p.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="new-project-title"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="animate-fade-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="new-project-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  새 프로젝트
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  이름과 개요를 넣으면 워크플로가 시작됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 animate-fade-in rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleCreate}>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  프로젝트명 <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "mt-1.5 w-full rounded-lg border border-input bg-background/80 px-3 py-2.5 text-sm text-foreground",
                    "outline-none transition-all placeholder:text-muted-foreground/50",
                    "focus:border-ring focus:ring-2 focus:ring-ring/20"
                  )}
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
                  className={cn(
                    "mt-1.5 w-full rounded-lg border border-input bg-background/80 px-3 py-2.5 text-sm text-foreground",
                    "outline-none transition-all placeholder:text-muted-foreground/50",
                    "focus:border-ring focus:ring-2 focus:ring-ring/20"
                  )}
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
                  className={cn(
                    "mt-1.5 w-full resize-y rounded-lg border border-input bg-background/80 px-3 py-2.5 font-mono text-xs leading-relaxed text-foreground",
                    "outline-none transition-all placeholder:text-muted-foreground/50",
                    "focus:border-ring focus:ring-2 focus:ring-ring/20"
                  )}
                  placeholder={"# Overview\n..."}
                  spellCheck={false}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={cn(
                    "rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background",
                    "transition-all hover:bg-foreground/90",
                    "disabled:pointer-events-none disabled:opacity-50"
                  )}
                >
                  {creating ? "생성 중..." : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
