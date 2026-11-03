import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExerciseForm } from "@/components/exercises/exercise-form";

export const metadata = { title: "Edit Latihan" };

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise || exercise.isSystem || exercise.createdById !== user.id) notFound();

  return (
    <ExerciseForm
      exerciseId={exercise.id}
      initial={{
        name: exercise.name,
        description: exercise.description ?? "",
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        type: exercise.type,
        instructions: exercise.instructions ?? "",
        difficulty: exercise.difficulty,
      }}
    />
  );
}
