import { NextResponse } from "next/server";
import { saveWorkoutAction, updateWorkoutAction } from "@/app/(app)/workout/actions";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid." }, { status: 400 });
  }

  const result = await saveWorkoutAction(body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid." }, { status: 400 });
  }

  const result = await updateWorkoutAction(id, body);
  if (!result.ok) {
    const status = result.error === "Workout tidak ditemukan." ? 404 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
