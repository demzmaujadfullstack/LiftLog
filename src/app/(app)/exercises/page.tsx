import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ExerciseCacheSync } from "@/components/exercises/exercise-cache-sync";
import { Select } from "@/components/ui/field";
import {
  MUSCLE_LABELS,
  EQUIPMENT_LABELS,
  TYPE_LABELS,
  DIFFICULTY_LABELS,
} from "@/lib/utils";

export const metadata = { title: "Exercise Library" };

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; equipment?: string; type?: string; scope?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const muscle = sp.muscle ?? "";
  const equipment = sp.equipment ?? "";
  const type = sp.type ?? "";
  const scope = sp.scope ?? "";

  const [exercises, allForCache] = await Promise.all([
    prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { createdById: user.id }],
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(muscle ? { primaryMuscle: muscle as never } : {}),
        ...(equipment ? { equipment: equipment as never } : {}),
        ...(type ? { type: type as never } : {}),
        ...(scope === "custom" ? { createdById: user.id } : {}),
        ...(scope === "system" ? { isSystem: true } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        type: true,
        difficulty: true,
        isSystem: true,
        description: true,
      },
    }),
    prisma.exercise.findMany({
      where: { OR: [{ isSystem: true }, { createdById: user.id }] },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        type: true,
        difficulty: true,
        isSystem: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <ExerciseCacheSync exercises={allForCache} />
      <PageHeader
        title="Exercise Library"
        description={`${exercises.length} latihan tersedia.`}
        actions={
          <Link
            href="/exercises/new"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black hover:bg-accent-strong transition active:scale-[0.98]"
          >
            <Plus size={16} /> Latihan Kustom
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <form className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari latihan..."
              className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm placeholder:text-muted-2 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Select name="muscle" defaultValue={muscle} aria-label="Filter otot">
            <option value="">Semua Otot</option>
            {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="equipment" defaultValue={equipment} aria-label="Filter alat">
            <option value="">Semua Alat</option>
            {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="type" defaultValue={type} aria-label="Filter tipe">
            <option value="">Semua Tipe</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select name="scope" defaultValue={scope} aria-label="Filter sumber">
            <option value="">Semua Sumber</option>
            <option value="system">Sistem</option>
            <option value="custom">Kustom Saya</option>
          </Select>
        </form>
      </Card>

      {exercises.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="Tidak ada latihan yang cocok"
          description="Ubah filter atau buat latihan kustom baru."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => (
            <Link key={ex.id} href={`/exercises/${ex.id}`}>
              <Card className="h-full p-4 transition-colors hover:border-accent/30">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{ex.name}</p>
                  {!ex.isSystem && <Badge variant="outline">Kustom</Badge>}
                </div>
                {ex.description && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-2">
                    {ex.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="accent">{MUSCLE_LABELS[ex.primaryMuscle]}</Badge>
                  <Badge>{EQUIPMENT_LABELS[ex.equipment]}</Badge>
                  <Badge>{DIFFICULTY_LABELS[ex.difficulty]}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
