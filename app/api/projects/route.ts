import { NextResponse } from "next/server";
import { createProject, mockProjects } from "@/lib/mock-store";
import type { CreateProjectRequest } from "@/types";

// TODO: supabase or Neon Auth 검증
async function delay() {
  await new Promise((r) => setTimeout(r, 300));
}

export async function GET() {
  await delay();
  const projects = Array.from(mockProjects.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  await delay();
  const body = (await req.json()) as CreateProjectRequest;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const project = createProject(
    { name: body.name.trim(), description: body.description?.trim() },
    body.overview_draft,
  );
  return NextResponse.json(project, { status: 201 });
}
