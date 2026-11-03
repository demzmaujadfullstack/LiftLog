"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

export type BodyPoint = {
  date: string;
  weightKg: number | null;
  heightCm: number | null;
  chestCm: number | null;
  waistCm: number | null;
  armCm: number | null;
  forearmCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  bodyFatPercent: number | null;
};

const METRICS: { key: keyof BodyPoint; label: string; unit: string; color: string }[] = [
  { key: "weightKg", label: "Berat", unit: "kg", color: "#bef264" },
  { key: "bodyFatPercent", label: "Body Fat", unit: "%", color: "#fbbf24" },
  { key: "chestCm", label: "Dada", unit: "cm", color: "#60a5fa" },
  { key: "waistCm", label: "Pinggang", unit: "cm", color: "#f87171" },
  { key: "armCm", label: "Lengan", unit: "cm", color: "#a78bfa" },
  { key: "forearmCm", label: "L. Bawah", unit: "cm", color: "#34d399" },
  { key: "thighCm", label: "Paha", unit: "cm", color: "#fb923c" },
  { key: "calfCm", label: "Betis", unit: "cm", color: "#22d3ee" },
];

export function BodyMetricsChart({ data }: { data: BodyPoint[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]>(METRICS[0]);

  const series = useMemo(
    () =>
      data
        .filter((d) => d[metric.key] != null)
        .map((d) => ({ date: d.date, value: d[metric.key] as number })),
    [data, metric]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
              metric.key === m.key
                ? "bg-accent text-black"
                : "bg-surface-2 text-muted hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {series.length === 0 ? (
        <p className="py-16 text-center text-xs text-muted">
          Belum ada data untuk {metric.label.toLowerCase()}.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={{ stroke: "#2a2a30" }} tickLine={false} minTickGap={32} />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={46}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a30", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(v) => [`${v} ${metric.unit}`, metric.label]}
            />
            <Line type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} dot={{ fill: metric.color, r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
