import Link from "next/link";
import { Suspense } from "react";
import {
  Scale,
  Dumbbell,
  Flame,
  Trophy,
  CalendarDays,
  Target,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import {
  getOverviewStats,
  getRecentWorkouts,
  getLatestPRs,
  getWeightSeries,
  getWeeklyVolumeSeries,
} from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/now";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RangeFilter } from "@/components/range-filter";
import { WeightChart } from "@/components/charts/weight-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { WeeklyActivity } from "@/components/dashboard/weekly-activity";
import { NutritionRing } from "@/components/dashboard/nutrition-ring";
import { formatNumber, formatDate, startOfDay, endOfDay } from "@/lib/utils";

export const metadata = { title: "Overview" };

function parseRange(value: string | string[] | undefined): number | "all" {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "all") return "all";
  const n = Number(v);
  return [7, 30, 90, 365].includes(n) ? n : 30;
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const now = await nowMs();

  const [stats, recent, prs, weightSeries, volumeSeries, todayNutrition, nutritionTarget, activeGoals, weekSessions] =
    await Promise.all([
      getOverviewStats(user.id, range),
      getRecentWorkouts(user.id, 5),
      getLatestPRs(user.id, 5),
      getWeightSeries(user.id, range === "all" ? "all" : Math.max(range, 90)),
      getWeeklyVolumeSeries(user.id, 12),
      prisma.nutritionLog.findMany({
        where: { userId: user.id, date: { gte: startOfDay(new Date(now)), lte: endOfDay(new Date(now)) } },
      }),
      prisma.nutritionTarget.findUnique({ where: { userId: user.id } }),
      prisma.userGoal.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { deadline: "asc" },
        take: 4,
      }),
      prisma.workoutSession.findMany({
        where: { userId: user.id, performedAt: { gte: startOfDay(new Date(now - 6 * 864e5)) } },
        select: { performedAt: true },
      }),
    ]);

  const calories = todayNutrition.reduce((s, n) => s + n.caloriesKcal, 0);
  const protein = todayNutrition.reduce((s, n) => s + n.proteinG, 0);
  const carbs = todayNutrition.reduce((s, n) => s + n.carbsG, 0);
  const fat = todayNutrition.reduce((s, n) => s + n.fatG, 0);
  const water = todayNutrition.reduce((s, n) => s + n.waterMl, 0);

  const rangeLabel =
    range === "all" ? "semua waktu" : `${range} hari terakhir`;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]} 💪`}
        description={`Ringkasan performa Anda — ${rangeLabel}.`}
        actions={
          <Suspense>
            <RangeFilter />
          </Suspense>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Berat Badan"
          value={stats.currentWeightKg ? `${formatNumber(stats.currentWeightKg, 1)} kg` : "—"}
          sub={stats.currentWeightKg ? "terakhir tercatat" : "belum ada data"}
          icon={Scale}
        />
        <StatCard
          label="Workout Minggu Ini"
          value={String(stats.weekCount)}
          sub={`bulan ini: ${stats.monthCount}`}
          icon={CalendarDays}
        />
        <StatCard
          label="Total Volume"
          value={`${formatNumber(stats.totalVolumeKg / 1000, 1)}k kg`}
          sub={`${stats.sessionCount} sesi · ${rangeLabel}`}
          icon={BarChart3}
        />
        <StatCard
          label="Streak Mingguan"
          value={`${stats.streak} mgg`}
          sub={stats.streak > 0 ? "jaga konsistensi!" : "mulai minggu ini"}
          icon={Flame}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Volume Latihan Mingguan</CardTitle>
              <p className="mt-0.5 text-[11px] text-muted-2">12 minggu terakhir (kg)</p>
            </div>
            <Link href="/analytics" className="flex items-center gap-1 text-[11px] text-accent hover:underline">
              Detail <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            <VolumeChart data={volumeSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas 7 Hari</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyActivity
              sessions={weekSessions.map((s) => s.performedAt.toISOString())}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Progres Berat Badan</CardTitle>
            <Link href="/body-progress" className="text-[11px] text-accent hover:underline">
              Kelola
            </Link>
          </CardHeader>
          <CardContent>
            {weightSeries.length >= 2 ? (
              <WeightChart
                data={weightSeries.map((w) => ({
                  date: formatDate(w.date),
                  weightKg: w.weightKg,
                }))}
              />
            ) : (
              <EmptyState
                icon={<Scale size={20} />}
                title="Belum ada data berat badan"
                description="Catat berat badan Anda di menu Progress Tubuh untuk melihat grafik."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Nutrisi Hari Ini</CardTitle>
            <Link href="/nutrition" className="text-[11px] text-accent hover:underline">
              Kelola
            </Link>
          </CardHeader>
          <CardContent>
            <NutritionRing
              calories={calories}
              protein={protein}
              carbs={carbs}
              fat={fat}
              water={water}
              targets={{
                caloriesKcal: nutritionTarget?.caloriesKcal ?? 2200,
                proteinG: nutritionTarget?.proteinG ?? 140,
                carbsG: nutritionTarget?.carbsG ?? 250,
                fatG: nutritionTarget?.fatG ?? 70,
                waterMl: nutritionTarget?.waterMl ?? 2500,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Goals Aktif</CardTitle>
            <Link href="/goals" className="text-[11px] text-accent hover:underline">
              Kelola
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeGoals.length === 0 ? (
              <EmptyState
                icon={<Target size={20} />}
                title="Belum ada goal"
                description="Buat target berat badan atau angkatan untuk melacak progres."
              />
            ) : (
              activeGoals.map((g) => {
                const start = g.startValue ?? 0;
                const current = g.currentValue ?? start;
                const pct =
                  g.targetValue === start
                    ? 100
                    : Math.max(0, Math.min(100, ((current - start) / (g.targetValue - start)) * 100));
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{g.title}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Workout Terakhir</CardTitle>
            <Link href="/workout" className="text-[11px] text-accent hover:underline">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recent.length === 0 ? (
              <EmptyState
                icon={<Dumbbell size={20} />}
                title="Belum ada workout"
                description="Mulai sesi pertama Anda dan catat setiap set."
                action={
                  <Link
                    href="/workout/new"
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-black hover:bg-accent-strong transition"
                  >
                    Mulai Workout <ArrowRight size={13} />
                  </Link>
                }
              />
            ) : (
              recent.map((w) => (
                <Link
                  key={w.id}
                  href={`/workout/${w.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3 transition-colors hover:border-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{w.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-2">
                      {formatDate(w.performedAt)} · {w.exercises.length} latihan
                      {w.durationMinutes ? ` · ${w.durationMinutes} mnt` : ""}
                    </p>
                  </div>
                  <Badge variant="accent">{formatNumber(w.totalVolumeKg)} kg</Badge>
                  <ArrowRight size={14} className="text-muted-2" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Personal Record Terbaru</CardTitle>
            <Link href="/analytics" className="text-[11px] text-accent hover:underline">
              Analitik
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {prs.length === 0 ? (
              <EmptyState
                icon={<Trophy size={20} />}
                title="Belum ada PR"
                description="PR terdeteksi otomatis saat Anda menyelesaikan workout."
              />
            ) : (
              prs.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-4 py-3"
                >
                  <Trophy size={15} className="shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pr.exercise.name}</p>
                    <p className="text-[11px] text-muted-2">{formatDate(pr.achievedAt)}</p>
                  </div>
                  <Badge variant="accent">
                    {pr.type === "MAX_WEIGHT" && `${formatNumber(pr.weightKg ?? pr.value, 1)} kg`}
                    {pr.type === "MAX_REPS" && `${pr.reps ?? pr.value} reps`}
                    {pr.type === "MAX_E1RM" && `e1RM ${formatNumber(pr.value, 1)} kg`}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
