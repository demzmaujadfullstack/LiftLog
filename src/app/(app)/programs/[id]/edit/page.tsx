import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProgramEditor } from "../../program-editor";
import type { PickerExercise } from "@/lib/workout-types";

export const metadata = { title: "Edit Program" };

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [program, rows] = await Promise.all([
    prisma.workoutProgram.findFirst({
      where: { id, userId: user.id },
      include: {
        days: {
          orderBy: { dayIndex: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
              include: { exercise: { select: { id: true, name: true, primaryMuscle: true } } },
            },
          },
        },
      },
    }),
    prisma.exercise.findMany({
      where: { OR: [{ isSystem: true }, { createdById: user.id }] },
      select: { id: true, name: true, primaryMuscle: true, equipment: true, type: true, difficulty: true, isSystem: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);
  if (!program) notFound();

  const exercises: PickerExercise[] = rows.map((e) => ({
    id: e.id,
    name: e.name,
    primaryMuscle: e.primaryMuscle,
    equipment: e.equipment,
    type: e.type,
    difficulty: e.difficulty,
    isSystem: e.isSystem,
  }));

  const initialDays = program.days.map((d) => ({
    name: d.name,
    exercises: d.exercises.map((pe) => ({
      exerciseId: pe.exerciseId,
      name: pe.exercise.name,
      primaryMuscle: pe.exercise.primaryMuscle,
      targetSets: pe.targetSets,
      targetRepsMin: pe.targetRepsMin,
      targetRepsMax: pe.targetRepsMax,
      targetWeightKg: pe.targetWeightKg,
      restSeconds: pe.restSeconds,
    })),
  }));

  return (
    <>
      <PageHeader
        title={`Edit — ${program.name}`}
        actions={
          <Link href={`/programs/${program.id}`} className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition">
            <ArrowLeft size={13} /> Kembali ke program
          </Link>
        }
      />
      <ProgramEditor
        programId={program.id}
        initialName={program.name}
        initialDescription={program.description ?? undefined}
        initialDays={initialDays}
        exercises={exercises}
      />
    </>
  );
}
