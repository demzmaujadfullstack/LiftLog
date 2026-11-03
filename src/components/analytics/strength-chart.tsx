"use client";

import { useRouter } from "next/navigation";
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

export type StrengthPoint = { date: string; e1rm: number; weightKg: number; reps: number };

export function StrengthProgressionChart({
  exerciseName,
  data,
  exercises,
  selectedId,
}: {
  exerciseName: string;
  data: StrengthPoint[];
  exercises: { id: string; name: string; points: number }[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{exerciseName}</h2>
          <p className="mt-0.5 text-[11px] text-muted-2">
            Progresi estimasi 1RM per sesi · garis putus-putus = beban terbaik
          </p>
        </div>
        {data.length > 1 && (
          <DeltaBadge data={data} />
        )}
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {exercises.slice(0, 12).map((e) => (
          <button
            key={e.id}
            onClick={() => router.push(`/analytics?ex=${e.id}`)}
            className={cn(
              "whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
              e.id === selectedId
                ? "bg-accent text-black"
                : "bg-surface-2 text-muted hover:text-foreground"
            )}
          >
            {e.name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#2a2a30" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={{ stroke: "#2a2a30" }} tickLine={false} minTickGap={32} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} width={46} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#1a1a1e", border: "1px solid #2a2a30", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(v, name) => [
              `${formatNum(Number(v) || 0)} kg`,
              name === "e1rm" ? "e1RM (estimasi)" : "Beban terbaik",
            ]}
          />
          <Line type="monotone" dataKey="e1rm" stroke="#bef264" strokeWidth={2} dot={{ r: 2.5, fill: "#bef264" }} name="e1rm" />
          <Line type="monotone" dataKey="weightKg" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="weight" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatNum(n: number) {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function DeltaBadge({ data }: { data: StrengthPoint[] }) {
  const first = data[0].e1rm;
  const last = data[data.length - 1].e1rm;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;
  return (
    <span
      className={cn(
        "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold tabular-nums",
        pct >= 0 ? "bg-success/10 text-success" : "bg-danger-soft text-danger"
      )}
    >
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}
