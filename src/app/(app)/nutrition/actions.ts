"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  nutritionLogSchema,
  waterLogSchema,
  nutritionTargetSchema,
  foodItemSchema,
} from "@/lib/validations";
import { startOfDay } from "@/lib/utils";

export type NutritionActionResult = { ok: boolean; id?: string; error?: string };

export async function updateNutritionTargetAction(input: unknown): Promise<NutritionActionResult> {
  const user = await requireUser();
  const parsed = nutritionTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  await prisma.nutritionTarget.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...d },
    update: d,
  });

  revalidatePath("/nutrition");
  revalidatePath("/overview");
  return { ok: true };
}

export async function createFoodItemAction(input: unknown): Promise<NutritionActionResult> {
  const user = await requireUser();
  const parsed = foodItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const existing = await prisma.foodItem.findFirst({
    where: { userId: user.id, name: d.name.trim() },
  });
  if (existing) return { ok: false, error: "Makanan kustom dengan nama itu sudah ada." };

  const food = await prisma.foodItem.create({
    data: {
      userId: user.id,
      name: d.name.trim(),
      brand: d.brand?.trim() || null,
      caloriesKcal: d.caloriesKcal,
      proteinG: d.proteinG,
      carbsG: d.carbsG,
      fatG: d.fatG,
      servingSizeG: d.servingSizeG,
    },
  });

  revalidatePath("/nutrition");
  return { ok: true, id: food.id };
}

export async function deleteFoodItemAction(id: string): Promise<NutritionActionResult> {
  const user = await requireUser();
  const food = await prisma.foodItem.findFirst({ where: { id, userId: user.id } });
  if (!food) return { ok: false, error: "Makanan tidak ditemukan." };

  await prisma.foodItem.delete({ where: { id } });
  revalidatePath("/nutrition");
  return { ok: true };
}

export async function logFoodAction(input: unknown): Promise<NutritionActionResult> {
  const user = await requireUser();
  const parsed = nutritionLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Tanggal tidak valid." };

  if (d.idempotencyKey) {
    const dup = await prisma.nutritionLog.findUnique({ where: { idempotencyKey: d.idempotencyKey } });
    if (dup) {
      if (dup.userId !== user.id) return { ok: false, error: "Key konflik." };
      return { ok: true, id: dup.id };
    }
  }

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let name = d.name.trim();

  if (d.foodItemId) {
    const food = await prisma.foodItem.findFirst({
      where: { id: d.foodItemId, OR: [{ isSystem: true }, { userId: user.id }] },
    });
    if (!food) return { ok: false, error: "Makanan tidak ditemukan." };
    name = food.name;
    calories = food.caloriesKcal * d.servings;
    protein = food.proteinG * d.servings;
    carbs = food.carbsG * d.servings;
    fat = food.fatG * d.servings;
  } else {
    if (d.caloriesKcal == null) return { ok: false, error: "Isi kalori untuk makanan manual." };
    calories = d.caloriesKcal;
    protein = d.proteinG ?? 0;
    carbs = d.carbsG ?? 0;
    fat = d.fatG ?? 0;
  }

  const log = await prisma.nutritionLog.create({
    data: {
      userId: user.id,
      date: startOfDay(date),
      meal: d.meal,
      foodItemId: d.foodItemId ?? null,
      name,
      servings: d.servings,
      caloriesKcal: Math.round(calories * 10) / 10,
      proteinG: Math.round(protein * 10) / 10,
      carbsG: Math.round(carbs * 10) / 10,
      fatG: Math.round(fat * 10) / 10,
      idempotencyKey: d.idempotencyKey ?? null,
    },
  });

  revalidatePath("/nutrition");
  revalidatePath("/overview");
  return { ok: true, id: log.id };
}

export async function logWaterAction(input: unknown): Promise<NutritionActionResult> {
  const user = await requireUser();
  const parsed = waterLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "Tanggal tidak valid." };

  if (d.idempotencyKey) {
    const dup = await prisma.nutritionLog.findUnique({ where: { idempotencyKey: d.idempotencyKey } });
    if (dup) {
      if (dup.userId !== user.id) return { ok: false, error: "Key konflik." };
      return { ok: true, id: dup.id };
    }
  }

  const log = await prisma.nutritionLog.create({
    data: {
      userId: user.id,
      date: startOfDay(date),
      meal: "SNACK",
      name: "Air Putih",
      servings: 1,
      waterMl: d.waterMl,
      idempotencyKey: d.idempotencyKey ?? null,
    },
  });

  revalidatePath("/nutrition");
  revalidatePath("/overview");
  return { ok: true, id: log.id };
}

export async function deleteNutritionLogAction(id: string): Promise<NutritionActionResult> {
  const user = await requireUser();
  const log = await prisma.nutritionLog.findFirst({ where: { id, userId: user.id } });
  if (!log) return { ok: false, error: "Log tidak ditemukan." };

  await prisma.nutritionLog.delete({ where: { id } });
  revalidatePath("/nutrition");
  revalidatePath("/overview");
  return { ok: true };
}
