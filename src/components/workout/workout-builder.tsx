"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Timer,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn, MUSCLE_LABELS } from "@/lib/utils";
import { saveWorkoutAction, updateWorkoutAction } from "@/app/(app)/workout/actions";
import { offlineDb } from "@/lib/offline/db";
import { newIdempotencyKey } from "@/lib/offline/sync";
import type { PickerExercise, PreviousPerformance } from "@/lib/workout-types";

type SetRow = {
  key: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe: number | null;
  isWarmup: boolean;
  isBodyweight: boolean;
  done: boolean;
};

type ExerciseBlock = {
  key: string;
  exerciseId: string;
  name: string;
  primaryMuscle: string;
  notes: string;
  sets: SetRow[];
};

let keyCounter = 0;
const nextKey = () => `k${Date.now().toString(36)}-${keyCounter++}`;

function newSet(setNumber: number, prev?: { reps: number; weightKg: number }): SetRow {
  return {
    key: nextKey(),
    setNumber,
    reps: prev?.reps ?? 0,
    weightKg: prev?.weightKg ?? 0,
    isWarmup: false,
    isBodyweight: false,
    rpe: null,
    done: false,
  };
}

export function WorkoutBuilder({
  exercises,
  previousPerformance,
  editing,
  programDayId,
  dayName,
}: {
  exercises: PickerExercise[];
  previousPerformance: Record<string, PreviousPerformance>;
  programDayId?: string;
  dayName?: string;
  editing?: {
    id: string;
    title: string;
    notes: string | null;
    performedAt: string;
    durationMinutes: number | null;
    completedAt: string | null;
    exercises: {
      exerciseId: string;
      name: string;
      primaryMuscle: string;
      notes: string | null;
      sets: { setNumber: number; reps: number; weightKg: number; rpe: number | null; isWarmup: boolean; isBodyweight: boolean }[];
    }[];
  };
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(editing?.title ?? dayName ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [performedAt, setPerformedAt] = useState(
    editing?.performedAt ?? toLocalInput(new Date())
  );
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    editing?.durationMinutes ?? null
  );
  const [blocks, setBlocks] = useState<ExerciseBlock[]>(
    editing
      ? editing.exercises.map((ex) => ({
          key: nextKey(),
          exerciseId: ex.exerciseId,
          name: ex.name,
          primaryMuscle: ex.primaryMuscle,
          notes: ex.notes ?? "",
          sets: ex.sets.map((s) => ({ ...s, key: nextKey(), done: true })),
        }))
      : []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(90);
  const [expandedPrev, setExpandedPrev] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);
  const idempotencyKeyRef = useRef<string>(editing?.id ? "" : newIdempotencyKey());

  // timer istirahat
  const [restNow, setRestNow] = useState(0);
  useEffect(() => {
    if (!restUntil) return;
    const iv = setInterval(() => {
      const t = Date.now();
      setRestNow(t);
      if (t >= restUntil) setRestUntil(null);
    }, 250);
    return () => clearInterval(iv);
  }, [restUntil]);
  const restRemaining = restUntil ? Math.max(0, Math.ceil((restUntil - restNow) / 1000)) : 0;

  const filteredExercises = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const used = new Set(blocks.map((b) => b.exerciseId));
    return exercises.filter(
      (e) =>
        (!q || e.name.toLowerCase().includes(q) || MUSCLE_LABELS[e.primaryMuscle]?.toLowerCase().includes(q)) &&
        !used.has(e.id)
    );
  }, [pickerQuery, exercises, blocks]);

  const addExercise = (ex: PickerExercise) => {
    const prev = previousPerformance[ex.id];
    const firstSet = prev?.sets[0]
      ? newSet(1, { reps: prev.sets[0].reps, weightKg: prev.sets[0].weightKg })
      : newSet(1);
    setBlocks((b) => [
      ...b,
      {
        key: nextKey(),
        exerciseId: ex.id,
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        notes: "",
        sets: [firstSet],
      },
    ]);
    setPickerOpen(false);
    setPickerQuery("");
    toast(`${ex.name} ditambahkan`, "info");
  };

  const updateSet = (bKey: string, sKey: string, patch: Partial<SetRow>) => {
    setBlocks((bs) =>
      bs.map((b) =>
        b.key !== bKey
          ? b
          : { ...b, sets: b.sets.map((s) => (s.key === sKey ? { ...s, ...patch } : s)) }
      )
    );
  };

  const addSet = (bKey: string) => {
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.key !== bKey) return b;
        const last = b.sets[b.sets.length - 1];
        return {
          ...b,
          sets: [
            ...b.sets,
            newSet(b.sets.length + 1, last ? { reps: last.reps, weightKg: last.weightKg } : undefined),
          ],
        };
      })
    );
  };

  const removeSet = (bKey: string, sKey: string) => {
    setBlocks((bs) =>
      bs.map((b) =>
        b.key !== bKey
          ? b
          : {
              ...b,
              sets: b.sets
                .filter((s) => s.key !== sKey)
                .map((s, i) => ({ ...s, setNumber: i + 1 })),
            }
      )
    );
  };

  const removeExercise = (bKey: string) => {
    setBlocks((bs) => bs.filter((b) => b.key !== bKey));
  };

  const toggleSetDone = (bKey: string, sKey: string) => {
    const block = blocks.find((b) => b.key === bKey);
    const target = block?.sets.find((s) => s.key === sKey);
    const willComplete = target ? !target.done : false;
    setBlocks((bs) =>
      bs.map((b) =>
        b.key !== bKey
          ? b
          : { ...b, sets: b.sets.map((s) => (s.key === sKey ? { ...s, done: !s.done } : s)) }
      )
    );
    if (willComplete) setRestUntil(Date.now() + restSeconds * 1000);
  };

  const liveVolume = useMemo(
    () =>
      blocks.reduce(
        (sum, b) =>
          sum +
          b.sets
            .filter((s) => s.done && !s.isWarmup && !s.isBodyweight)
            .reduce((v, s) => v + s.reps * s.weightKg, 0),
        0
      ),
    [blocks]
  );

  const totalSets = blocks.reduce((n, b) => n + b.sets.length, 0);

  function buildPayload(completed: boolean) {
    const performed = new Date(performedAt);
    const dur =
      durationMinutes ??
      (editing?.durationMinutes
        ? undefined
        : Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000))) ??
      undefined;
    return {
      title: title.trim() || "Workout",
      notes: notes.trim() || null,
      performedAt: performed.toISOString(),
      durationMinutes: completed ? dur ?? null : null,
      programDayId: programDayId ?? null,
      completed,
      idempotencyKey: editing ? null : idempotencyKeyRef.current || null,
      exercises: blocks.map((b, i) => ({
        exerciseId: b.exerciseId,
        order: i,
        notes: b.notes.trim() || null,
        sets: b.sets.map((s, j) => ({
          setNumber: j + 1,
          reps: s.reps,
          weightKg: s.weightKg,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
          isBodyweight: s.isBodyweight,
        })),
      })),
    };
  }

  const save = useCallback(
    async (completed: boolean) => {
      if (blocks.length === 0) {
        toast("Tambahkan minimal 1 latihan.", "error");
        return;
      }
      const invalid = blocks.some((b) => b.sets.some((s) => s.reps <= 0));
      if (invalid) {
        toast("Isi jumlah reps untuk semua set (minimal 1).", "error");
        return;
      }
      setSaving(true);
      const payload = buildPayload(completed);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // offline: simpan ke antrean sync IndexedDB
        await offlineDb.queue({
          idempotencyKey: payload.idempotencyKey ?? newIdempotencyKey(),
          endpoint: editing ? `/api/sync/workout/${editing.id}` : "/api/sync/workout",
          method: editing ? "PUT" : "POST",
          payload,
        });
        setSaving(false);
        toast("Offline — workout disimpan lokal dan akan disinkronkan otomatis.", "info");
        router.push("/workout");
        router.refresh();
        return;
      }

      const result = editing
        ? await updateWorkoutAction(editing.id, payload)
        : await saveWorkoutAction(payload);
      setSaving(false);
      if (result.ok) {
        toast(completed ? "Workout selesai disimpan! 💪" : "Workout disimpan.");
        router.push("/workout");
        router.refresh();
      } else {
        toast(result.error ?? "Gagal menyimpan workout.", "error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, title, notes, performedAt, durationMinutes, editing, router, toast]
  );

  return (
    <div className="mx-auto max-w-3xl pb-28">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/workout"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:text-foreground hover:bg-surface-2 transition"
          aria-label="Kembali"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul workout (mis. Push Day)"
            className="border-transparent bg-transparent px-0 text-lg font-bold focus:border-accent/60 focus:px-3.5"
            aria-label="Judul workout"
          />
        </div>
      </div>

      {/* Meta */}
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Tanggal" className="col-span-2 sm:col-span-1">
            <Input
              type="datetime-local"
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
            />
          </Field>
          <Field label="Durasi (menit)" hint="kosong = otomatis">
            <Input
              type="number"
              min={0}
              value={durationMinutes ?? ""}
              onChange={(e) =>
                setDurationMinutes(e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="Otomatis"
            />
          </Field>
          <div className="col-span-2 flex items-end gap-3 sm:col-span-2">
            <div className="flex-1 rounded-xl bg-surface-2 px-3.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-2">Volume live</p>
              <p className="text-sm font-bold tabular-nums">
                {liveVolume.toLocaleString("id-ID")} <span className="text-[10px] font-normal text-muted">kg</span>
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-surface-2 px-3.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-2">Total set</p>
              <p className="text-sm font-bold tabular-nums">{totalSets}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Rest timer bar */}
      {restRemaining > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-accent/30 bg-surface-2/95 px-5 py-3 shadow-2xl backdrop-blur animate-toast-in sm:bottom-6">
          <Timer size={18} className="text-accent" />
          <span className="text-2xl font-bold tabular-nums">
            {String(Math.floor(restRemaining / 60)).padStart(2, "0")}:
            {String(restRemaining % 60).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-muted">istirahat</span>
          <button
            onClick={() => setRestUntil(null)}
            className="ml-1 text-muted-2 hover:text-foreground"
            aria-label="Hentikan timer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Exercise blocks */}
      <div className="flex flex-col gap-3">
        {blocks.map((b) => {
          const prev = previousPerformance[b.exerciseId];
          const expanded = expandedPrev === b.key;
          return (
            <Card key={b.key} className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="text-[11px] text-muted-2">{MUSCLE_LABELS[b.primaryMuscle] ?? b.primaryMuscle}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden items-center gap-1 text-[10px] text-muted-2 sm:flex">
                    Timer
                    <Select
                      value={restSeconds}
                      onChange={(e) => setRestSeconds(Number(e.target.value))}
                      className="h-7 w-16 py-0 text-[11px]"
                      aria-label="Durasi istirahat"
                    >
                      {[45, 60, 90, 120, 180, 300].map((s) => (
                        <option key={s} value={s}>{s}s</option>
                      ))}
                    </Select>
                  </span>
                  <button
                    onClick={() => setRestUntil(Date.now() + restSeconds * 1000)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-accent transition"
                    aria-label={`Mulai timer istirahat untuk ${b.name}`}
                  >
                    <Timer size={15} />
                  </button>
                  <button
                    onClick={() => removeExercise(b.key)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition"
                    aria-label={`Hapus ${b.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* previous performance */}
              {prev && (
                <button
                  onClick={() => setExpandedPrev(expanded ? null : b.key)}
                  className="flex w-full items-center gap-2 bg-surface-2/50 px-4 py-2 text-left text-[11px] text-muted hover:text-foreground transition-colors"
                >
                  {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  Terakhir ({prev.date}):{" "}
                  <span className="font-medium text-muted">
                    {prev.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(" · ")}
                  </span>
                </button>
              )}

              {/* sets table */}
              <div className="px-3 py-3 sm:px-4">
                <div className="mb-1.5 grid grid-cols-[2rem_1fr_1fr_3.5rem_2rem] items-center gap-1.5 px-1 text-[10px] uppercase tracking-wider text-muted-2 sm:grid-cols-[2rem_1fr_1fr_4rem_2.5rem_2rem]">
                  <span>Set</span>
                  <span>Kg</span>
                  <span>Reps</span>
                  <span className="hidden sm:block">RPE</span>
                  <span>✓</span>
                  <span />
                </div>
                {b.sets.map((s) => (
                  <div
                    key={s.key}
                    className={cn(
                      "mb-1.5 grid grid-cols-[2rem_1fr_1fr_3.5rem_2rem] items-center gap-1.5 rounded-lg px-1 py-0.5 transition-colors sm:grid-cols-[2rem_1fr_1fr_4rem_2.5rem_2rem]",
                      s.done && "bg-accent-soft/40",
                      s.isWarmup && "opacity-60"
                    )}
                  >
                    <span className="text-center text-xs font-semibold tabular-nums text-muted">
                      {s.setNumber}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.5}
                      value={s.isBodyweight ? "" : s.weightKg || ""}
                      disabled={s.isBodyweight}
                      onChange={(e) =>
                        updateSet(b.key, s.key, { weightKg: e.target.value === "" ? 0 : Number(e.target.value) })
                      }
                      placeholder={s.isBodyweight ? "BW" : "0"}
                      className="h-9 tabular-nums"
                      aria-label={`Beban set ${s.setNumber} ${b.name}`}
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={s.reps || ""}
                      onChange={(e) =>
                        updateSet(b.key, s.key, { reps: e.target.value === "" ? 0 : Number(e.target.value) })
                      }
                      placeholder="0"
                      className="h-9 tabular-nums"
                      aria-label={`Reps set ${s.setNumber} ${b.name}`}
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={10}
                      step={0.5}
                      value={s.rpe ?? ""}
                      onChange={(e) =>
                        updateSet(b.key, s.key, { rpe: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      placeholder="—"
                      className="hidden h-9 tabular-nums sm:block"
                      aria-label={`RPE set ${s.setNumber} ${b.name}`}
                    />
                    <button
                      onClick={() => toggleSetDone(b.key, s.key)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                        s.done
                          ? "border-accent bg-accent text-black"
                          : "border-line text-muted-2 hover:border-accent/50 hover:text-accent"
                      )}
                      aria-label={s.done ? `Set ${s.setNumber} selesai` : `Tandai set ${s.setNumber} selesai`}
                    >
                      <Check size={14} />
                    </button>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => updateSet(b.key, s.key, { isWarmup: !s.isWarmup })}
                        className={cn(
                          "hidden h-6 rounded px-1.5 text-[9px] font-semibold transition sm:block",
                          s.isWarmup ? "bg-warning/20 text-warning" : "text-muted-2 hover:bg-surface-3"
                        )}
                        title="Tandai sebagai warmup"
                      >
                        W
                      </button>
                      <button
                        onClick={() => removeSet(b.key, s.key)}
                        className="flex h-8 w-7 items-center justify-center rounded-lg text-muted-2 hover:text-danger transition"
                        aria-label={`Hapus set ${s.setNumber}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => addSet(b.key)}>
                    <Plus size={13} /> Tambah Set
                  </Button>
                  <button
                    onClick={() =>
                      setBlocks((bs) =>
                        bs.map((x) =>
                          x.key !== b.key
                            ? x
                            : { ...x, sets: x.sets.map((s) => ({ ...s, isBodyweight: !s.isBodyweight })) }
                        )
                      )
                    }
                    className={cn(
                      "h-8 rounded-lg px-2.5 text-[11px] font-medium transition",
                      b.sets[0]?.isBodyweight
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-surface-2"
                    )}
                    title="Latihan bodyweight (tanpa beban eksternal)"
                  >
                    Bodyweight
                  </button>
                </div>
                <Input
                  value={b.notes}
                  onChange={(e) =>
                    setBlocks((bs) => bs.map((x) => (x.key === b.key ? { ...x, notes: e.target.value } : x)))
                  }
                  placeholder="Catatan latihan (opsional)"
                  className="mt-2 h-8 text-xs"
                />
              </div>
            </Card>
          );
        })}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-4 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-accent"
      >
        <Plus size={16} /> Tambah Latihan
      </button>

      {/* Catatan workout */}
      <Card className="mt-4 p-4">
        <Field label="Catatan Workout">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bagaimana perasaan Anda? Kondisi gym? Hal yang perlu diperhatikan berikutnya?"
            rows={3}
          />
        </Field>
      </Card>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-background/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => save(false)}
            disabled={saving}
            loading={saving}
          >
            {!saving && <Save size={15} />} Simpan Draft
          </Button>
          <Button size="lg" className="flex-[1.5]" onClick={() => save(true)} disabled={saving}>
            <Flame size={15} /> Selesaikan Workout
          </Button>
        </div>
      </div>

      {/* Exercise picker */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pilih Latihan" size="md">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
          <Input
            autoFocus
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="Cari latihan atau otot..."
            className="pl-9"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredExercises.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">
              Tidak ada latihan cocok.{" "}
              <Link href="/exercises" className="text-accent hover:underline">
                Buat latihan kustom
              </Link>
            </p>
          ) : (
            filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ex.name}</p>
                  <p className="text-[11px] text-muted-2">
                    {MUSCLE_LABELS[ex.primaryMuscle] ?? ex.primaryMuscle} · {ex.equipment}
                  </p>
                </div>
                {!ex.isSystem && <Badge variant="outline">Kustom</Badge>}
                <Plus size={15} className="text-accent" />
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
