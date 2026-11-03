"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { exerciseSchema } from "@/lib/validations";

export type ExerciseActionResult = { ok: boolean; id?: string; error?: string };

export async function createExerciseAction(input: unknown): Promise<ExerciseActionResult> {
  const user = await requireUser();
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const duplicate = await prisma.exercise.findFirst({
    where: {
      createdById: user.id,
      name: { equals: data.name.trim(), mode: "insensitive" },
    },
  });
  if (duplicate) {
    return { ok: false, error: "Anda sudah punya latihan kustom dengan nama ini." };
  }

  const created = await prisma.exercise.create({
    data: {
      name: data.name.trim(),
      description: data.description,
      primaryMuscle: data.primaryMuscle,
      secondaryMuscles: data.secondaryMuscles,
      equipment: data.equipment,
      type: data.type,
      instructions: data.instructions,
      difficulty: data.difficulty,
      isSystem: false,
      createdById: user.id,
    },
  });

  revalidatePath("/exercises");
  return { ok: true, id: created.id };
}

export async function updateExerciseAction(id: string, input: unknown): Promise<ExerciseActionResult> {
  const user = await requireUser();

  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing || existing.isSystem || existing.createdById !== user.id) {
    return { ok: false, error: "Hanya latihan kustom milik Anda yang dapat diubah." };
  }

  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const duplicate = await prisma.exercise.findFirst({
    where: {
      createdById: user.id,
      id: { not: id },
      name: { equals: data.name.trim(), mode: "insensitive" },
    },
  });
  if (duplicate) {
    return { ok: false, error: "Nama latihan sudah dipakai." };
  }

  await prisma.exercise.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description,
      primaryMuscle: data.primaryMuscle,
      secondaryMuscles: data.secondaryMuscles,
      equipment: data.equipment,
      type: data.type,
      instructions: data.instructions,
      difficulty: data.difficulty,
    },
  });

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}`);
  return { ok: true, id };
}

export async function deleteExerciseAction(id: string): Promise<ExerciseActionResult> {
  const user = await requireUser();

  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing || existing.isSystem || existing.createdById !== user.id) {
    return { ok: false, error: "Hanya latihan kustom milik Anda yang dapat dihapus." };
  }

  const usedInWorkout = await prisma.workoutExercise.findFirst({
    where: { exerciseId: id, session: { userId: user.id } },
    select: { id: true },
  });
  if (usedInWorkout) {
    return {
      ok: false,
      error: "Latihan ini sudah dipakai di riwayat workout dan tidak bisa dihapus agar data Anda tetap utuh.",
    };
  }

  await prisma.exercise.delete({ where: { id } });
  revalidatePath("/exercises");
  return { ok: true };
}
