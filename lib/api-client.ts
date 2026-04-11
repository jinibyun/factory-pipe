import type {
  AssembleRequest,
  AssembleResponse,
  CreateProjectRequest,
  GetDocumentsResponse,
  GetMigrationLogsResponse,
  GetProjectResponse,
  GetProjectsResponse,
  GetRequirementsResponse,
  JudgeRequest,
  JudgeResponse,
  LockDocumentRequest,
  LockDocumentResponse,
  MigrateRequest,
  MigrateResponse,
  SpecSplitterRequest,
  SpecSplitterResponse,
  SyncDocumentRequest,
  SyncDocumentResponse,
  UpsertRequirementRequest,
  UpsertRequirementResponse,
  CreateProjectResponse,
} from "@/types";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  // TODO: inject Authorization: Bearer {supabase_token} here
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const apiClient = {
  getProjects(): Promise<GetProjectsResponse> {
    return request<GetProjectsResponse>("/api/projects");
  },

  createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    return request<CreateProjectResponse>("/api/projects", {
      method: "POST",
      ...json(data),
    });
  },

  getProject(id: string): Promise<GetProjectResponse> {
    return request<GetProjectResponse>(`/api/projects/${id}`);
  },

  // ─── Requirements ───────────────────────────────────────────────────────────

  getRequirements(projectId: string): Promise<GetRequirementsResponse> {
    return request<GetRequirementsResponse>(
      `/api/projects/${projectId}/requirements`,
    );
  },

  upsertRequirement(
    projectId: string,
    data: UpsertRequirementRequest,
  ): Promise<UpsertRequirementResponse> {
    return request<UpsertRequirementResponse>(
      `/api/projects/${projectId}/requirements`,
      { method: "POST", ...json(data) },
    );
  },

  // ─── Documents ──────────────────────────────────────────────────────────────

  getDocuments(projectId: string): Promise<GetDocumentsResponse> {
    return request<GetDocumentsResponse>(
      `/api/projects/${projectId}/documents`,
    );
  },

  // ─── Migration Logs ─────────────────────────────────────────────────────────

  getMigrationLogs(projectId: string): Promise<GetMigrationLogsResponse> {
    return request<GetMigrationLogsResponse>(
      `/api/projects/${projectId}/migration-logs`,
    );
  },

  // ─── GitHub Sync ────────────────────────────────────────────────────────────

  syncDocument(data: SyncDocumentRequest): Promise<SyncDocumentResponse> {
    return request<SyncDocumentResponse>("/api/github/documents/sync", {
      method: "POST",
      ...json(data),
    });
  },

  // ─── Document Lock ──────────────────────────────────────────────────────────

  lockDocument(data: LockDocumentRequest): Promise<LockDocumentResponse> {
    return request<LockDocumentResponse>("/api/documents/lock", {
      method: "PUT",
      ...json(data),
    });
  },

  // ─── AI: Spec Splitter ──────────────────────────────────────────────────────

  splitSpec(data: SpecSplitterRequest): Promise<SpecSplitterResponse> {
    return request<SpecSplitterResponse>("/api/ai/spec-splitter", {
      method: "POST",
      ...json(data),
    });
  },

  // ─── AI: Judge ──────────────────────────────────────────────────────────────

  judgeCode(data: JudgeRequest): Promise<JudgeResponse> {
    return request<JudgeResponse>("/api/ai/judge", {
      method: "POST",
      ...json(data),
    });
  },

  // ─── Prompts: Assemble ──────────────────────────────────────────────────────

  assemblePrompt(data: AssembleRequest): Promise<AssembleResponse> {
    return request<AssembleResponse>("/api/prompts/assemble", {
      method: "POST",
      ...json(data),
    });
  },

  // ─── Database: Migrate ──────────────────────────────────────────────────────

  migrate(data: MigrateRequest): Promise<MigrateResponse> {
    return request<MigrateResponse>("/api/database/migrate", {
      method: "POST",
      ...json(data),
    });
  },
};
