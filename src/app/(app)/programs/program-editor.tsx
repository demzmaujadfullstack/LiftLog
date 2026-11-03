"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn, MUSCLE_LABELS } from "@/lib/utils";
import { saveProgramAction } from "./actions";
import type { PickerExercise } from "@/lib/workout-types";

type DraftExercise = {
  key: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  targetSets: number;
  repsMin: string;
  repsMax: string;
  weightKg: string;
  restSeconds: number;
};

type DraftDay = {
  key: string;
  name: string;
  exercises: DraftExercise[];
};

let keySeq = 0;
const nextKey = () => `pe-${++keySeq}`;

const REST_OPTIONS = [45, 60, 90, 120, 150, 180, 240, 300];

export function ProgramEditor({
  programId,
  initialName,
  initialDescription,
  initialDays,
  exercises,
}: {
  programId?: string;
  initialName?: string;
  initialDescription?: string;
  initialDays?: { name: string; exercises: { exerciseId: string; name: string; primaryMuscle: string; targetSets: number; targetRepsMin: number | null; targetRepsMax: number | null; targetWeightKg: number | null; restSeconds: number | null }[] }[];
  exercises: PickerExercise[];
}) {
  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [days, setDays] = useState<DraftDay[]>(
    initialDays?.map((d, i) => ({
      key: nextKey(),
      name: d.name || `Hari ${i + 1}`,
      exercises: d.exercises.map((e) => ({
        key: nextKey(),
        exerciseId: e.exerciseId,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        targetSets: e.targetSets,
        repsMin: e.targetRepsMin?.toString() ?? "",
        repsMax: e.targetRepsMax?.toString() ?? "",
        weightKg: e.targetWeightKg?.toString() ?? "",
        restSeconds: e.restSeconds ?? 90,
      })),
    })) ?? [{ key: nextKey(), name: "Hari 1", exercises: [] }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const pickerExercises = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const day = days.find((d) => d.key === pickerDay);
    const used = new Set(day?.exercises.map((e) => e.exerciseId));
    return exercises
      .filter((e) => !used.has(e.id))
      .filter((e) => !q || e.name.toLowerCase().includes(q) || (MUSCLE_LABELS[e.primaryMuscle] ?? "").toLowerCase().includes(q))
      .slice(0, 60);
  }, [exercises, pickerDay, pickerQuery, days]);

  function addDay() {
    setDays((d) => [...d, { key: nextKey(), name: `Hari ${d.length + 1}`, exercises: [] }]);
  }

  function removeDay(dayKey: string) {
    setDays((d) => d.filter((x) => x.key !== dayKey));
  }

  function updateDay(dayKey: string, patch: Partial<DraftDay>) {
    setDays((d) => d.map((x) => (x.key === dayKey ? { ...x, ...patch } : x)));
  }

  function updateExercise(dayKey: string, exKey: string, patch: Partial<DraftExercise>) {
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? { ...x, exercises: x.exercises.map((e) => (e.key === exKey ? { ...e, ...patch } : e)) }
          : x
      )
    );
  }

  function addExercise(dayKey: string, ex: PickerExercise) {
    setDays((d) =>
      d.map((x) =>
        x.key === dayKey
          ? {
              ...x,
              exercises: [
                ...x.exercises,
                {
                  key: nextKey(),
                  exerciseId: ex.id,
                  name: ex.name,
                  primaryMuscle: ex.primaryMuscle,
                  targetSets: 3,
                  repsMin: "8",
                  repsMax: "12",
                  weightKg: "",
                  restSeconds: 90,
                },
              ],
            }
          : x
      )
    );
  }

  async function save() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Nama program minimal 2 karakter.");
      return;
    }
    if (days.length === 0) {
      setError("Tambahkan minimal satu hari latihan.");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      template: programId ? undefined : "custom",
      days: days.map((d, i) => ({
        name: d.name.trim() || `Hari ${i + 1}`,
        dayIndex: i,
        exercises: d.exercises.map((e, order) => ({
          exerciseId: e.exerciseId,
          order,
          targetSets: e.targetSets,
          targetRepsMin: e.repsMin === "" ? null : Number(e.repsMin),
          targetRepsMax: e.repsMax === "" ? null : Number(e.repsMax),
          targetWeightKg: e.weightKg === "" ? null : Number(e.weightKg),
          restSeconds: e.restSeconds,
        })),
      })),
    };
    const r = await saveProgramAction(payload, programId);
    setSaving(false);
    if (r.ok && r.id) {
      toast("Program disimpan.");
      router.push(`/programs/${r.id}`);
      router.refresh();
    } else setError(r.error ?? "Gagal menyimpan program.");
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {error && (
        <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
        <Field label="Nama Program" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Hypertrophy Blok 1" />
        </Field>
        <Field label="Deskripsi" hint="opsional">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fokus, catatan singkat…" />
        </Field>
      </div>

      {days.map((day, di) => (
        <div key={day.key} className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold text-accent">
              {di + 1}
            </span>
            <Input
              value={day.name}
              onChange={(e) => updateDay(day.key, { name: e.target.value })}
              className="h-8 max-w-52 border-transparent bg-transparent px-2 font-semibold hover:border-line"
              aria-label={`Nama hari ${di + 1}`}
            />
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setPickerDay(day.key)}>
                <Plus size={13} /> Latihan
              </Button>
              {days.length > 1 && (
                <button
                  onClick={() => removeDay(day.key)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-2 hover:bg-danger-soft hover:text-danger transition"
                  aria-label={`Hapus ${day.name}`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {day.exercises.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted">Belum ada latihan — klik &quot;+ Latihan&quot;.</p>
          ) : (
            <ul className="divide-y divide-line">
              {day.exercises.map((ex) => (
                <li key={ex.key} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                  <GripVertical size={13} className="hidden text-muted-2 sm:block" aria-hidden />
                  <div className="min-w-36 flex-1">
                    <p className="truncate text-sm font-medium">{ex.name}</p>
                    <p className="text-[11px] text-muted">{MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle}</p>
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-muted">
                    set
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(day.key, ex.key, { targetSets: Number(e.target.value) || 1 })}
                      className="h-8 w-14 text-center"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-muted">
                    reps
                    <Input
                      value={ex.repsMin}
                      onChange={(e) => updateExercise(day.key, ex.key, { repsMin: e.target.value })}
                      inputMode="numeric"
                      placeholder="8"
                      className="h-8 w-14 text-center"
                    />
                    <span className="text-muted-2">–</span>
                    <Input
                      value={ex.repsMax}
                      onChange={(e) => updateExercise(day.key, ex.key, { repsMax: e.target.value })}
                      inputMode="numeric"
                      placeholder="12"
                      className="h-8 w-14 text-center"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-muted">
                    kg
                    <Input
                      value={ex.weightKg}
                      onChange={(e) => updateExercise(day.key, ex.key, { weightKg: e.target.value })}
                      inputMode="decimal"
                      placeholder="—"
                      className="h-8 w-16 text-center"
                    />
                  </label>
                  <Select
                    value={String(ex.restSeconds)}
                    onChange={(e) => updateExercise(day.key, ex.key, { restSeconds: Number(e.target.value) })}
                    className="h-8 w-24 text-xs"
                    aria-label="Istirahat"
                  >
                    {REST_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}s</option>
                    ))}
                  </Select>
                  <button
                    onClick={() => updateDay(day.key, { exercises: day.exercises.filter((x) => x.key !== ex.key) })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-2 hover:bg-danger-soft hover:text-danger transition"
                    aria-label={`Hapus ${ex.name} dari ${day.name}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <Button variant="outline" onClick={addDay} className="w-fit">
        <Plus size={14} /> Tambah Hari
      </Button>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => router.back()}>Batal</Button>
          <Button onClick={save} loading={saving}>
            {programId ? "Simpan Perubahan" : "Simpan Program"}
          </Button>
        </div>
      </div>

      <Modal
        open={pickerDay !== null}
        onClose={() => {
          setPickerDay(null);
          setPickerQuery("");
        }}
        title="Pilih Latihan"
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <Input
              autoFocus
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="cari nama atau otot…"
              className="pl-9"
            />
          </div>
          {pickerExercises.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">Tidak ada latihan yang cocok.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {pickerExercises.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => {
                      if (pickerDay) addExercise(pickerDay, e);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-surface-2",
                      !e.isSystem && "opacity-90"
                    )}
                  >
                    <span className="truncate text-sm">{e.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-2">
                      {MUSCLE_LABELS[e.primaryMuscle] ?? e.primaryMuscle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}
