"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { bodyMeasurementSchema } from "@/lib/validations";

export type BodyActionResult = { ok: boolean; id?: string; error?: string };

function parseData(input: unknown) {
  const parsed = bodyMeasurementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;
  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) return { ok: false as const, error: "Tanggal tidak valid." };
  const allEmpty = [d.weightKg, d.heightCm, d.chestCm, d.waistCm, d.armCm, d.forearmCm, d.thighCm, d.calfCm, d.bodyFatPercent].every(
    (v) => v == null
  );
  if (allEmpty) return { ok: false as const, error: "Isi minimal satu pengukuran." };
  return { ok: true as const, date, data: d };
}

export async function addMeasurementAction(input: unknown): Promise<BodyActionResult> {
  const user = await requireUser();
  const parsed = parseData(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const d = parsed.data;

  const created = await prisma.bodyMeasurement.create({
    data: {
      userId: user.id,
      date: parsed.date,
      weightKg: d.weightKg,
      heightCm: d.heightCm,
      chestCm: d.chestCm,
      waistCm: d.waistCm,
      armCm: d.armCm,
      forearmCm: d.forearmCm,
      thighCm: d.thighCm,
      calfCm: d.calfCm,
      bodyFatPercent: d.bodyFatPercent,
      notes: d.notes,
    },
  });

  revalidatePath("/body-progress");
  revalidatePath("/overview");
  return { ok: true, id: created.id };
}

export async function updateMeasurementAction(id: string, input: unknown): Promise<BodyActionResult> {
  const user = await requireUser();
  const existing = await prisma.bodyMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Data tidak ditemukan." };
  }
  const parsed = parseData(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const d = parsed.data;

  await prisma.bodyMeasurement.update({
    where: { id },
    data: {
      date: parsed.date,
      weightKg: d.weightKg,
      heightCm: d.heightCm,
      chestCm: d.chestCm,
      waistCm: d.waistCm,
      armCm: d.armCm,
      forearmCm: d.forearmCm,
      thighCm: d.thighCm,
      calfCm: d.calfCm,
      bodyFatPercent: d.bodyFatPercent,
      notes: d.notes,
    },
  });

  revalidatePath("/body-progress");
  revalidatePath("/overview");
  return { ok: true, id };
}

export async function deleteMeasurementAction(id: string): Promise<BodyActionResult> {
  const user = await requireUser();
  const existing = await prisma.bodyMeasurement.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Data tidak ditemukan." };
  }
  await prisma.bodyMeasurement.delete({ where: { id } });
  revalidatePath("/body-progress");
  revalidatePath("/overview");
  return { ok: true };
}
