"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { exerciseSchema } from "@/lib/validations";

export type AdminActionResult = { ok: boolean; id?: string; error?: string };

export async function setSuspendedAction(userId: string, suspended: boolean): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false, error: "Tidak bisa menangguhkan akun sendiri." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) return { ok: false, error: "Pengguna tidak ditemukan." };
  if (target.role === "ADMIN" && suspended) return { ok: false, error: "Akun admin tidak bisa ditangguhkan." };

  await prisma.user.update({ where: { id: userId }, data: { suspended } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function adminCreateSystemExerciseAction(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const duplicate = await prisma.exercise.findFirst({
    where: { isSystem: true, name: { equals: d.name.trim(), mode: "insensitive" } },
  });
  if (duplicate) return { ok: false, error: "Latihan sistem dengan nama ini sudah ada." };

  const created = await prisma.exercise.create({
    data: {
      name: d.name.trim(),
      description: d.description,
      primaryMuscle: d.primaryMuscle,
      secondaryMuscles: d.secondaryMuscles,
      equipment: d.equipment,
      type: d.type,
      instructions: d.instructions,
      difficulty: d.difficulty,
      isSystem: true,
      createdById: null,
    },
  });

  revalidatePath("/admin/exercises");
  revalidatePath("/exercises");
  return { ok: true, id: created.id };
}

export async function adminUpdateSystemExerciseAction(id: string, input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing || !existing.isSystem) return { ok: false, error: "Hanya latihan sistem yang dapat dikelola di sini." };

  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  await prisma.exercise.update({
    where: { id },
    data: {
      name: d.name.trim(),
      description: d.description,
      primaryMuscle: d.primaryMuscle,
      secondaryMuscles: d.secondaryMuscles,
      equipment: d.equipment,
      type: d.type,
      instructions: d.instructions,
      difficulty: d.difficulty,
    },
  });

  revalidatePath("/admin/exercises");
  revalidatePath("/exercises");
  return { ok: true, id };
}

export async function adminDeleteSystemExerciseAction(id: string): Promise<AdminActionResult> {
  await requireAdmin();
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing || !existing.isSystem) return { ok: false, error: "Hanya latihan sistem yang dapat dikelola di sini." };

  const used = await prisma.workoutExercise.count({ where: { exerciseId: id } });
  if (used > 0) {
    return { ok: false, error: `Latihan dipakai ${used} kali di histori pengguna — tidak bisa dihapus.` };
  }

  await prisma.exercise.delete({ where: { id } });
  revalidatePath("/admin/exercises");
  revalidatePath("/exercises");
  return { ok: true };
}
