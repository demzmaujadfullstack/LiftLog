"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { workoutSessionSchema } from "@/lib/validations";
import { estimate1RM, calcVolume } from "@/lib/utils";

export type WorkoutActionResult = { ok: boolean; id?: string; error?: string };

type ExerciseInput = {
  exerciseId: string;
  order: number;
  notes?: string | null;
  sets: {
    setNumber: number;
    reps: number;
    weightKg: number;
    rpe?: number | null;
    isWarmup: boolean;
    isBodyweight: boolean;
  }[];
};

async function verifyExerciseOwnership(userId: string, exerciseIds: string[]) {
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds }, OR: [{ isSystem: true }, { createdById: userId }] },
    select: { id: true },
  });
  const allowed = new Set(exercises.map((e) => e.id));
  return exerciseIds.every((id) => allowed.has(id));
}

async function detectAndUpdatePRs(
  userId: string,
  exerciseId: string,
  sets: { reps: number; weightKg: number; isWarmup: boolean }[],
  sessionId: string,
  achievedAt: Date
) {
  const working = sets.filter((s) => !s.isWarmup && s.reps > 0);
  if (working.length === 0) return;

  const maxWeight = Math.max(...working.map((s) => s.weightKg));
  const maxRepsSet = working.reduce((a, b) => (b.reps > a.reps ? b : a));
  const bestE1rmSet = working.reduce(
    (a, b) => (estimate1RM(b.weightKg, b.reps) > estimate1RM(a.weightKg, a.reps) ? b : a)
  );
  const bestE1rm = estimate1RM(bestE1rmSet.weightKg, bestE1rmSet.reps);

  const candidates: { type: "MAX_WEIGHT" | "MAX_REPS" | "MAX_E1RM"; value: number; weightKg?: number; reps?: number }[] = [
    { type: "MAX_WEIGHT", value: maxWeight, weightKg: maxWeight, reps: working.find((s) => s.weightKg === maxWeight)?.reps },
    { type: "MAX_REPS", value: maxRepsSet.reps, weightKg: maxRepsSet.weightKg, reps: maxRepsSet.reps },
    { type: "MAX_E1RM", value: bestE1rm, weightKg: bestE1rmSet.weightKg, reps: bestE1rmSet.reps },
  ];

  for (const c of candidates) {
    if (c.value <= 0) continue;
    const existing = await prisma.personalRecord.findUnique({
      where: { userId_exerciseId_type: { userId, exerciseId, type: c.type } },
    });
    if (!existing || c.value > existing.value) {
      await prisma.personalRecord.upsert({
        where: { userId_exerciseId_type: { userId, exerciseId, type: c.type } },
        update: { value: c.value, weightKg: c.weightKg, reps: c.reps, achievedAt, sessionId },
        create: {
          userId,
          exerciseId,
          type: c.type,
          value: c.value,
          weightKg: c.weightKg,
          reps: c.reps,
          achievedAt,
          sessionId,
        },
      });
    }
  }
}

