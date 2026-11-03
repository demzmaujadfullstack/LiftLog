import Link from "next/link";
import { Trophy, Dumbbell, CalendarPlus2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StrengthProgressionChart, type StrengthPoint } from "@/components/analytics/strength-chart";
import { MonthlyComparisonTable, type MonthlyRow } from "@/components/analytics/monthly-table";
import { estimate1RM, formatDate, formatNumber, MUSCLE_LABELS } from "@/lib/utils";

export const metadata = { title: "Analitik Kekuatan" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const [records, sessions] = await Promise.all([
    prisma.personalRecord.findMany({
      where: { userId: user.id },
      include: { exercise: { select: { id: true, name: true, primaryMuscle: true } } },
      orderBy: { achievedAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: { userId: user.id },
      orderBy: { performedAt: "asc" },
      include: {
        exercises: {
          include: {
            exercise: { select: { id: true, name: true } },
            sets: { where: { isWarmup: false } },
          },
        },
      },
    }),
  ]);

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Analitik Kekuatan" description="Progresi beban, estimasi 1RM, dan rekor pribadi Anda." />
        <EmptyState
          icon={<Dumbbell size={22} />}
          title="Belum ada data"
          description="Analitik akan muncul setelah Anda menyimpan beberapa sesi workout."
          action={
            <Link
              href="/workout/new"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-xs font-semibold text-black hover:bg-accent-strong transition"
            >
              <CalendarPlus2 size={14} /> Mulai Workout
            </Link>
          }
        />
      </div>
    );
  }

  // ringkas sesi → best set per exercise (e1RM tertinggi) per sesi
  type ExSummary = { id: string; name: string; series: StrengthPoint[]; points: number };
  const byExercise = new Map<string, ExSummary>();
  const monthly = new Map<string, Map<string, number>>(); // bulan → exerciseId → e1RM

  for (const s of sessions) {
    const monthKey = s.performedAt.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    for (const we of s.exercises) {
      const working = we.sets.filter((st) => st.reps > 0 && !st.isBodyweight);
      if (working.length === 0) continue;
      const best = working.reduce((a, b) => {
        const ea = estimate1RM(a.weightKg, a.reps);
        const eb = estimate1RM(b.weightKg, b.reps);
        return eb > ea ? b : a;
      });
      const e1rm = estimate1RM(best.weightKg, best.reps);

      let ex = byExercise.get(we.exercise.id);
      if (!ex) {
        ex = { id: we.exercise.id, name: we.exercise.name, series: [], points: 0 };
        byExercise.set(we.exercise.id, ex);
      }
      ex.series.push({ date: formatDate(s.performedAt), e1rm, weightKg: best.weightKg, reps: best.reps });
      ex.points += 1;

      if (!monthly.has(monthKey)) monthly.set(monthKey, new Map());
      const mm = monthly.get(monthKey)!;
      if (!mm.has(we.exercise.id) || (mm.get(we.exercise.id) ?? 0) < e1rm) mm.set(we.exercise.id, e1rm);
    }
  }

  const exerciseList = Array.from(byExercise.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 30);

  const selectedId = sp.ex && byExercise.has(sp.ex) ? sp.ex : exerciseList[0]?.id;
  const selected = selectedId ? byExercise.get(selectedId) : undefined;

  const monthKeys = Array.from(monthly.keys());
  const topExerciseIds = exerciseList.slice(0, 6).map((e) => e.id);
  const monthlyRows: MonthlyRow[] = topExerciseIds.map((eid) => {
    const ex = byExercise.get(eid)!;
    const cells = monthKeys.map((m) => monthly.get(m)?.get(eid) ?? null);
    return { exerciseId: eid, exerciseName: ex.name, cells };
  });

  const maxWeightPRs = records.filter((r) => r.type === "MAX_WEIGHT").slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Analitik Kekuatan"
        description="Estimasi 1RM memakai rumus Epley — nilai estimasi, bukan hasil tes maksimal sungguhan."
      />

      {selected && exerciseList.length > 0 && (
        <Card className="mb-4 p-5">
          <StrengthProgressionChart
            exerciseName={selected.name}
            data={selected.series}
            exercises={exerciseList.map((e) => ({ id: e.id, name: e.name, points: e.points }))}
            selectedId={selected.id}
          />
        </Card>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Trophy size={15} className="text-accent" /> Rekor Berat Terberat
          </h2>
          {maxWeightPRs.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">Belum ada PR tercatat.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {maxWeightPRs.map((pr) => (
                <Link
                  key={pr.id}
                  href={`/exercises/${pr.exercise.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{pr.exercise.name}</p>
                    <p className="text-[10px] text-muted-2">{MUSCLE_LABELS[pr.exercise.primaryMuscle]}</p>
                  </div>
                  <Badge variant="accent">{formatNumber(pr.weightKg ?? pr.value, 1)} kg</Badge>
                  <span className="w-20 text-right text-[10px] text-muted-2">{formatDate(pr.achievedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Perbandingan Bulanan (e1RM)</h2>
          {monthlyRows.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">Belum ada data bulanan.</p>
          ) : (
            <MonthlyComparisonTable rows={monthlyRows} months={monthKeys} />
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Total Latihan per Volume</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-muted-2">
                <th className="px-3 py-2 font-medium">Latihan</th>
                <th className="px-3 py-2 font-medium text-right">Sesi</th>
                <th className="px-3 py-2 font-medium text-right">e1RM Terbaik</th>
                <th className="px-3 py-2 font-medium text-right">Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {exerciseList.slice(0, 15).map((e) => {
                const bestPoint = e.series.reduce((a, b) => (b.e1rm > a.e1rm ? b : a), e.series[0]);
                const last = e.series[e.series.length - 1];
                return (
                  <tr key={e.id} className="border-b border-line/40 last:border-0">
                    <td className="px-3 py-2 text-xs font-medium">{e.name}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums text-muted">{e.points}</td>
                    <td className="px-3 py-2 text-right text-xs tabular-nums text-accent">
                      ~{formatNumber(bestPoint.e1rm, 1)} kg
                    </td>
                    <td className="px-3 py-2 text-right text-[10px] text-muted-2">{last.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
