import { NextResponse } from "next/server";
import { saveWorkoutAction } from "@/app/(app)/workout/actions";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid." }, { status: 400 });
  }

  const result = await saveWorkoutAction(body);
  if (!result.ok) {
    // key idempotensi milik user lain → konflik
    const status = result.error === "Key konflik." ? 409 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
