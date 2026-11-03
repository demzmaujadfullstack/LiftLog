import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Users, Dumbbell, Activity, UserX } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { nowMs } from "@/lib/now";

export const metadata = { title: "Admin — Ringkasan" };

function dayKey(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default async function AdminPage() {
  await requireAdmin();

  const now = await nowMs();
  const [totalUsers, newUsers7d, suspended, systemEx, customEx, sessions7d, activePrograms, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(now - 7 * 86_400_000) } } }),
      prisma.user.count({ where: { suspended: true } }),
      prisma.exercise.count({ where: { isSystem: true } }),
      prisma.exercise.count({ where: { isSystem: false } }),
      prisma.workoutSession.count({ where: { performedAt: { gte: new Date(now - 7 * 86_400_000) } } }),
      prisma.workoutProgram.count({ where: { isActive: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

  const signupLogs = await prisma.user.findMany({
    where: { createdAt: { gte: new Date(now - 14 * 86_400_000) } },
    select: { createdAt: true },
  });
  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    byDay.set(dayKey(new Date(now - i * 86_400_000)), 0);
  }
  for (const u of signupLogs) {
    const k = dayKey(u.createdAt);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const maxDay = Math.max(1, ...byDay.values());

  return (
    <>
      <PageHeader title="Ringkasan Platform" description="Statistik agregat LIFTLOG lintas seluruh pengguna." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pengguna" value={formatNumber(totalUsers)} icon={Users} sub={`+${newUsers7d} dalam 7 hari`} />
        <StatCard label="Ditangguhkan" value={formatNumber(suspended)} icon={UserX} />
        <StatCard label="Latihan" value={formatNumber(systemEx + customEx)} icon={Dumbbell} sub={`${systemEx} sistem · ${customEx} kustom`} />
        <StatCard label="Sesi 7 Hari" value={formatNumber(sessions7d)} icon={Activity} sub={`${activePrograms} program aktif`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Registrasi 14 Hari Terakhir</h2>
          <div className="flex h-32 items-end gap-1">
            {[...byDay.entries()].map(([k, v]) => (
              <div key={k} className="group flex flex-1 flex-col items-center gap-1" title={`${k}: ${v} pengguna baru`}>
                <div
                  className="w-full rounded-t-sm bg-accent/70 transition group-hover:bg-accent"
                  style={{ height: `${Math.max(2, (v / maxDay) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-2">
            <span>{[...byDay.keys()][0]}</span>
            <span>{[...byDay.keys()][13]}</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Pengguna Terbaru</h2>
          <ul className="divide-y divide-line">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{u.name ?? "(tanpa nama)"}</p>
                  <p className="truncate text-[11px] text-muted-2">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.role === "ADMIN" && (
                    <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">ADMIN</span>
                  )}
                  <span className="text-[11px] text-muted-2">
                    {u.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </li>
            ))}
            {recentUsers.length === 0 && <li className="py-6 text-center text-xs text-muted">Belum ada pengguna.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
