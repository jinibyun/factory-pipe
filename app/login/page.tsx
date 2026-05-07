"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background effects */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-gradient"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-pattern"
      />

      {/* Logo */}
      <div className="relative mb-8 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-lg">
          <Sparkles className="size-5 text-foreground" />
        </span>
        <div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Factory Pipe
          </span>
          <p className="text-xs text-muted-foreground">
            Spec-driven workflow
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm animate-fade-in rounded-2xl border border-white/10 bg-card/50 p-8 shadow-2xl backdrop-blur-sm">
        <h1 className="mb-2 text-center text-2xl font-semibold text-foreground">
          로그인
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          계정에 로그인하여 워크플로를 시작하세요
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-muted-foreground"
            >
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground",
                  "placeholder:text-muted-foreground/50",
                  "transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-muted-foreground"
            >
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm text-foreground",
                  "placeholder:text-muted-foreground/50",
                  "transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                )}
              />
            </div>
          </div>

          {error && (
            <div className="animate-fade-in rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "mt-2 flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background",
              "transition-all hover:bg-foreground/90",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {loading ? (
              "로그인 중..."
            ) : (
              <>
                로그인
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="relative mt-8 text-center text-xs text-muted-foreground/60">
        Spec-driven AI workflow for modern development
      </p>
    </div>
  );
}
