import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Clock, CalendarDays, Trophy } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteWorkoutButton } from "@/components/workout/delete-workout-button";
import { formatNumber, formatDateTime, MUSCLE_LABELS } from "@/lib/utils";

export const metadata = { title: "Detail Workout" };

export default async function WorkoutDetailPage({
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
          exercise: { select: { id: true, name: true, primaryMuscle: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session || session.userId !== user.id) notFound();

  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/workout"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:text-foreground hover:bg-surface-2 transition"
          aria-label="Kembali"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold tracking-tight">{session.title}</h1>
            {!session.completedAt && <Badge variant="warning">Draft</Badge>}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 text-[11px] text-muted-2">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> {formatDateTime(session.performedAt)}
            </span>
            {session.durationMinutes != null && (
              <span className="flex items-center gap-1">
                <Clock size={11} /> {session.durationMinutes} menit
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/workout/${session.id}/edit`}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-line px-3.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition"
          >
            <Pencil size={13} /> Edit
          </Link>
          <DeleteWorkoutButton id={session.id} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Volume</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-accent">
            {formatNumber(session.totalVolumeKg)}
          </p>
          <p className="text-[10px] text-muted-2">kg</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Latihan</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{session.exercises.length}</p>
          <p className="text-[10px] text-muted-2">gerakan</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Total Set</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{totalSets}</p>
          <p className="text-[10px] text-muted-2">set</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {session.exercises.map((ex) => {
          const best = ex.sets
            .filter((s) => !s.isWarmup)
            .reduce(
              (acc, s) => {
                const e1rm = s.weightKg * (1 + s.reps / 30);
                return e1rm > acc.e1rm ? { e1rm, set: s } : acc;
              },
              { e1rm: 0, set: null as (typeof ex.sets)[number] | null }
            );
          return (
            <Card key={ex.id} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ex.exercise.name}</p>
                  <p className="text-[11px] text-muted-2">
                    {MUSCLE_LABELS[ex.exercise.primaryMuscle]}
                  </p>
                </div>
                {best.set && best.set.reps > 0 && best.set.weightKg > 0 && (
                  <Badge variant="accent" title="Estimasi 1RM terbaik pada sesi ini (rumus Epley)">
                    <Trophy size={10} /> e1RM ~{formatNumber(best.e1rm, 1)} kg
                  </Badge>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="mb-1 grid grid-cols-[2.5rem_1fr_1fr_3rem_3rem] gap-2 text-[10px] uppercase tracking-wider text-muted-2">
                  <span>Set</span>
                  <span>Beban</span>
                  <span>Reps</span>
                  <span>RPE</span>
                  <span>Vol</span>
                </div>
                {ex.sets.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[2.5rem_1fr_1fr_3rem_3rem] items-center gap-2 rounded-lg py-1.5 text-sm tabular-nums odd:bg-surface-2/40"
                  >
                    <span className="px-2 text-xs font-semibold text-muted">
                      {s.setNumber}
                      {s.isWarmup && <span className="ml-1 text-[9px] text-warning">W</span>}
                    </span>
                    <span className="px-2">{s.isBodyweight ? "BW" : `${formatNumber(s.weightKg, 1)} kg`}</span>
                    <span className="px-2">{s.reps}</span>
                    <span className="px-2 text-muted">{s.rpe ?? "—"}</span>
                    <span className="px-2 text-xs text-muted-2">
                      {s.isWarmup || s.isBodyweight ? "—" : formatNumber(s.reps * s.weightKg)}
                    </span>
                  </div>
                ))}
                {ex.notes && (
                  <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                    {ex.notes}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {session.notes && (
        <Card className="mt-4 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-2">Catatan</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{session.notes}</p>
        </Card>
      )}
    </div>
  );
}
