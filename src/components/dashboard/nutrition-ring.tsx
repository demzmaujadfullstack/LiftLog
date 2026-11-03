"use client";

import { Droplets } from "lucide-react";

function pct(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="text-[11px] tabular-nums text-muted-2">
          <span className="font-semibold text-foreground">{Math.round(value)}</span>/{Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct(value, target)}%`, background: color }} />
      </div>
    </div>
  );
}

export function NutritionRing({
  calories,
  protein,
  carbs,
  fat,
  water,
  targets,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  targets: { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; waterMl: number };
}) {
  const caloriePct = pct(calories, targets.caloriesKcal);
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#232328" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke="#bef264"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * Math.min(100, caloriePct)) / 100}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums">{Math.round(calories)}</span>
          <span className="text-[10px] text-muted-2">dari {Math.round(targets.caloriesKcal)} kkal</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-2.5">
        <MacroBar label="Protein" value={protein} target={targets.proteinG} unit="g" color="#bef264" />
        <MacroBar label="Karbohidrat" value={carbs} target={targets.carbsG} unit="g" color="#60a5fa" />
        <MacroBar label="Lemak" value={fat} target={targets.fatG} unit="g" color="#fbbf24" />
      </div>
      <div className="flex w-full items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
        <Droplets size={14} className="text-blue-400" />
        <span className="text-[11px] text-muted">
          Air: <span className="font-semibold text-foreground">{Math.round(water)} ml</span> / {Math.round(targets.waterMl)} ml
        </span>
        <span className="ml-auto text-[11px] font-semibold tabular-nums text-blue-400">
          {pct(water, targets.waterMl)}%
        </span>
      </div>
    </div>
  );
}
