"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { programSchema } from "@/lib/validations";
import { PROGRAM_TEMPLATES } from "@/lib/program-templates";

export type ProgramActionResult = { ok: boolean; id?: string; error?: string };

async function verifyExerciseIds(userId: string, ids: string[]): Promise<string | null> {
  if (ids.length === 0) return null;
  const found = await prisma.exercise.count({
    where: { id: { in: ids }, OR: [{ isSystem: true }, { createdById: userId }] },
  });
  return found === new Set(ids).size ? null : "Ada latihan yang tidak valid.";
}

async function createProgramData(userId: string, d: z.infer<typeof programSchema>) {
  return prisma.workoutProgram.create({
    data: {
      userId,
      name: d.name.trim(),
      description: d.description?.trim() || null,
      template: d.template || null,
      days: {
        create: d.days.map((day, i) => ({
          name: day.name.trim(),
          dayIndex: i,
          exercises: {
            create: day.exercises.map((ex, order) => ({
              exerciseId: ex.exerciseId,
              order,
              targetSets: ex.targetSets,
              targetRepsMin: ex.targetRepsMin ?? null,
              targetRepsMax: ex.targetRepsMax ?? null,
              targetWeightKg: ex.targetWeightKg ?? null,
              restSeconds: ex.restSeconds ?? null,
            })),
          },
        })),
      },
    },
  });
}

export async function createProgramFromTemplateAction(
  templateKey: string
): Promise<ProgramActionResult> {
  const user = await requireUser();
  const template = PROGRAM_TEMPLATES.find((t) => t.key === templateKey);
  if (!template) return { ok: false, error: "Template tidak ditemukan." };

  const names = template.days.flatMap((d) => d.exercises.map((e) => e.name));
  const exercises = await prisma.exercise.findMany({
    where: { isSystem: true, name: { in: names } },
    select: { id: true, name: true },
  });
  const byName = new Map(exercises.map((e) => [e.name, e.id]));

  const program = await prisma.workoutProgram.create({
    data: {
      userId: user.id,
      name: template.name,
      description: template.description,
      template: template.key,
      days: {
        create: template.days.map((day, dayIndex) => ({
          name: day.name,
          dayIndex,
          exercises: {
            create: day.exercises
              .filter((e) => byName.has(e.name))
              .map((e, order) => ({
                exerciseId: byName.get(e.name)!,
                order,
                targetSets: e.targetSets,
                targetRepsMin: e.targetRepsMin,
                targetRepsMax: e.targetRepsMax,
                restSeconds: e.restSeconds,
              })),
          },
        })),
      },
    },
  });

  revalidatePath("/programs");
  return { ok: true, id: program.id };
}

export async function saveProgramAction(
  input: unknown,
  id?: string
): Promise<ProgramActionResult> {
  const user = await requireUser();
  const parsed = programSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const exerciseIds = d.days.flatMap((day) => day.exercises.map((e) => e.exerciseId));
  const invalid = await verifyExerciseIds(user.id, exerciseIds);
  if (invalid) return { ok: false, error: invalid };

  if (id) {
    const existing = await prisma.workoutProgram.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return { ok: false, error: "Program tidak ditemukan." };
    }
    await prisma.$transaction(async (tx) => {
      await tx.workoutDay.deleteMany({ where: { programId: id } });
      await tx.workoutProgram.update({
        where: { id },
        data: {
          name: d.name.trim(),
          description: d.description?.trim() || null,
          days: {
            create: d.days.map((day, dayIndex) => ({
              name: day.name.trim(),
              dayIndex,
              exercises: {
                create: day.exercises.map((ex, order) => ({
                  exerciseId: ex.exerciseId,
                  order,
                  targetSets: ex.targetSets,
                  targetRepsMin: ex.targetRepsMin ?? null,
                  targetRepsMax: ex.targetRepsMax ?? null,
                  targetWeightKg: ex.targetWeightKg ?? null,
                  restSeconds: ex.restSeconds ?? null,
                })),
              },
            })),
          },
        },
      });
    });
    revalidatePath("/programs");
    revalidatePath(`/programs/${id}`);
    return { ok: true, id };
  }

  const program = await createProgramData(user.id, d);
  revalidatePath("/programs");
  return { ok: true, id: program.id };
}

export async function activateProgramAction(id: string): Promise<ProgramActionResult> {
  const user = await requireUser();
  const program = await prisma.workoutProgram.findUnique({ where: { id } });
  if (!program || program.userId !== user.id) return { ok: false, error: "Program tidak ditemukan." };

  await prisma.$transaction([
    prisma.workoutProgram.updateMany({ where: { userId: user.id }, data: { isActive: false } }),
    prisma.workoutProgram.update({ where: { id }, data: { isActive: true } }),
  ]);

  revalidatePath("/programs");
  revalidatePath("/overview");
  return { ok: true };
}

export async function deactivateProgramAction(id: string): Promise<ProgramActionResult> {
  const user = await requireUser();
  const program = await prisma.workoutProgram.findUnique({ where: { id } });
  if (!program || program.userId !== user.id) return { ok: false, error: "Program tidak ditemukan." };

  await prisma.workoutProgram.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/programs");
  return { ok: true };
}

export async function deleteProgramAction(id: string): Promise<ProgramActionResult> {
  const user = await requireUser();
  const program = await prisma.workoutProgram.findUnique({ where: { id } });
  if (!program || program.userId !== user.id) return { ok: false, error: "Program tidak ditemukan." };

  await prisma.workoutProgram.delete({ where: { id } });
  revalidatePath("/programs");
  revalidatePath("/overview");
  return { ok: true };
}
