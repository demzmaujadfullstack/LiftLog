import Link from "next/link";
import { Plus, Dumbbell, ArrowRight, Clock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, formatDate, formatDateTime, MUSCLE_LABELS } from "@/lib/utils";

export const metadata = { title: "Workout" };

export default async function WorkoutHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number(sp.page ?? 1));
  const perPage = 15;

  const where = {
    userId: user.id,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { exercises: { some: { exercise: { name: { contains: q, mode: "insensitive" as const } } } } },
          ],
        }
      : {}),
  };

  const [total, sessions] = await Promise.all([
    prisma.workoutSession.count({ where }),
    prisma.workoutSession.findMany({
      where,
      orderBy: { performedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        exercises: {
          include: { exercise: { select: { name: true, primaryMuscle: true } } },
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Riwayat Workout"
        description={`${total} sesi tercatat.`}
        actions={
          <Link
            href="/workout/new"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black hover:bg-accent-strong transition active:scale-[0.98]"
          >
            <Plus size={16} /> Workout Baru
          </Link>
        }
      />

      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cari judul atau latihan..."
          className="h-10 w-full rounded-xl border border-line bg-surface-2 px-4 text-sm placeholder:text-muted-2 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </form>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={22} />}
          title={q ? `Tidak ada hasil untuk "${q}"` : "Belum ada workout"}
          description={
            q
              ? "Coba kata kunci lain."
              : "Mulai sesi pertama Anda — catat setiap set, rep, dan beban."
          }
          action={
            !q ? (
              <Link
                href="/workout/new"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-black hover:bg-accent-strong transition"
              >
                <Plus size={14} /> Mulai Workout
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s) => {
            const muscles = Array.from(
              new Set(s.exercises.map((e) => e.exercise.primaryMuscle))
            ).slice(0, 3);
            return (
              <Link key={s.id} href={`/workout/${s.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent/30">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Dumbbell size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{s.title}</p>
                      {!s.completedAt && <Badge variant="warning">Draft</Badge>}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-2">
                      <span>{s.completedAt ? formatDateTime(s.performedAt) : formatDate(s.performedAt)}</span>
                      {s.durationMinutes != null && (
                        <span className="flex items-center gap-0.5">
                          <Clock size={10} /> {s.durationMinutes} mnt
                        </span>
                      )}
                      <span>{s.exercises.length} latihan</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {muscles.map((m) => (
                        <Badge key={m}>{MUSCLE_LABELS[m] ?? m}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-accent">
                      {formatNumber(s.totalVolumeKg)}
                    </p>
                    <p className="text-[10px] text-muted-2">kg volume</p>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-muted-2" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/workout?q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="h-9 rounded-xl border border-line px-4 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition leading-9"
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-xs text-muted-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/workout?q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="h-9 rounded-xl border border-line px-4 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition leading-9"
            >
              Berikutnya →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