export async function saveWorkoutAction(input: unknown): Promise<WorkoutActionResult> {
  const user = await requireUser();
  const parsed = workoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const ok = await verifyExerciseOwnership(
    user.id,
    data.exercises.map((e) => e.exerciseId)
  );
  if (!ok) return { ok: false, error: "Ada latihan yang tidak valid." };

  if (data.programDayId) {
    const day = await prisma.workoutDay.findFirst({
      where: { id: data.programDayId, program: { userId: user.id } },
      select: { id: true },
    });
    if (!day) return { ok: false, error: "Hari program tidak valid." };
  }

  // idempotency: tolak duplikat dari sync offline
  if (data.idempotencyKey) {
    const existing = await prisma.workoutSession.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== user.id) return { ok: false, error: "Key konflik." };
      return { ok: true, id: existing.id };
    }
  }

  const performedAt = new Date(data.performedAt);
  if (Number.isNaN(performedAt.getTime())) {
    return { ok: false, error: "Tanggal tidak valid." };
  }

  const totalVolume = data.exercises.reduce(
    (sum, ex) => sum + calcVolume(ex.sets.filter((s) => !s.isWarmup && !s.isBodyweight)),
    0
  );

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.workoutSession.create({
      data: {
        userId: user.id,
        title: data.title,
        notes: data.notes,
        performedAt,
        completedAt: data.completed ? new Date() : null,
        durationMinutes: data.durationMinutes,
        programDayId: data.programDayId,
        idempotencyKey: data.idempotencyKey,
        totalVolumeKg: totalVolume,
        exercises: {
          create: data.exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            order: ex.order ?? i,
            notes: ex.notes,
            sets: {
              create: ex.sets.map((s, j) => ({
                setNumber: s.setNumber ?? j + 1,
                reps: s.reps,
                weightKg: s.weightKg,
                rpe: s.rpe,
                isWarmup: s.isWarmup,
                isBodyweight: s.isBodyweight,
              })),
            },
          })),
        },
      },
    });
    return created;
  });

  for (const ex of data.exercises as ExerciseInput[]) {
    await detectAndUpdatePRs(user.id, ex.exerciseId, ex.sets, session.id, performedAt);
  }

  revalidatePath("/overview");
  revalidatePath("/workout");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
  return { ok: true, id: session.id };
}

export async function updateWorkoutAction(id: string, input: unknown): Promise<WorkoutActionResult> {
  const user = await requireUser();

  const existing = await prisma.workoutSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Workout tidak ditemukan." };
  }

  const parsed = workoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const data = parsed.data;

  const ok = await verifyExerciseOwnership(
    user.id,
    data.exercises.map((e) => e.exerciseId)
  );
  if (!ok) return { ok: false, error: "Ada latihan yang tidak valid." };

  if (data.programDayId) {
    const day = await prisma.workoutDay.findFirst({
      where: { id: data.programDayId, program: { userId: user.id } },
      select: { id: true },
    });
    if (!day) return { ok: false, error: "Hari program tidak valid." };
  }

  const performedAt = new Date(data.performedAt);
  const totalVolume = data.exercises.reduce(
    (sum, ex) => sum + calcVolume(ex.sets.filter((s) => !s.isWarmup && !s.isBodyweight)),
    0
  );

  await prisma.$transaction(async (tx) => {
    await tx.workoutSet.deleteMany({
      where: { workoutExercise: { sessionId: id } },
    });
    await tx.workoutExercise.deleteMany({ where: { sessionId: id } });
    await tx.workoutSession.update({
      where: { id },
      data: {
        title: data.title,
        notes: data.notes,
        performedAt,
        completedAt: data.completed ? new Date() : existing.completedAt,
        durationMinutes: data.durationMinutes,
        programDayId: data.programDayId,
        totalVolumeKg: totalVolume,
        exercises: {
          create: data.exercises.map((ex, i) => ({
            exerciseId: ex.exerciseId,
            order: ex.order ?? i,
            notes: ex.notes,
            sets: {
              create: ex.sets.map((s, j) => ({
                setNumber: s.setNumber ?? j + 1,
                reps: s.reps,
                weightKg: s.weightKg,
                rpe: s.rpe,
                isWarmup: s.isWarmup,
                isBodyweight: s.isBodyweight,
              })),
            },
          })),
        },
      },
    });
  });

  for (const ex of data.exercises as ExerciseInput[]) {
    await detectAndUpdatePRs(user.id, ex.exerciseId, ex.sets, id, performedAt);
  }

  revalidatePath("/overview");
  revalidatePath("/workout");
  revalidatePath(`/workout/${id}`);
  revalidatePath("/analytics");
  return { ok: true, id };
}

export async function deleteWorkoutAction(id: string): Promise<WorkoutActionResult> {
  const user = await requireUser();
  const existing = await prisma.workoutSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { ok: false, error: "Workout tidak ditemukan." };
  }
  await prisma.workoutSession.delete({ where: { id } });
  revalidatePath("/overview");
  revalidatePath("/workout");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
  return { ok: true };
}
