"use client";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function WeeklyActivity({ sessions }: { sessions: string[] }) {
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // 0 = Senin

  const counts = Array(7).fill(0) as number[];
  for (const s of sessions) {
    const d = new Date(s);
    const diffDays = Math.floor(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
        864e5
    );
    const idx = dayIdx - diffDays;
    if (idx >= 0 && idx < 7) counts[idx] += 1;
  }
  const max = Math.max(1, ...counts);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-32 items-end justify-between gap-2">
        {counts.map((c, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] tabular-nums text-muted-2">{c > 0 ? c : ""}</span>
            <div
              className={`w-full rounded-md transition-all ${
                c > 0 ? "bg-accent" : "bg-surface-3"
              }`}
              style={{ height: `${c > 0 ? Math.max(12, (c / max) * 100) : 6}%` }}
              title={`${DAYS[i]}: ${c} sesi`}
            />
            <span
              className={`text-[10px] ${i === dayIdx ? "font-bold text-accent" : "text-muted-2"}`}
            >
              {DAYS[i]}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-surface-2 px-4 py-3 text-center">
        <p className="text-lg font-bold tabular-nums">
          {counts.reduce((a, b) => a + b, 0)}{" "}
          <span className="text-xs font-normal text-muted">sesi / 7 hari</span>
        </p>
      </div>
    </div>
  );
}
