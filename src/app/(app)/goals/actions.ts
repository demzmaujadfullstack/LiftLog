"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { goalSchema } from "@/lib/validations";

export type GoalActionResult = { ok: boolean; id?: string; error?: string };

function parseGoal(input: unknown) {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  return { ok: true as const, data: parsed.data };
}

export async function createGoalAction(input: unknown): Promise<GoalActionResult> {
  const user = await requireUser();
  const parsed = parseGoal(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const d = parsed.data;

  if (d.type === "EXERCISE_WEIGHT" && !d.exerciseId) {
    return { ok: false, error: "Pilih latihan untuk goal tipe beban." };
  }

  const goal = await prisma.userGoal.create({
    data: {
      userId: user.id,
      title: d.title.trim(),
      type: d.type,
      exerciseId: d.exerciseId || null,
      startValue: d.startValue,
      targetValue: d.targetValue,
      currentValue: d.currentValue ?? d.startValue ?? null,
      unit: d.unit || (d.type === "WEEKLY_WORKOUTS" ? "sesi/minggu" : d.type === "BODY_WEIGHT" ? "kg" : d.exerciseId ? "kg" : null),
      deadline: d.deadline ? new Date(d.deadline) : null,
      milestones:
        d.startValue != null
          ? { create: [{ value: d.startValue, note: "Nilai awal" }] }
          : undefined,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/overview");
  return { ok: true, id: goal.id };
}

export async function updateGoalProgressAction(
  id: string,
  currentValue: number
): Promise<GoalActionResult> {
  const user = await requireUser();
  const goal = await prisma.userGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) return { ok: false, error: "Goal tidak ditemukan." };
  if (!Number.isFinite(currentValue)) return { ok: false, error: "Nilai tidak valid." };

  const reached =
    goal.targetValue >= (goal.startValue ?? 0)
      ? currentValue >= goal.targetValue
      : currentValue <= goal.targetValue;

  await prisma.userGoal.update({
    where: { id },
    data: {
      currentValue,
      status: reached ? "COMPLETED" : "ACTIVE",
      milestones: { create: [{ value: currentValue }] },
    },
  });

  revalidatePath("/goals");
  revalidatePath("/overview");
  return { ok: true };
}

export async function updateGoalAction(id: string, input: unknown): Promise<GoalActionResult> {
  const user = await requireUser();
  const goal = await prisma.userGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) return { ok: false, error: "Goal tidak ditemukan." };

  const parsed = parseGoal(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const d = parsed.data;

  await prisma.userGoal.update({
    where: { id },
    data: {
      title: d.title.trim(),
      type: d.type,
      exerciseId: d.exerciseId || null,
      startValue: d.startValue,
      targetValue: d.targetValue,
      unit: d.unit || null,
      deadline: d.deadline ? new Date(d.deadline) : null,
    },
  });

  revalidatePath("/goals");
  return { ok: true, id };
}

export async function setGoalStatusAction(id: string, status: "ACTIVE" | "COMPLETED" | "ABANDONED"): Promise<GoalActionResult> {
  const user = await requireUser();
  const goal = await prisma.userGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) return { ok: false, error: "Goal tidak ditemukan." };

  await prisma.userGoal.update({ where: { id }, data: { status } });
  revalidatePath("/goals");
  revalidatePath("/overview");
  return { ok: true };
}

export async function deleteGoalAction(id: string): Promise<GoalActionResult> {
  const user = await requireUser();
  const goal = await prisma.userGoal.findUnique({ where: { id } });
  if (!goal || goal.userId !== user.id) return { ok: false, error: "Goal tidak ditemukan." };

  await prisma.userGoal.delete({ where: { id } });
  revalidatePath("/goals");
  revalidatePath("/overview");
  return { ok: true };
}
