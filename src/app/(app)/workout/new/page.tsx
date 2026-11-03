import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WorkoutBuilder } from "@/components/workout/workout-builder";
import { formatDate } from "@/lib/utils";
import type { PickerExercise, PreviousPerformance } from "@/lib/workout-types";

export const metadata = { title: "Workout Baru" };

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const user = await requireUser();
  const { day } = await searchParams;

  const programDay = day
    ? await prisma.workoutDay.findFirst({
        where: { id: day, program: { userId: user.id } },
        include: {
          program: { select: { name: true } },
          exercises: {
            include: { exercise: { select: { id: true, name: true } } },
            orderBy: { order: "asc" },
          },
        },
      })
    : null;

  const [exerciseRows, recentSessions] = await Promise.all([
    prisma.exercise.findMany({
      where: { OR: [{ isSystem: true }, { createdById: user.id }] },
      select: { id: true, name: true, primaryMuscle: true, equipment: true, type: true, difficulty: true, isSystem: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.workoutSession.findMany({
      where: { userId: user.id },
      orderBy: { performedAt: "desc" },
      take: 20,
      include: {
        exercises: {
          include: {
            sets: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  const previousPerformance: Record<string, PreviousPerformance> = {};
  for (const session of recentSessions) {
    for (const ex of session.exercises) {
      if (previousPerformance[ex.exerciseId]) continue;
      previousPerformance[ex.exerciseId] = {
        date: formatDate(session.performedAt),
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          rpe: s.rpe,
        })),
      };
    }
  }

  const exercises: PickerExercise[] = exerciseRows.map((e) => ({
    id: e.id,
    name: e.name,
    primaryMuscle: e.primaryMuscle,
    equipment: e.equipment,
    type: e.type,
    difficulty: e.difficulty,
    isSystem: e.isSystem,
  }));

  return (
    <WorkoutBuilder
      exercises={exercises}
      previousPerformance={previousPerformance}
      programDayId={programDay?.id}
      dayName={programDay ? `${programDay.name} — ${programDay.program.name}` : undefined}

    />
  );
}
