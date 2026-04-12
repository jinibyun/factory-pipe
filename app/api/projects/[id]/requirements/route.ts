import { NextResponse } from "next/server";
import { mockRequirements, upsertRequirement } from "@/lib/mock-store";
import type { UpsertRequirementRequest } from "@/types";

// TODO: supabase or Neon Auth 검증
async function delay() {
  await new Promise((r) => setTimeout(r, 200));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await delay();
  const { id } = await params;
  const reqs = mockRequirements.get(id) ?? [];
  return NextResponse.json(reqs);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await delay();
  const { id } = await params;
  const body = (await req.json()) as UpsertRequirementRequest;
  if (!body.question_key?.trim()) {
    return NextResponse.json({ error: "question_key is required" }, { status: 400 });
  }
  const result = upsertRequirement(id, body.question_key, body.answer_text ?? "");
  return NextResponse.json(result, { status: 201 });
}
