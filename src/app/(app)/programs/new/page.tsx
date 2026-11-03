import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ProgramEditor } from "../program-editor";
import type { PickerExercise } from "@/lib/workout-types";

export const metadata = { title: "Program Baru" };

export default async function NewProgramPage() {
  const user = await requireUser();
  const rows = await prisma.exercise.findMany({
    where: { OR: [{ isSystem: true }, { createdById: user.id }] },
    select: { id: true, name: true, primaryMuscle: true, equipment: true, type: true, difficulty: true, isSystem: true },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
  const exercises: PickerExercise[] = rows.map((e) => ({
    id: e.id,
    name: e.name,
    primaryMuscle: e.primaryMuscle,
    equipment: e.equipment,
    type: e.type,
    difficulty: e.difficulty,
    isSystem: e.isSystem,
  }));

  return (
    <>
      <PageHeader
        title="Program Custom"
        description="Susun hari latihan dan daftar latihannya. Target set, repetisi, beban, dan istirahat bisa diatur per latihan."
        actions={
          <Link href="/programs" className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition">
            <ArrowLeft size={13} /> Kembali
          </Link>
        }
      />
      <ProgramEditor exercises={exercises} />
    </>
  );
}
