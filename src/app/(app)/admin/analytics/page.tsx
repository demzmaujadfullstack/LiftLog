import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Activity, BarChart3, Layers, Target } from "lucide-react";
import { formatNumber, MUSCLE_LABELS } from "@/lib/utils";
import { nowMs } from "@/lib/now";

export const metadata = { title: "Admin — Analitik" };

const DAY = 86_400_000;

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const now = await nowMs();
  const start8w = new Date(now - 8 * 7 * DAY);
  const start30d = new Date(now - 30 * DAY);

  const [sessions, placementCounts] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { performedAt: { gte: start8w } },
      select: { performedAt: true, totalVolumeKg: true, programDayId: true },
    }),
    prisma.workoutExercise.groupBy({
      by: ["exerciseId"],
      where: { session: { performedAt: { gte: start30d } } },
      _count: { _all: true },
    }),
  ]);

  // Bucket mingguan (8 baris, minggu berjalan paling kanan).
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * DAY; // tidak tepat tapi cukup untuk tampilan admin
    return { label: `M${i + 1}`, start: end - 7 * DAY, end, count: 0, volume: 0 };
  });
  // Hitung ulang batas minggu secara deterministic dari Senin terakhir.
  const mondayOf = (t: number) => {
    const d = new Date(t);
    const dow = (d.getDay() + 6) % 7;
    d.setHours(0, 0, 0, 0);
    return d.getTime() - dow * DAY;
  };
  const thisMonday = mondayOf(now);
  weeks.forEach((w, i) => {
    w.end = thisMonday - (7 - i - 1) * 7 * DAY + 7 * DAY;
    w.start = w.end - 7 * DAY;
    w.label = new Date(w.start).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  });
  for (const s of sessions) {
    const t = s.performedAt.getTime();
    const bucket = weeks.find((w) => t >= w.start && t < w.end);
    if (bucket) {
      bucket.count += 1;
      bucket.volume += s.totalVolumeKg;
    }
  }

  const totalWeekVolume = weeks.reduce((a, w) => a + w.volume, 0);
  const maxWeekVolume = Math.max(1, ...weeks.map((w) => w.volume));
  const programLinked = sessions.filter((s) => s.programDayId).length;
  const adherence = sessions.length > 0 ? Math.round((programLinked / sessions.length) * 100) : 0;

  // Distribusi kelompok otot 30 hari (berdasarkan jumlah latihan yang dicatat).
  const exerciseIds = placementCounts.map((p) => p.exerciseId);
  const exerciseMeta = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true, primaryMuscle: true },
  });
  const metaById = new Map(exerciseMeta.map((e) => [e.id, e]));
  const muscleCounts = new Map<string, number>();
  for (const p of placementCounts) {
    const muscle = metaById.get(p.exerciseId)?.primaryMuscle ?? "OTHER";
    muscleCounts.set(muscle, (muscleCounts.get(muscle) ?? 0) + p._count._all);
  }
  const muscleRows = [...muscleCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxMuscle = Math.max(1, ...muscleRows.map(([, v]) => v));

  const topExercises = [...placementCounts]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((p) => ({ name: metaById.get(p.exerciseId)?.name ?? "—", count: p._count._all }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analitik Platform"
        description="Agregat lintas pengguna. Data privat individual tidak ditampilkan."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sesi 8 Minggu" value={formatNumber(sessions.length)} icon={Activity} />
        <StatCard
          label="Volume 8 Minggu"
          value={`${formatNumber(Math.round(totalWeekVolume))} kg`}
          icon={BarChart3}
        />
        <StatCard
          label="Sesi 30 Hari"
          value={formatNumber(
            sessions.filter((s) => s.performedAt.getTime() >= start30d.getTime()).length
          )}
          icon={Layers}
        />
        <StatCard label="Ikut Program" value={`${adherence}%`} icon={Target} sub="dari sesi 8 minggu" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Volume Latihan per Minggu</h2>
          <div className="flex h-36 items-end gap-2">
            {weeks.map((w) => (
              <div
                key={w.label}
                className="group flex flex-1 flex-col items-center justify-end gap-1"
                title={`${w.label}: ${formatNumber(Math.round(w.volume))} kg · ${w.count} sesi`}
              >
                <span className="text-[10px] tabular-nums text-muted-2 opacity-0 transition group-hover:opacity-100">
                  {w.count}
                </span>
                <div
                  className="w-full rounded-t-sm bg-accent/70 transition group-hover:bg-accent"
                  style={{ height: `${Math.max(2, (w.volume / maxWeekVolume) * 100)}%` }}
                />
                <span className="truncate text-[9px] text-muted-2">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Distribusi Kelompok Otot — 30 Hari</h2>
          {muscleRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">Belum ada data latihan.</p>
          ) : (
            <ul className="space-y-2.5">
              {muscleRows.map(([muscle, count]) => {
                const label =
                  MUSCLE_LABELS[muscle as keyof typeof MUSCLE_LABELS] ?? muscle;
                return (
                  <li key={muscle}>
                    <div className="mb-1 flex items-baseline justify-between text-[11px]">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="tabular-nums text-muted-2">{formatNumber(count)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / maxMuscle) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="mb-3 text-sm font-semibold">Latihan Terpopuler — 30 Hari</h2>
        {topExercises.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">Belum ada data latihan.</p>
        ) : (
          <ul className="divide-y divide-line">
            {topExercises.map((e, i) => (
              <li key={e.name + i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 text-[11px] font-bold text-muted">
                    {i + 1}
                  </span>
                  {e.name}
                </span>
                <span className="text-xs tabular-nums text-muted-2">
                  {formatNumber(e.count)} set catatan
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
