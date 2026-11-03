import Link from "next/link";
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NutritionRing } from "@/components/dashboard/nutrition-ring";
import { WeeklyNutritionChart, type WeeklyNutritionPoint } from "@/components/nutrition/weekly-chart";
import { MEAL_LABELS, formatDateKey, formatNumber } from "@/lib/utils";
import { NutritionActions } from "./actions-bar";
import { DeleteNutritionItem } from "./delete-item";
import type { FoodOption } from "./food-picker-modal";

export const metadata = { title: "Nutrisi" };

const MEALS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

function shiftDate(key: string, days: number) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const { date: rawDate } = await searchParams;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(rawDate ?? "");
  const dayKey = valid ? rawDate! : formatDateKey(new Date());
  const dayStart = new Date(`${dayKey}T00:00:00`);
  const dayEnd = new Date(`${dayKey}T23:59:59.999`);
  const weekStart = new Date(dayStart.getTime() - 6 * 86_400_000);

  const [target, foods, logs, weekLogs, customFoods] = await Promise.all([
    prisma.nutritionTarget.findUnique({ where: { userId: user.id } }),
    prisma.foodItem.findMany({
      where: { OR: [{ isSystem: true }, { userId: user.id }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.nutritionLog.findMany({
      where: { userId: user.id, date: { gte: dayStart, lte: dayEnd } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.nutritionLog.findMany({
      where: { userId: user.id, date: { gte: weekStart, lte: dayEnd } },
    }),
    prisma.foodItem.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  const t = target ?? { caloriesKcal: 2200, proteinG: 140, carbsG: 250, fatG: 70, waterMl: 2500 };

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.caloriesKcal,
      protein: acc.protein + l.proteinG,
      carbs: acc.carbs + l.carbsG,
      fat: acc.fat + l.fatG,
      water: acc.water + l.waterMl,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 }
  );

  const weekMap = new Map<string, number>();
  for (const l of weekLogs) {
    if (l.caloriesKcal <= 0) continue;
    const k = formatDateKey(l.date);
    weekMap.set(k, (weekMap.get(k) ?? 0) + l.caloriesKcal);
  }
  const weekly: WeeklyNutritionPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86_400_000);
    const key = formatDateKey(d);
    return {
      day: d.toLocaleDateString("id-ID", { weekday: "short" }),
      calories: Math.round(weekMap.get(key) ?? 0),
      protein: 0,
    };
  });

  const foodOptions: FoodOption[] = foods.map((f) => ({
    id: f.id,
    name: f.name,
    brand: f.brand,
    caloriesKcal: f.caloriesKcal,
    proteinG: f.proteinG,
    carbsG: f.carbsG,
    fatG: f.fatG,
    servingSizeG: f.servingSizeG,
    isSystem: f.isSystem,
  }));

  const isToday = dayKey === formatDateKey(new Date());

  return (
    <>
      <PageHeader
        title="Nutrisi"
        description="Catat asupan harian dan jaga target kalori serta makronutrisi Anda."
        actions={
          <NutritionActions
            date={dayKey}
            foods={foodOptions}
            target={{
              caloriesKcal: t.caloriesKcal,
              proteinG: t.proteinG,
              carbsG: t.carbsG,
              fatG: t.fatG,
              waterMl: t.waterMl,
            }}
          />
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/nutrition?date=${shiftDate(dayKey, -1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-accent/40 hover:text-accent transition"
          aria-label="Hari sebelumnya"
        >
          <ChevronLeft size={15} />
        </Link>
        <span className="min-w-40 text-center text-sm font-semibold">
          {new Date(`${dayKey}T12:00:00`).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <Link
          href={`/nutrition?date=${shiftDate(dayKey, 1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-accent/40 hover:text-accent transition"
          aria-label="Hari berikutnya"
        >
          <ChevronRight size={15} />
        </Link>
        {!isToday && (
          <Link href="/nutrition" className="ml-2 text-xs font-medium text-accent hover:underline">
            Ke hari ini
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Ringkasan Hari Ini</h2>
          <NutritionRing
            calories={totals.calories}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            water={totals.water}
            targets={t}
          />
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-5">
          <WeeklyNutritionChart data={weekly} target={t.caloriesKcal} />

          <Card className="p-0 overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<UtensilsCrossed size={24} />}
                  title="Belum ada yang dicatat"
                  description="Gunakan tombol Catat Makanan untuk mengisi asupan hari ini. Data tersimpan juga saat offline."
                />
              </div>
            ) : (
              <div className="divide-y divide-line">
                {MEALS.map((meal) => {
                  const rows = logs.filter((l) => l.meal === meal && l.caloriesKcal > 0 && l.waterMl === 0);
                  if (rows.length === 0) return null;
                  const mealCal = rows.reduce((n, l) => n + l.caloriesKcal, 0);
                  return (
                    <div key={meal} className="px-5 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                          {MEAL_LABELS[meal]}
                        </h3>
                        <span className="text-xs tabular-nums text-muted-2">{Math.round(mealCal)} kkal</span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {rows.map((l) => (
                          <li key={l.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">{l.name}</p>
                              <p className="text-[11px] text-muted-2">
                                P {formatNumber(Math.round(l.proteinG))} g · KH {formatNumber(Math.round(l.carbsG))} g · L{" "}
                                {formatNumber(Math.round(l.fatG))} g
                                {l.servings !== 1 ? ` · ${formatNumber(l.servings)} porsi` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm tabular-nums font-medium">{Math.round(l.caloriesKcal)}</span>
                            <DeleteNutritionItem kind="log" id={l.id} label={l.name} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {(() => {
                  const waterRows = logs.filter((l) => l.waterMl > 0);
                  if (waterRows.length === 0) return null;
                  const total = waterRows.reduce((n, l) => n + l.waterMl, 0);
                  return (
                    <div className="px-5 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Air</h3>
                        <span className="text-xs tabular-nums text-muted-2">{formatNumber(total)} ml</span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {waterRows.map((l) => (
                          <li key={l.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2 transition">
                            <span className="flex-1 text-sm text-muted">{l.name}</span>
                            <span className="text-sm tabular-nums">{formatNumber(l.waterMl)} ml</span>
                            <DeleteNutritionItem kind="log" id={l.id} label="catatan air" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            )}
          </Card>

          {customFoods.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold">Makanan Kustom Anda</h2>
              <ul className="flex flex-wrap gap-2">
                {customFoods.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 py-1 pl-2.5 pr-1.5"
                  >
                    <span className="text-xs">{f.name}</span>
                    <Badge variant="outline">{Math.round(f.caloriesKcal)} kkal</Badge>
                    <DeleteNutritionItem kind="food" id={f.id} label={f.name} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
