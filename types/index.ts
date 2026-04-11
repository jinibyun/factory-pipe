// ─── Layer 1: DB Row Types (1:1 mapping with DB schema) ───────────────────────

export interface UserRow {
  id: string;
  email: string;
  github_username: string | null;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type DocType =
  | "00_overview"
  | "01_db_schema"
  | "02_api_routes"
  | "03_frontend_ui";

export type DocStatus = "Draft" | "Final" | "Implemented";

export interface DocumentRow {
  id: string;
  project_id: string;
  doc_type: DocType;
  content: string;
  status: DocStatus;
  version: number;
  updated_at: string;
}

export interface MigrationLogRow {
  id: string;
  project_id: string;
  sql_query: string;
  status: "success" | "failed";
  applied_at: string;
}

export interface RequirementRow {
  id: string;
  project_id: string;
  question_key: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
}

export interface PromptRow {
  id: string;
  phase: string;
  template_content: string;
  version: number;
  created_at: string;
}

// ─── Layer 2: API Request / Response Types ────────────────────────────────────

// GET /api/projects
export type GetProjectsResponse = ProjectRow[];

// POST /api/projects
export interface CreateProjectRequest {
  name: string;
  description?: string;
  overview_draft?: string;
}
export type CreateProjectResponse = ProjectRow;

// GET /api/projects/[id]
export type GetProjectResponse = ProjectRow;

// GET /api/projects/[id]/requirements
export type GetRequirementsResponse = RequirementRow[];

// POST /api/projects/[id]/requirements
export interface UpsertRequirementRequest {
  question_key: string;
  answer_text: string;
}
export type UpsertRequirementResponse = RequirementRow;

// GET /api/projects/[id]/documents
export type GetDocumentsResponse = DocumentRow[];

// GET /api/projects/[id]/migration-logs
export type GetMigrationLogsResponse = MigrationLogRow[];

// POST /api/github/documents/sync
export interface SyncDocumentRequest {
  project_id: string;
  doc_type: DocType;
  content: string;
  commit_message: string;
}
export interface SyncDocumentResponse {
  status: "success";
  commit_sha: string;
}

// PUT /api/documents/lock
export interface LockDocumentRequest {
  document_id: string;
  status: "Final";
}
export interface LockDocumentResponse {
  status: "locked";
  next_phase_unlocked: boolean;
}

// POST /api/ai/spec-splitter
export interface SpecSplitterRequest {
  project_id: string;
  overview_content: string;
}
export interface SpecSplitterResponse {
  "01_db_schema": string;
  "02_api_routes": string;
  "03_frontend_ui": string;
}

// POST /api/ai/judge
export interface JudgeRequest {
  target_doc_type: string;
  code_snippet: string;
}
export interface JudgeResponse {
  is_valid: boolean;
  feedback: string;
  violation_points: string[];
}

// POST /api/prompts/assemble
export interface AssembleRequest {
  project_id: string;
  target_phase: string;
}
export interface AssembleResponse {
  assembled_prompt: string;
}

// POST /api/database/migrate
export interface MigrateRequest {
  project_id: string;
  sql_query: string;
}
export interface MigrateResponse {
  status: "success" | "failed";
  log_id?: string;
  error_message?: string;
}

// ─── Shared Error Response ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  status: number;
}
