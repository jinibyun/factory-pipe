import { NextResponse } from "next/server";
import { getDocuments } from "@/lib/mock-store";

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
  const docs = getDocuments(id);
  return NextResponse.json(docs);
}
