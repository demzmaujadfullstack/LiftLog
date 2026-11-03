import "server-only";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, daysAgo } from "@/lib/utils";

export async function getOverviewStats(userId: string, rangeDays: number | "all") {
  const since = rangeDays === "all" ? new Date(0) : daysAgo(rangeDays);

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weekCount, monthCount, totalVolumeAgg, sessionCount, latestWeight, streak] =
    await Promise.all([
      prisma.workoutSession.count({ where: { userId, performedAt: { gte: weekStart } } }),
      prisma.workoutSession.count({ where: { userId, performedAt: { gte: monthStart } } }),
      prisma.workoutSession.aggregate({
        where: { userId, performedAt: { gte: since } },
        _sum: { totalVolumeKg: true },
      }),
      prisma.workoutSession.count({ where: { userId, performedAt: { gte: since } } }),
      prisma.bodyMeasurement.findFirst({
        where: { userId, weightKg: { not: null } },
        orderBy: { date: "desc" },
      }),
      computeStreak(userId),
    ]);

  return {
    weekCount,
    monthCount,
    totalVolumeKg: totalVolumeAgg._sum.totalVolumeKg ?? 0,
    sessionCount,
    currentWeightKg: latestWeight?.weightKg ?? null,
    streak,
  };
}

/** Streak = jumlah minggu berturut-turut (termasuk minggu ini) yang punya ≥1 sesi latihan. */
export async function computeStreak(userId: string): Promise<number> {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    select: { performedAt: true },
    orderBy: { performedAt: "desc" },
    take: 400,
  });
  if (sessions.length === 0) return 0;

  const weeks = new Set(sessions.map((s) => startOfWeek(s.performedAt).getTime()));
  let streak = 0;
  const cursor = startOfWeek(new Date());

  // minggu ini belum latihan tidak memutus streak
  if (!weeks.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 7);
  }
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export async function getRecentWorkouts(userId: string, take = 5) {
  return prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    take,
    include: {
      exercises: {
        include: { exercise: { select: { name: true, primaryMuscle: true } } },
        take: 8,
      },
    },
  });
}

export async function getLatestPRs(userId: string, take = 5) {
  return prisma.personalRecord.findMany({
    where: { userId },
    orderBy: { achievedAt: "desc" },
    take,
    include: { exercise: { select: { name: true } } },
  });
}

export async function getWeightSeries(userId: string, rangeDays: number | "all") {
  const since = rangeDays === "all" ? new Date(0) : daysAgo(rangeDays);
  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId, date: { gte: since }, weightKg: { not: null } },
    orderBy: { date: "asc" },
    select: { date: true, weightKg: true },
  });
  return rows.map((r) => ({ date: r.date, weightKg: r.weightKg as number }));
}

/** Volume latihan per minggu untuk rentang tertentu. */
export async function getWeeklyVolumeSeries(userId: string, weeks = 12) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - weeks * 7);

  const sessions = await prisma.workoutSession.findMany({
    where: { userId, performedAt: { gte: since } },
    select: { performedAt: true, totalVolumeKg: true },
    orderBy: { performedAt: "asc" },
  });

  const buckets = new Map<number, { label: string; volume: number; sessions: number }>();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const ws = startOfWeek(d).getTime();
    if (!buckets.has(ws)) {
      buckets.set(ws, {
        label: startOfWeek(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        volume: 0,
        sessions: 0,
      });
    }
  }
  for (const s of sessions) {
    const key = startOfWeek(s.performedAt).getTime();
    const b = buckets.get(key);
    if (b) {
      b.volume += s.totalVolumeKg;
      b.sessions += 1;
    }
  }
  return Array.from(buckets.values());
}

/** Aktivitas harian (jumlah sesi) untuk heatmap/kalender. */
export async function getDailyActivity(userId: string, days = 90) {
  const since = daysAgo(days);
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, performedAt: { gte: since } },
    select: { performedAt: true },
  });
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = startOfDay(s.performedAt).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
