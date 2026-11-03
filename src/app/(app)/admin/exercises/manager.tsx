"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  TYPE_LABELS,
} from "@/lib/utils";
import {
  adminCreateSystemExerciseAction,
  adminDeleteSystemExerciseAction,
} from "../actions";

type Row = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  type: string;
  difficulty: string;
  usageCount: number;
};

export function SystemExerciseManager({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q)) &&
        (!muscle || r.primaryMuscle === muscle)
    );
  }, [rows, query, muscle]);

  const target = rows.find((r) => r.id === deleteId);

  async function confirmDelete() {
    if (!target) return;
    setBusy(true);
    const r = await adminDeleteSystemExerciseAction(target.id);
    setBusy(false);
    if (r.ok) {
      toast("Latihan sistem dihapus.");
      setDeleteId(null);
      router.refresh();
    } else {
      toast(r.error ?? "Gagal menghapus.", "error");
      setDeleteId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="cari latihan…"
            className="pl-9"
            aria-label="Cari latihan sistem"
          />
        </div>
        <Select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="w-44" aria-label="Filter otot">
          <option value="">Semua otot</option>
          {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Button onClick={() => setCreateOpen(true)} className="ml-auto">
          <Plus size={14} /> Tambah Latihan Sistem
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-130 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Otot</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Perangkat</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Dipakai</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2/50 transition">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="accent">{MUSCLE_LABELS[r.primaryMuscle] ?? r.primaryMuscle}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted sm:table-cell">
                  {EQUIPMENT_LABELS[r.equipment] ?? r.equipment}
                </td>
                <td className="hidden px-4 py-3 text-xs tabular-nums text-muted md:table-cell">{r.usageCount}×</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDeleteId(r.id)}
                    disabled={r.usageCount > 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted-2 transition hover:border-danger/40 hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Hapus ${r.name}`}
                    title={r.usageCount > 0 ? "Dipakai di histori — tidak bisa dihapus" : "Hapus"}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs text-muted">Tidak ada latihan yang cocok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateSystemExerciseModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={busy}
        title={target ? `Hapus ${target.name}?` : "Hapus latihan?"}
        message="Latihan sistem akan hilang dari pustaka seluruh pengguna. Latihan yang sudah dipakai di histori tidak bisa dihapus."
      />
    </>
  );
}

function CreateSystemExerciseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("CHEST");
  const [equipment, setEquipment] = useState("BARBELL");
  const [type, setType] = useState("STRENGTH");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Nama latihan minimal 2 karakter.");
      return;
    }
    setSaving(true);
    const r = await adminCreateSystemExerciseAction({
      name: name.trim(),
      description: description.trim() || null,
      primaryMuscle,
      secondaryMuscles: [],
      equipment,
      type,
      difficulty,
      instructions: instructions.trim() || null,
    });
    setSaving(false);
    if (r.ok) {
      toast("Latihan sistem ditambahkan.");
      setName("");
      setDescription("");
      setInstructions("");
      onClose();
      router.refresh();
    } else setError(r.error ?? "Gagal menambahkan.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Latihan Sistem Baru" size="md">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <Field label="Nama" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Zercher Squat" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Otot Utama" required>
            <Select value={primaryMuscle} onChange={(e) => setPrimaryMuscle(e.target.value)}>
              {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Perangkat" required>
            <Select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tipe" required>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Kesulitan" required>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Deskripsi">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Instruksi">
          <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}
