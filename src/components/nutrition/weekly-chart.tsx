"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export type WeeklyNutritionPoint = { day: string; calories: number; protein: number };

export function WeeklyNutritionChart({ data, target }: { data: WeeklyNutritionPoint[]; target: number }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Asupan 7 Hari</h2>
        <span className="text-[11px] text-muted-2">target {Math.round(target)} kkal/hari</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={{ stroke: "#2a2a30" }} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            cursor={{ fill: "rgba(190,242,100,0.06)" }}
            contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a30", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v, name) => [
              `${Math.round(Number(v) || 0)} ${name === "calories" ? "kkal" : "g"}`,
              name === "calories" ? "Kalori" : "Protein",
            ]}
          />
          <Bar dataKey="calories" fill="#bef264" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
