import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { SystemExerciseManager } from "./manager";

export const metadata = { title: "Admin — Latihan Sistem" };

export default async function AdminExercisesPage() {
  await requireAdmin();

  const [exercises, usage] = await Promise.all([
    prisma.exercise.findMany({
      where: { isSystem: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        type: true,
        difficulty: true,
      },
    }),
    prisma.workoutExercise.groupBy({
      by: ["exerciseId"],
      _count: { _all: true },
    }),
  ]);

  const countBy = new Map(usage.map((u) => [u.exerciseId, u._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Latihan Sistem"
        description={`${exercises.length} latihan bawaan. Jumlah pemakaian mencakup seluruh pengguna, tanpa detail privat.`}
      />
      <SystemExerciseManager
        rows={exercises.map((e) => ({ ...e, usageCount: countBy.get(e.id) ?? 0 }))}
      />
    </div>
  );
}
