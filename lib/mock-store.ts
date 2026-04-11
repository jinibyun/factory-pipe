import type {
  DocumentRow,
  MigrationLogRow,
  ProjectRow,
  RequirementRow,
} from "@/types";
import { DEFAULT_SPECS } from "./spec-defaults";

function makeId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

// ─── In-memory stores ─────────────────────────────────────────────────────────
// These live for the lifetime of the Node.js process (dev server restart clears them).

export const mockProjects = new Map<string, ProjectRow>();
export const mockDocuments = new Map<string, DocumentRow[]>();
export const mockRequirements = new Map<string, RequirementRow[]>();
export const mockMigrationLogs = new Map<string, MigrationLogRow[]>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createProject(
  data: Pick<ProjectRow, "name"> & Partial<Pick<ProjectRow, "description">>,
  overviewDraft?: string,
): ProjectRow {
  const id = makeId();
  const ts = now();
  const project: ProjectRow = {
    id,
    user_id: "mock-user",
    name: data.name,
    description: data.description ?? null,
    status: "active",
    created_at: ts,
    updated_at: ts,
  };
  mockProjects.set(id, project);

  // Seed default documents for the new project
  const defaultDocs: DocumentRow[] = [
    {
      id: makeId(),
      project_id: id,
      doc_type: "00_overview",
      content: overviewDraft ?? "",
      status: "Draft",
      version: 1,
      updated_at: ts,
    },
    {
      id: makeId(),
      project_id: id,
      doc_type: "01_db_schema",
      content: DEFAULT_SPECS.db,
      status: "Draft",
      version: 1,
      updated_at: ts,
    },
    {
      id: makeId(),
      project_id: id,
      doc_type: "02_api_routes",
      content: DEFAULT_SPECS.api,
      status: "Draft",
      version: 1,
      updated_at: ts,
    },
    {
      id: makeId(),
      project_id: id,
      doc_type: "03_frontend_ui",
      content: DEFAULT_SPECS.ui,
      status: "Draft",
      version: 1,
      updated_at: ts,
    },
  ];
  mockDocuments.set(id, defaultDocs);
  mockRequirements.set(id, []);
  mockMigrationLogs.set(id, []);

  return project;
}

export function getDocuments(projectId: string): DocumentRow[] {
  if (!mockDocuments.has(projectId)) {
    const ts = now();
    mockDocuments.set(projectId, [
      {
        id: makeId(),
        project_id: projectId,
        doc_type: "01_db_schema",
        content: DEFAULT_SPECS.db,
        status: "Draft",
        version: 1,
        updated_at: ts,
      },
      {
        id: makeId(),
        project_id: projectId,
        doc_type: "02_api_routes",
        content: DEFAULT_SPECS.api,
        status: "Draft",
        version: 1,
        updated_at: ts,
      },
      {
        id: makeId(),
        project_id: projectId,
        doc_type: "03_frontend_ui",
        content: DEFAULT_SPECS.ui,
        status: "Draft",
        version: 1,
        updated_at: ts,
      },
    ]);
  }
  return mockDocuments.get(projectId)!;
}

export function upsertDocument(
  projectId: string,
  docType: DocumentRow["doc_type"],
  content: string,
): DocumentRow {
  const docs = getDocuments(projectId);
  const existing = docs.find((d) => d.doc_type === docType);
  const ts = now();
  if (existing) {
    existing.content = content;
    existing.version += 1;
    existing.updated_at = ts;
    return existing;
  }
  const newDoc: DocumentRow = {
    id: makeId(),
    project_id: projectId,
    doc_type: docType,
    content,
    status: "Draft",
    version: 1,
    updated_at: ts,
  };
  docs.push(newDoc);
  return newDoc;
}

export function lockDocument(documentId: string): DocumentRow | null {
  for (const docs of mockDocuments.values()) {
    const doc = docs.find((d) => d.id === documentId);
    if (doc) {
      doc.status = "Final";
      doc.updated_at = now();
      return doc;
    }
  }
  return null;
}

export function upsertRequirement(
  projectId: string,
  questionKey: string,
  answerText: string,
): RequirementRow {
  if (!mockRequirements.has(projectId)) {
    mockRequirements.set(projectId, []);
  }
  const reqs = mockRequirements.get(projectId)!;
  const existing = reqs.find((r) => r.question_key === questionKey);
  const ts = now();
  if (existing) {
    existing.answer_text = answerText;
    existing.updated_at = ts;
    return existing;
  }
  const newReq: RequirementRow = {
    id: makeId(),
    project_id: projectId,
    question_key: questionKey,
    answer_text: answerText,
    created_at: ts,
    updated_at: ts,
  };
  reqs.push(newReq);
  return newReq;
}

export function addMigrationLog(
  projectId: string,
  sqlQuery: string,
  status: "success" | "failed",
): MigrationLogRow {
  if (!mockMigrationLogs.has(projectId)) {
    mockMigrationLogs.set(projectId, []);
  }
  const log: MigrationLogRow = {
    id: makeId(),
    project_id: projectId,
    sql_query: sqlQuery,
    status,
    applied_at: now(),
  };
  mockMigrationLogs.get(projectId)!.unshift(log);
  return log;
}
