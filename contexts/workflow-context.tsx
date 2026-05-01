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
import { apiClient } from "@/lib/api-client";

export type PhaseLocks = {
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  phase4: boolean;
};

type WorkflowContextValue = {
  projectId: string;
  locks: PhaseLocks;
  setLocks: (next: PhaseLocks) => void;
  lockPhase: (phase: 1 | 2 | 3 | 4) => void;
  canAccessPhase: (phase: 1 | 2 | 3 | 4) => boolean;
  /** Sidebar: completed | current | locked | idle */
  getPhaseStatus: (
    phase: 1 | 2 | 3 | 4,
    currentPhase: number,
  ) => "completed" | "current" | "locked" | "idle";
};

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function lsKey(projectId: string) {
  return `factory-pipe-workflow-${projectId}`;
}

function loadLocksFromStorage(projectId: string): PhaseLocks {
  if (typeof window === "undefined") {
    return { phase1: false, phase2: false, phase3: false, phase4: false };
  }
  try {
    const raw = localStorage.getItem(lsKey(projectId));
    if (!raw) return { phase1: false, phase2: false, phase3: false, phase4: false };
    const p = JSON.parse(raw) as Partial<PhaseLocks>;
    return {
      phase1: Boolean(p.phase1),
      phase2: Boolean(p.phase2),
      phase3: Boolean(p.phase3),
      phase4: Boolean(p.phase4),
    };
  } catch {
    return { phase1: false, phase2: false, phase3: false, phase4: false };
  }
}

function saveLocksToStorage(projectId: string, locks: PhaseLocks) {
  try {
    localStorage.setItem(lsKey(projectId), JSON.stringify(locks));
  } catch {
    /* ignore */
  }
}

/** Derive PhaseLocks from the status of the three spec documents. */
function deriveLocks(documents: { doc_type: string; status: string }[]): PhaseLocks {
  const isFinal = (type: string) =>
    documents.find((d) => d.doc_type === type)?.status === "Final";

  // Phase 1 locked = requirements saved (we check for 00_overview or just use requirements endpoint result)
  // For now: phase2 lock comes from all 3 spec docs being Final.
  const specsFinal =
    isFinal("01_db_schema") &&
    isFinal("02_api_routes") &&
    isFinal("03_frontend_ui");

  return {
    phase1: specsFinal ? true : false,
    phase2: specsFinal,
    phase3: false,
    phase4: false,
  };
}

export function WorkflowProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  // Start with all-false to match server-rendered HTML, then hydrate
  // from localStorage in useEffect (avoids SSR/client mismatch)
  const [locks, setLocksState] = useState<PhaseLocks>({
    phase1: false,
    phase2: false,
    phase3: false,
    phase4: false,
  });

  // Hydrate from localStorage after mount, and whenever projectId changes
  useEffect(() => {
    setLocksState(loadLocksFromStorage(projectId));
  }, [projectId]);

  // Sync with API: load document statuses and update locks
  useEffect(() => {
    let cancelled = false;
    apiClient.getDocuments(projectId).then((docs) => {
      if (cancelled) return;
      const apiLocks = deriveLocks(docs);
      // Merge: keep any local locks that are already true (ratchet-only forward)
      setLocksState((prev) => {
        const merged: PhaseLocks = {
          phase1: prev.phase1 || apiLocks.phase1,
          phase2: prev.phase2 || apiLocks.phase2,
          phase3: prev.phase3 || apiLocks.phase3,
          phase4: prev.phase4 || apiLocks.phase4,
        };
        saveLocksToStorage(projectId, merged);
        return merged;
      });
    }).catch(() => {
      // API not reachable — fall back to localStorage state silently
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const setLocks = useCallback(
    (next: PhaseLocks) => {
      setLocksState(next);
      saveLocksToStorage(projectId, next);
    },
    [projectId],
  );

  const lockPhase = useCallback(
    (phase: 1 | 2 | 3 | 4) => {
      setLocksState((prev) => {
        const next: PhaseLocks = {
          ...prev,
          ...(phase === 1 ? { phase1: true } : {}),
          ...(phase === 2 ? { phase2: true } : {}),
          ...(phase === 3 ? { phase3: true } : {}),
          ...(phase === 4 ? { phase4: true } : {}),
        };
        saveLocksToStorage(projectId, next);
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
              : locks.phase4;
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
