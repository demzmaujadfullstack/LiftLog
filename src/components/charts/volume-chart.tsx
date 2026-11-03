"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

export type VolumePoint = { label: string; volume: number; sessions?: number };

export function VolumeChart({ data, color = "#bef264" }: { data: VolumePoint[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 10 }}
          axisLine={{ stroke: "#2a2a30" }}
          tickLine={false}
          minTickGap={16}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <Tooltip
          cursor={{ fill: "rgba(190,242,100,0.05)" }}
          contentStyle={{
            background: "#1a1a1e",
            border: "1px solid #2a2a30",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#a1a1aa" }}
          formatter={(value) => [`${Number(value).toLocaleString("id-ID")} kg`, "Volume"]}
        />
        <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.volume > 0 ? color : "#232328"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
