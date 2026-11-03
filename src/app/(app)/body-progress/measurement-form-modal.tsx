"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addMeasurementAction, updateMeasurementAction } from "./actions";

export type MeasurementValues = {
  id?: string;
  date: string;
  weightKg?: number | null;
  heightCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  armCm?: number | null;
  forearmCm?: number | null;
  thighCm?: number | null;
  calfCm?: number | null;
  bodyFatPercent?: number | null;
  notes?: string | null;
};

const FIELDS: { key: keyof MeasurementValues; label: string; unit: string }[] = [
  { key: "weightKg", label: "Berat Badan", unit: "kg" },
  { key: "heightCm", label: "Tinggi Badan", unit: "cm" },
  { key: "chestCm", label: "Lingkar Dada", unit: "cm" },
  { key: "waistCm", label: "Lingkar Pinggang", unit: "cm" },
  { key: "armCm", label: "Lingkar Lengan", unit: "cm" },
  { key: "forearmCm", label: "Lingkar Lengan Bawah", unit: "cm" },
  { key: "thighCm", label: "Lingkar Paha", unit: "cm" },
  { key: "calfCm", label: "Lingkar Betis", unit: "cm" },
  { key: "bodyFatPercent", label: "Perkiraan Body Fat", unit: "%" },
];

function toInputValue(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}

export function MeasurementFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: MeasurementValues;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const f of FIELDS) base[f.key] = toInputValue(initial?.[f.key] as number | null);
    base.date = initial?.date ?? "";
    base.notes = initial?.notes ?? "";
    return base;
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const num = (k: string) => (values[k] === "" ? null : Number(values[k]));
    const payload = {
      date: values.date || new Date().toISOString(),
      weightKg: num("weightKg"),
      heightCm: num("heightCm"),
      chestCm: num("chestCm"),
      waistCm: num("waistCm"),
      armCm: num("armCm"),
      forearmCm: num("forearmCm"),
      thighCm: num("thighCm"),
      calfCm: num("calfCm"),
      bodyFatPercent: num("bodyFatPercent"),
      notes: values.notes || null,
    };
    const result = initial?.id
      ? await updateMeasurementAction(initial.id, payload)
      : await addMeasurementAction(payload);
    setSaving(false);
    if (result.ok) {
      toast(initial?.id ? "Pengukuran diperbarui." : "Pengukuran tersimpan.");
      onClose();
      router.refresh();
    } else {
      toast(result.error ?? "Gagal menyimpan.", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Edit Pengukuran" : "Catat Pengukuran"} size="md">
      <div className="flex flex-col gap-4">
        <Field label="Tanggal" required>
          <Input
            type="date"
            value={values.date}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.unit}>
              <Input
                type="number"
                inputMode="decimal"
                step={0.1}
                min={0}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder="—"
              />
            </Field>
          ))}
        </div>
        <Field label="Catatan">
          <Textarea
            value={values.notes}
            onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
            rows={2}
            placeholder="mis. setelah definisi 8 minggu"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}
