"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type WeightPoint = { date: string; weightKg: number };

export function WeightChart({ data }: { data: WeightPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={{ stroke: "#2a2a30" }}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "#1a1a1e",
            border: "1px solid #2a2a30",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [`${value} kg`, "Berat"]}
        />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="#bef264"
          strokeWidth={2}
          dot={{ fill: "#bef264", r: 2.5 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
