import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteExerciseButton } from "@/components/exercises/delete-exercise-button";
import {
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  TYPE_LABELS,
  DIFFICULTY_LABELS,
  formatDate,
} from "@/lib/utils";

export const metadata = { title: "Detail Latihan" };

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    include: {
      personalRecords: { orderBy: { value: "desc" } },
    },
  });

  if (!exercise || (!exercise.isSystem && exercise.createdById !== user.id)) notFound();

  const isOwnedCustom = !exercise.isSystem && exercise.createdById === user.id;

  const history = await prisma.workoutExercise.findMany({
    where: {
      exerciseId: exercise.id,
      session: { userId: user.id },
    },
    orderBy: { session: { performedAt: "desc" } },
    take: 12,
    include: {
      session: { select: { id: true, performedAt: true, title: true } },
      sets: {
        where: { isWarmup: false },
        orderBy: { weightKg: "desc" },
        take: 1,
      },
    },
  });

  const bestE1rm = exercise.personalRecords.find((p) => p.type === "MAX_E1RM");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/exercises"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:text-foreground hover:bg-surface-2 transition"
          aria-label="Kembali"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">{exercise.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {exercise.isSystem ? (
              <Badge variant="accent">Latihan Sistem</Badge>
            ) : (
              <Badge variant="outline">Kustom</Badge>
            )}
            <Badge>{DIFFICULTY_LABELS[exercise.difficulty]}</Badge>
          </div>
        </div>
        {isOwnedCustom && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/exercises/${exercise.id}/edit`}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition"
            >
              <Pencil size={13} /> Edit
            </Link>
            <DeleteExerciseButton id={exercise.id} />
          </div>
        )}
      </div>

      {exercise.description && (
        <Card className="mb-4 p-5">
          <p className="text-sm leading-relaxed text-muted">{exercise.description}</p>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Otot Utama</p>
          <p className="mt-1 text-sm font-semibold">{MUSCLE_LABELS[exercise.primaryMuscle]}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Otot Pendukung</p>
          <p className="mt-1 text-sm font-semibold">
            {exercise.secondaryMuscles.length > 0
              ? exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(", ")
              : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Alat</p>
          <p className="mt-1 text-sm font-semibold">{EQUIPMENT_LABELS[exercise.equipment]}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Tipe</p>
          <p className="mt-1 text-sm font-semibold">{TYPE_LABELS[exercise.type]}</p>
        </Card>
      </div>

      {exercise.instructions && (
        <Card className="mb-4 p-5">
          <h2 className="mb-2 text-sm font-semibold">Cara Melakukan</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {exercise.instructions}
          </p>
        </Card>
      )}

      {bestE1rm && (
        <Card className="mb-4 border-accent/25 bg-accent-soft/30 p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent">
            🏆 Rekor Pribadi (estimasi)
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-3 text-center">
            {exercise.personalRecords.map((pr) => (
              <div key={pr.type} className="rounded-xl bg-surface px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-2">
                  {pr.type === "MAX_WEIGHT" ? "Berat Terberat" : pr.type === "MAX_REPS" ? "Reps Terbanyak" : "e1RM Tertinggi"}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums">
                  {pr.type === "MAX_REPS" ? `${pr.reps ?? pr.value}×` : `${pr.value.toFixed(1)}kg`}
                </p>
                <p className="text-[10px] text-muted-2">{formatDate(pr.achievedAt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Riwayat Anda</h2>
        {history.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">
            Anda belum pernah mencatat latihan ini.{" "}
            <Link href="/workout/new" className="text-accent hover:underline">
              Mulai workout
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((h) => (
              <Link
                key={h.id}
                href={`/workout/${h.session.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-2"
              >
                <span className="w-20 shrink-0 text-[11px] text-muted-2">
                  {formatDate(h.session.performedAt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">{h.session.title}</span>
                {h.sets[0] && (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-accent">
                    {h.sets[0].weightKg.toFixed(1)} kg × {h.sets[0].reps}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
