"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createGoalAction, updateGoalAction } from "./actions";
import { GOAL_TYPE_LABELS } from "@/lib/utils";

export type GoalValues = {
  id?: string;
  title: string;
  type: string;
  exerciseId: string | null;
  startValue: number | null;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  deadline: string | null;
};

export function GoalFormModal({
  open,
  onClose,
  initial,
  exercises,
}: {
  open: boolean;
  onClose: () => void;
  initial?: GoalValues;
  exercises: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "BODY_WEIGHT");
  const [exerciseId, setExerciseId] = useState(initial?.exerciseId ?? "");
  const [startValue, setStartValue] = useState(initial?.startValue?.toString() ?? "");
  const [targetValue, setTargetValue] = useState(initial?.targetValue?.toString() ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const needsExercise = type === "EXERCISE_WEIGHT" || type === "BENCH_PRESS" || type === "SQUAT" || type === "DEADLIFT";

  async function save() {
    setError(null);
    if (!title.trim() || targetValue === "") {
      setError("Judul dan nilai target wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      title,
      type,
      exerciseId: needsExercise ? exerciseId || null : null,
      startValue: startValue === "" ? null : Number(startValue),
      targetValue: Number(targetValue),
      currentValue: initial?.currentValue ?? (startValue === "" ? null : Number(startValue)),
      unit: unit || null,
      deadline: deadline || null,
    };
    const result = initial?.id
      ? await updateGoalAction(initial.id, payload)
      : await createGoalAction(payload);
    setSaving(false);
    if (result.ok) {
      toast(initial?.id ? "Goal diperbarui." : "Goal dibuat. Semangat! 🔥");
      onClose();
      router.refresh();
    } else {
      setError(result.error ?? "Gagal menyimpan goal.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Edit Goal" : "Buat Goal Baru"} size="md">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <Field label="Judul Goal" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Bench Press 100 kg" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipe" required>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="Deadline" hint="opsional">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>
        {needsExercise && (
          <Field label="Latihan" required>
            <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
              <option value="">— pilih latihan —</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Nilai Awal">
            <Input type="number" inputMode="decimal" step={0.1} value={startValue} onChange={(e) => setStartValue(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Target" required>
            <Input type="number" inputMode="decimal" step={0.1} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="100" />
          </Field>
          <Field label="Satuan" hint="mis. kg">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="otomatis" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan Goal</Button>
        </div>
      </div>
    </Modal>
  );
}
