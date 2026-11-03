"use client";

import { cn, formatNumber } from "@/lib/utils";

export type MonthlyRow = {
  exerciseId: string;
  exerciseName: string;
  cells: (number | null)[];
};

export function MonthlyComparisonTable({ rows, months }: { rows: MonthlyRow[]; months: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-2">
            <th className="px-2 py-2 font-medium">Latihan</th>
            {months.map((m) => (
              <th key={m} className="px-2 py-2 text-right font-medium">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            let prev: number | null = null;
            return (
              <tr key={r.exerciseId} className="border-t border-line/40">
                <td className="max-w-32 truncate px-2 py-2 font-medium">{r.exerciseName}</td>
                {r.cells.map((c, i) => {
                  const delta = c != null && prev != null ? c - prev : null;
                  prev = c ?? prev;
                  return (
                    <td key={i} className="px-2 py-2 text-right tabular-nums">
                      {c == null ? (
                        <span className="text-muted-2">—</span>
                      ) : (
                        <span>
                          {formatNumber(c, 1)}
                          {delta != null && delta !== 0 && (
                            <span
                              className={cn(
                                "ml-1 text-[9px] font-semibold",
                                delta > 0 ? "text-success" : "text-danger"
                              )}
                            >
                              {delta > 0 ? "▲" : "▼"}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] text-muted-2">▲/▼ = perubahan e1RM vs bulan sebelumnya (estimasi, kg).</p>
    </div>
  );
}
