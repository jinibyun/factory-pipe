import { NextResponse } from "next/server";
import { mockProjects } from "@/lib/mock-store";

// TODO: Supabase Auth 검증
async function delay() {
  await new Promise((r) => setTimeout(r, 200));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await delay();
  const { id } = await params;
  const project = mockProjects.get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await delay();
  const { id } = await params;
  const project = mockProjects.get(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const body = (await req.json()) as Partial<{ name: string; description: string; status: string }>;
  if (body.name !== undefined) project.name = body.name;
  if (body.description !== undefined) project.description = body.description;
  if (body.status !== undefined) project.status = body.status;
  project.updated_at = new Date().toISOString();
  return NextResponse.json(project);
}
