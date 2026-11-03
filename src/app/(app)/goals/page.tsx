import { Target } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/now";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard, type GoalCardData } from "./goal-card";
import { CreateGoalButton } from "./create-goal-button";
import type { GoalValues } from "./goal-form-modal";

export const metadata = { title: "Goals" };

function toCard(
  g: {
    id: string;
    title: string;
    type: string;
    status: string;
    startValue: number | null;
    targetValue: number;
    currentValue: number | null;
    unit: string | null;
    deadline: Date | null;
    exerciseId: string | null;
    exercise: { id: string; name: string } | null;
    milestones: { id: string; value: number; note: string | null; date: Date }[];
  },
  serverNow: number
): GoalCardData {
  const formValues: GoalValues = {
    id: g.id,
    title: g.title,
    type: g.type,
    exerciseId: g.exerciseId,
    startValue: g.startValue,
    targetValue: g.targetValue,
    currentValue: g.currentValue,
    unit: g.unit,
    deadline: g.deadline ? g.deadline.toISOString().slice(0, 10) : null,
  };
  return {
    id: g.id,
    title: g.title,
    type: g.type,
    status: g.status as GoalCardData["status"],
    startValue: g.startValue,
    targetValue: g.targetValue,
    currentValue: g.currentValue,
    unit: g.unit,
    deadline: g.deadline ? g.deadline.toISOString().slice(0, 10) : null,
    serverNow,
    exerciseName: g.exercise?.name ?? null,
    milestones: g.milestones
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((m) => ({
        id: m.id,
        value: m.value,
        note: m.note,
        date: m.date.toISOString(),
      })),
    formValues,
  };
}

export default async function GoalsPage() {
  const user = await requireUser();
  const serverNow = await nowMs();

  const [goals, exercises] = await Promise.all([
    prisma.userGoal.findMany({
      where: { userId: user.id },
      include: {
        exercise: { select: { id: true, name: true } },
        milestones: { orderBy: { date: "desc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.exercise.findMany({
      where: { OR: [{ isSystem: true }, { createdById: user.id }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status === "COMPLETED");
  const abandoned = goals.filter((g) => g.status === "ABANDONED");

  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));

  return (
    <>
      <PageHeader
        title="Goals"
        description="Tetapkan target, pantau kemajuan, dan rayakan pencapaian."
        actions={<CreateGoalButton exercises={exerciseOptions} />}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="Belum ada goal"
          description="Buat goal pertama Anda — misalnya bench press 100 kg, berat badan ideal, atau 4 kali latihan tiap minggu."
          action={
            <div className="pt-1">
              <CreateGoalButton exercises={exerciseOptions} />
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Aktif ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
                Tidak ada goal aktif. Aktifkan kembali goal lama atau buat yang baru.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {active.map((g) => (
                  <GoalCard key={g.id} goal={toCard(g, serverNow)} exercises={exerciseOptions} />
                ))}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Tercapai ({completed.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={toCard(g, serverNow)} exercises={exerciseOptions} />
                ))}
              </div>
            </section>
          )}

          {abandoned.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Ditutup ({abandoned.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {abandoned.map((g) => (
                  <GoalCard key={g.id} goal={toCard(g, serverNow)} exercises={exerciseOptions} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
