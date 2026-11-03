import { NextResponse } from "next/server";
import { logFoodAction, logWaterAction } from "@/app/(app)/nutrition/actions";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body tidak valid." }, { status: 400 });
  }

  const record = body as { kind?: string };
  try {
    const result = record?.kind === "water" ? await logWaterAction(body) : await logFoodAction(body);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    // requireUser melakukan redirect saat sesi hilang — tandai permanen agar antrean dibuang
    const digested = (e as { digest?: string })?.digest ?? "";
    if (digested.startsWith("NEXT_REDIRECT")) {
      return NextResponse.json({ ok: false, error: "Sesi berakhir." }, { status: 401 });
    }
    throw e;
  }
}
