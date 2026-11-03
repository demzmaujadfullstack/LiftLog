import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, ChevronRight, Flame, Pencil, Play } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { MUSCLE_LABELS, formatNumber, startOfWeek } from "@/lib/utils";
import { nowMs } from "@/lib/now";
import { ActivateProgramButton } from "../activate-button";

export const metadata = { title: "Detail Program" };

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const program = await prisma.workoutProgram.findFirst({
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
  });
  if (!program) notFound();

  const now = await nowMs();
  const since = program.createdAt.getTime() > now - 90 * 86_400_000 ? program.createdAt : undefined;
  const [sessionCount, recentVolume, weekSessions] = await Promise.all([
    prisma.workoutSession.count({
      where: { userId: user.id, programDay: { programId: program.id }, ...(since ? { performedAt: { gte: since } } : {}) },
    }),
    prisma.workoutSession.aggregate({
      where: { userId: user.id, programDay: { programId: program.id }, performedAt: { gte: new Date(now - 30 * 86_400_000) } },
      _sum: { totalVolumeKg: true },
    }),
    program.isActive
      ? prisma.workoutSession.findMany({
          where: {
            userId: user.id,
            programDay: { programId: program.id },
            performedAt: { gte: startOfWeek(new Date(now)) },
          },
          select: { programDayId: true },
        })
      : Promise.resolve([] as { programDayId: string | null }[]),
  ]);

  const doneDayIds = new Set(weekSessions.map((s) => s.programDayId));
  const adherencePct =
    program.isActive && program.days.length > 0
      ? Math.round((doneDayIds.size / program.days.length) * 100)
      : null;

  return (
    <>
      <PageHeader
        title={program.name}
        description={program.description ?? "Program latihan kustom Anda."}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/programs/${program.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil size={13} /> Edit Program
              </Button>
            </Link>
            {!program.isActive && <ActivateProgramButton id={program.id} name={program.name} />}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Sesi" value={formatNumber(sessionCount)} icon={CalendarCheck} sub="dari program ini" />
        <StatCard
          label="Volume 30 Hari"
          value={`${formatNumber(Math.round(recentVolume._sum.totalVolumeKg ?? 0))} kg`}
          icon={Flame}
        />
        <StatCard label="Hari Latihan" value={String(program.days.length)} />
        <StatCard
          label="Adherensi Minggu Ini"
          value={adherencePct == null ? "—" : `${adherencePct}%`}
          sub={adherencePct == null ? "aktifkan program untuk melacak" : `${doneDayIds.size}/${program.days.length} hari`}
        />
      </div>

      <div className="flex flex-col gap-4">
        {program.days.map((day, i) => (
          <Card key={day.id} className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/50 px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <h2 className="text-sm font-semibold">{day.name}</h2>
                {program.isActive && doneDayIds.has(day.id) && (
                  <Badge variant="success">Terlaksana minggu ini</Badge>
                )}
              </div>
              <Link
                href={`/workout/new?day=${day.id}`}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
              >
                <Play size={12} /> Mulai Hari Ini
                <ChevronRight size={12} />
              </Link>
            </div>
            {day.exercises.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-muted">
                Belum ada latihan di hari ini. Tambahkan lewat tombol Edit Program.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {day.exercises.map((pe) => (
                  <li key={pe.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/exercises/${pe.exercise.id}`}
                        className="truncate text-sm font-medium hover:text-accent transition"
                      >
                        {pe.exercise.name}
                      </Link>
                      <p className="text-[11px] text-muted">
                        {MUSCLE_LABELS[pe.exercise.primaryMuscle] ?? pe.exercise.primaryMuscle}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-xs tabular-nums text-muted">
                      {pe.targetSets} set ×{" "}
                      {pe.targetRepsMin != null
                        ? pe.targetRepsMax != null && pe.targetRepsMax !== pe.targetRepsMin
                          ? `${pe.targetRepsMin}–${pe.targetRepsMax}`
                          : pe.targetRepsMin
                        : "??"}{" "}
                      reps
                      {pe.targetWeightKg != null ? ` @ ${formatNumber(pe.targetWeightKg)} kg` : ""}
                      {pe.restSeconds != null ? (
                        <span className="text-muted-2"> · istirahat {pe.restSeconds}s</span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
        {program.days.length === 0 && (
          <Card className="px-5 py-8 text-center text-sm text-muted">
            Program ini belum punya hari latihan.{" "}
            <Link href={`/programs/${program.id}/edit`} className="font-medium text-accent hover:underline">
              Susun sekarang
            </Link>
          </Card>
        )}
      </div>
    </>
  );
}
