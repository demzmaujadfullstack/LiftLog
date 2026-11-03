import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeStreak } from "@/lib/stats";
import {
  cn,
  formatDateKey,
  formatNumber,
  startOfWeek,
  MUSCLE_LABELS,
} from "@/lib/utils";

export const metadata = { title: "Kalender" };

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function monthKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyOf(d);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const view = sp.view === "week" ? "week" : "month";

  const today = new Date();
  const rawMonth = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : monthKeyOf(today);
  const [year, month] = rawMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [sessions, streak] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        userId: user.id,
        performedAt: { gte: monthStart, lte: monthEnd },
      },
      include: {
        exercises: { include: { exercise: { select: { primaryMuscle: true } } } },
      },
      orderBy: { performedAt: "asc" },
    }),
    computeStreak(user.id),
  ]);

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = formatDateKey(s.performedAt);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }

  const monthlyVolume = sessions.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  const monthLabel = monthStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  // grid bulan (Senin pertama dari minggu yang memuat tanggal 1)
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weekStart = startOfWeek(today);
  const todayKey = formatDateKey(today);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Kalender Aktivitas"
        description={`${sessions.length} sesi · ${formatNumber(monthlyVolume)} kg volume di ${monthLabel}.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?view=${view === "month" ? "week" : "month"}&month=${rawMonth}`}
              className="flex h-10 items-center rounded-xl border border-line px-3.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition"
            >
              {view === "month" ? "Mode Minggu" : "Mode Bulan"}
            </Link>
            <Link
              href="/workout/new"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black hover:bg-accent-strong transition active:scale-[0.98]"
            >
              <Plus size={16} /> Workout
            </Link>
          </div>
        }
      />

      <Card className="mb-4 flex items-center justify-between p-4">
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?view=${view}&month=${addMonth(rawMonth, -1)}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={17} />
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold capitalize">{monthLabel}</span>
          <Link
            href={`/calendar?view=${view}&month=${addMonth(rawMonth, 1)}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={17} />
          </Link>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5">
          <Flame size={14} className="text-accent" />
          <span className="text-xs font-semibold tabular-nums">{streak} minggu</span>
          <span className="text-[10px] text-muted-2">streak</span>
        </div>
      </Card>

      {view === "month" ? (
        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-2">
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square rounded-xl sm:aspect-auto sm:h-20" />;
              const key = formatDateKey(date);
              const daySessions = byDate.get(key) ?? [];
              const isToday = key === todayKey;
              const isPast = date < today && !isToday;
              const muscles = Array.from(
                new Set(daySessions.flatMap((s) => s.exercises.map((e) => e.exercise.primaryMuscle)))
              ).slice(0, 2);
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex h-16 flex-col rounded-xl border p-1.5 sm:h-24",
                    daySessions.length > 0
                      ? "border-accent/30 bg-accent-soft"
                      : isPast
                        ? "border-line bg-surface-2/30"
                        : "border-line bg-transparent",
                    isToday && "ring-1 ring-accent"
                  )}
                  title={
                    daySessions.length > 0
                      ? daySessions.map((s) => `${s.title}: ${formatNumber(s.totalVolumeKg)} kg`).join("\n")
                      : isPast
                        ? "Hari istirahat"
                        : ""
                  }
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold tabular-nums sm:text-xs",
                      daySessions.length > 0 ? "text-accent" : isToday ? "text-accent" : "text-muted-2"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {daySessions.length > 0 ? (
                    <div className="mt-auto flex flex-col gap-0.5 overflow-hidden">
                      {daySessions.slice(0, 2).map((s) => (
                        <Link
                          key={s.id}
                          href={`/workout/${s.id}`}
                          className="truncate rounded bg-accent/20 px-1 py-0.5 text-[9px] font-medium leading-tight text-foreground transition hover:bg-accent/30 sm:text-[10px]"
                        >
                          {s.title}
                        </Link>
                      ))}
                      {daySessions.length > 2 && (
                        <span className="px-1 text-[9px] text-muted-2">+{daySessions.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    isPast && <span className="mt-auto text-[9px] text-muted-2/60 sm:text-[10px]">istirahat</span>
                  )}
                  {muscles.length > 0 && daySessions.length > 0 && (
                    <span className="absolute right-1 top-1 hidden text-[8px] text-accent/70 lg:block">
                      {muscles.map((m) => MUSCLE_LABELS[m][0]).join("")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            const key = formatDateKey(d);
            const daySessions = byDate.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <Card key={i} className={cn("flex items-center gap-4 p-4", isToday && "ring-1 ring-accent")}>
                <div className="w-14 shrink-0 text-center">
                  <p className="text-[10px] uppercase text-muted-2">{DAY_LABELS[i]}</p>
                  <p className={cn("text-lg font-bold tabular-nums", isToday ? "text-accent" : "")}>{d.getDate()}</p>
                </div>
                {daySessions.length === 0 ? (
                  <p className="flex-1 text-xs text-muted-2">
                    {d <= today ? "Hari istirahat" : "Belum terjadwal"}
                  </p>
                ) : (
                  <div className="flex flex-1 flex-col gap-1.5">
                    {daySessions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/workout/${s.id}`}
                        className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 transition-colors hover:bg-surface-3"
                      >
                        <span className="flex-1 truncate text-xs font-medium">{s.title}</span>
                        <Badge variant="accent">{formatNumber(s.totalVolumeKg)} kg</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-2">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent-soft ring-1 ring-accent/30" /> Hari latihan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-surface-2/50 ring-1 ring-line" /> Istirahat / kosong
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-1 ring-accent" /> Hari ini
        </span>
      </div>
    </div>
  );
}
