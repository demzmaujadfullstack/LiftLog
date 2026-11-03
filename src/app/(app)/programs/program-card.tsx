"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Play, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { activateProgramAction, deleteProgramAction } from "./actions";

export type ProgramCardData = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  template: string | null;
  dayCount: number;
  exerciseCount: number;
  lastWorkoutLabel: string | null;
};

export function ProgramCard({ program }: { program: ProgramCardData }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function activate() {
    setBusy(true);
    const r = await activateProgramAction(program.id);
    setBusy(false);
    if (r.ok) {
      toast(`Program "${program.name}" diaktifkan.`);
      router.refresh();
    } else toast(r.error ?? "Gagal mengaktifkan.", "error");
  }

  async function confirmDelete() {
    setBusy(true);
    const r = await deleteProgramAction(program.id);
    setBusy(false);
    if (r.ok) {
      toast("Program dihapus. Riwayat workout Anda tetap tersimpan.");
      router.refresh();
    } else {
      toast(r.error ?? "Gagal menghapus.", "error");
      setDeleteOpen(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-surface p-5 transition hover:border-line-strong",
        program.isActive ? "border-accent/40" : "border-line"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{program.name}</h3>
            {program.isActive && (
              <Badge variant="accent">
                <Star size={10} /> Aktif
              </Badge>
            )}
          </div>
          {program.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted">{program.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted">
        <span>{program.dayCount} hari</span>
        <span>{program.exerciseCount} latihan</span>
        {program.lastWorkoutLabel && <span>{program.lastWorkoutLabel}</span>}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/programs/${program.id}`}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line text-xs font-medium text-foreground hover:border-accent/40 hover:text-accent transition"
        >
          Lihat & Jalankan
        </Link>
        {!program.isActive && (
          <button
            onClick={activate}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-accent/40 hover:text-accent transition disabled:opacity-50"
            aria-label={`Aktifkan program ${program.name}`}
            title="Jadikan program aktif"
          >
            <Play size={13} />
          </button>
        )}
        <Link
          href={`/programs/${program.id}/edit`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-accent/40 hover:text-accent transition"
          aria-label={`Edit program ${program.name}`}
        >
          <Pencil size={13} />
        </Link>
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-danger/40 hover:bg-danger-soft hover:text-danger transition"
          aria-label={`Hapus program ${program.name}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus program?"
        message="Program beserta hari-harinya akan dihapus. Sesi workout yang sudah tercatat tidak ikut terhapus."
      />
    </div>
  );
}
