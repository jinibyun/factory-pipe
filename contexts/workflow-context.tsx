"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PhaseLocks = {
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
};

type WorkflowContextValue = {
  projectId: string;
  locks: PhaseLocks;
  setLocks: (next: PhaseLocks) => void;
  lockPhase: (phase: 1 | 2 | 3) => void;
  canAccessPhase: (phase: 1 | 2 | 3 | 4) => boolean;
  /** Sidebar: completed | current | locked | idle (접근 가능, 아직 안 함) */
  getPhaseStatus: (
    phase: 1 | 2 | 3 | 4,
    currentPhase: number,
  ) => "completed" | "current" | "locked" | "idle";
};

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function storageKey(projectId: string) {
  return `factory-pipe-workflow-${projectId}`;
}

function loadLocks(projectId: string): PhaseLocks {
  if (typeof window === "undefined") {
    return { phase1: false, phase2: false, phase3: false };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return { phase1: false, phase2: false, phase3: false };
    const p = JSON.parse(raw) as Partial<PhaseLocks>;
    return {
      phase1: Boolean(p.phase1),
      phase2: Boolean(p.phase2),
      phase3: Boolean(p.phase3),
    };
  } catch {
    return { phase1: false, phase2: false, phase3: false };
  }
}

export function WorkflowProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const [locks, setLocksState] = useState<PhaseLocks>(() =>
    loadLocks(projectId),
  );

  useEffect(() => {
    setLocksState(loadLocks(projectId));
  }, [projectId]);

  const setLocks = useCallback((next: PhaseLocks) => {
    setLocksState(next);
    try {
      localStorage.setItem(storageKey(projectId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [projectId]);

  const lockPhase = useCallback(
    (phase: 1 | 2 | 3) => {
      setLocksState((prev) => {
        const next: PhaseLocks = {
          ...prev,
          ...(phase === 1 ? { phase1: true } : {}),
          ...(phase === 2 ? { phase2: true } : {}),
          ...(phase === 3 ? { phase3: true } : {}),
        };
        try {
          localStorage.setItem(storageKey(projectId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [projectId],
  );

  const canAccessPhase = useCallback(
    (phase: 1 | 2 | 3 | 4) => {
      if (phase === 1) return true;
      if (phase === 2) return locks.phase1;
      if (phase === 3) return locks.phase2;
      return locks.phase3;
    },
    [locks],
  );

  const getPhaseStatus = useCallback(
    (phase: 1 | 2 | 3 | 4, currentPhase: number) => {
      if (phase === 2 && !locks.phase1) return "locked";
      if (phase === 3 && !locks.phase2) return "locked";
      if (phase === 4 && !locks.phase3) return "locked";
      if (phase === currentPhase) return "current";
      const done =
        phase === 1
          ? locks.phase1
          : phase === 2
            ? locks.phase2
            : phase === 3
              ? locks.phase3
              : false;
      if (done) return "completed";
      return "idle";
    },
    [locks],
  );

  const value = useMemo(
    () => ({
      projectId,
      locks,
      setLocks,
      lockPhase,
      canAccessPhase,
      getPhaseStatus,
    }),
    [projectId, locks, setLocks, lockPhase, canAccessPhase, getPhaseStatus],
  );

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return ctx;
}
