"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkflow } from "@/contexts/workflow-context";

function firstAllowedPhase(locks: {
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
}) {
  if (!locks.phase1) return 1;
  if (!locks.phase2) return 2;
  if (!locks.phase3) return 3;
  return 4;
}

/** 이전 단계 미완료 시 허용된 phase로 replace만 수행합니다. */
export function PhaseAccessGuard({
  projectId,
  phase,
}: {
  projectId: string;
  phase: 1 | 2 | 3 | 4;
}) {
  const { canAccessPhase, locks } = useWorkflow();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessPhase(phase)) {
      const target = firstAllowedPhase(locks);
      router.replace(`/project/${projectId}/phase/${target}`);
    }
  }, [canAccessPhase, locks, phase, projectId, router]);

  return null;
}
