import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WorkoutBuilder } from "@/components/workout/workout-builder";
import { formatDate } from "@/lib/utils";
import type { PickerExercise, PreviousPerformance } from "@/lib/workout-types";

export const metadata = { title: "Edit Workout" };

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: { select: { name: true, primaryMuscle: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session || session.userId !== user.id) notFound();

  const [exerciseRows, recentSessions] = await Promise.all([
    prisma.exercise.findMany({
      where: { OR: [{ isSystem: true }, { createdById: user.id }] },
      select: { id: true, name: true, primaryMuscle: true, equipment: true, type: true, difficulty: true, isSystem: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.workoutSession.findMany({
      where: { userId: user.id, id: { not: id } },
      orderBy: { performedAt: "desc" },
      take: 20,
      include: {
        exercises: { include: { sets: { orderBy: { setNumber: "asc" } } }, orderBy: { order: "asc" } },
      },
    }),
  ]);

  const previousPerformance: Record<string, PreviousPerformance> = {};
  for (const s of recentSessions) {
    for (const ex of s.exercises) {
      if (previousPerformance[ex.exerciseId]) continue;
      previousPerformance[ex.exerciseId] = {
        date: formatDate(s.performedAt),
        sets: ex.sets.map((st) => ({
          setNumber: st.setNumber,
          reps: st.reps,
          weightKg: st.weightKg,
          rpe: st.rpe,
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
      editing={{
        id: session.id,
        title: session.title,
        notes: session.notes,
        performedAt: toLocalInput(session.performedAt),
        durationMinutes: session.durationMinutes,
        completedAt: session.completedAt?.toISOString() ?? null,
        exercises: session.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.exercise.name,
          primaryMuscle: ex.exercise.primaryMuscle,
          notes: ex.notes,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            weightKg: s.weightKg,
            rpe: s.rpe,
            isWarmup: s.isWarmup,
            isBodyweight: s.isBodyweight,
          })),
        })),
      }}
    />
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
