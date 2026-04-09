export type Project = {
  id: string;
  name: string;
  description: string;
  overviewDraft: string;
  createdAt: string;
};

const KEY = "factory-pipe-projects";

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Project[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function addProject(p: Omit<Project, "createdAt">) {
  const projects = loadProjects();
  const next: Project = {
    ...p,
    createdAt: new Date().toISOString(),
  };
  saveProjects([next, ...projects]);
  return next;
}
