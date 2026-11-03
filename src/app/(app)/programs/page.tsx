import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProgramCard, type ProgramCardData } from "./program-card";
import { TemplateGallery } from "./template-gallery";

export const metadata = { title: "Program Latihan" };

export default async function ProgramsPage() {
  const user = await requireUser();

  const programs = await prisma.workoutProgram.findMany({
    where: { userId: user.id },
    include: {
      days: {
        include: { exercises: { select: { id: true } } },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const lastSessions = await prisma.workoutSession.findMany({
    where: { userId: user.id, programDay: { programId: { in: programs.map((p) => p.id) } } },
    orderBy: { performedAt: "desc" },
    select: { performedAt: true, programDay: { select: { programId: true } } },
  });
  const lastByProgram = new Map<string, Date>();
  for (const s of lastSessions) {
    const pid = s.programDay?.programId;
    if (pid && !lastByProgram.has(pid)) lastByProgram.set(pid, s.performedAt);
  }

  const cards: ProgramCardData[] = programs.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isActive: p.isActive,
    template: p.template,
    dayCount: p.days.length,
    exerciseCount: p.days.reduce((n, d) => n + d.exercises.length, 0),
    lastWorkoutLabel: lastByProgram.get(p.id)
      ? `Sesi terakhir ${lastByProgram.get(p.id)!.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
      : null,
  }));

  return (
    <>
      <PageHeader
        title="Program Latihan"
        description="Susun split latihan Anda, atau mulai dari template yang sudah tersedia."
        actions={
          <Link href="/programs/new">
            <Button variant="secondary">
              <Plus size={15} /> Program Custom
            </Button>
          </Link>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={<Dumbbell size={28} />}
          title="Belum ada program"
          description="Buat program dari template di bawah — Push Pull Legs, Upper Lower, Bro Split, atau Full Body — atau susun program custom Anda sendiri."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-1 text-sm font-semibold">Template siap pakai</h2>
        <p className="mb-4 text-xs text-muted">
          Template dibuat sebagai program milik Anda — semua isinya bisa diubah setelahnya.
        </p>
        <TemplateGallery />
      </section>
    </>
  );
}
