"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createFoodItemAction, updateNutritionTargetAction } from "./actions";

export type TargetValues = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
};

export function TargetFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: TargetValues;
}) {
  const [cal, setCal] = useState(String(initial.caloriesKcal));
  const [p, setP] = useState(String(initial.proteinG));
  const [c, setC] = useState(String(initial.carbsG));
  const [f, setF] = useState(String(initial.fatG));
  const [w, setW] = useState(String(initial.waterMl));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setError(null);
    const payload = {
      caloriesKcal: Number(cal),
      proteinG: Number(p),
      carbsG: Number(c),
      fatG: Number(f),
      waterMl: Number(w),
    };
    if (Object.values(payload).some((v) => !Number.isFinite(v) || v < 0)) {
      setError("Semua nilai target harus angka ≥ 0.");
      return;
    }
    setSaving(true);
    const r = await updateNutritionTargetAction(payload);
    setSaving(false);
    if (r.ok) {
      toast("Target nutrisi diperbarui.");
      onClose();
      router.refresh();
    } else setError(r.error ?? "Gagal menyimpan target.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Target Harian" size="sm">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kalori (kkal)" required>
            <Input type="number" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} />
          </Field>
          <Field label="Air (ml)" required>
            <Input type="number" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value)} />
          </Field>
          <Field label="Protein (g)" required>
            <Input type="number" inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} />
          </Field>
          <Field label="Karbohidrat (g)" required>
            <Input type="number" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} />
          </Field>
          <Field label="Lemak (g)" required>
            <Input type="number" inputMode="decimal" value={f} onChange={(e) => setF(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan Target</Button>
        </div>
      </div>
    </Modal>
  );
}

export function CustomFoodModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [serving, setServing] = useState("100");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("0");
  const [c, setC] = useState("0");
  const [f, setF] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setError(null);
    if (!name.trim() || cal === "") {
      setError("Nama dan kalori wajib diisi.");
      return;
    }
    setSaving(true);
    const r = await createFoodItemAction({
      name: name.trim(),
      brand: brand.trim() || null,
      servingSizeG: Number(serving) || 100,
      caloriesKcal: Number(cal),
      proteinG: Number(p) || 0,
      carbsG: Number(c) || 0,
      fatG: Number(f) || 0,
    });
    setSaving(false);
    if (r.ok) {
      toast("Makanan kustom ditambahkan.");
      onClose();
      router.refresh();
    } else setError(r.error ?? "Gagal menambahkan makanan.");
  }

  return (
    <Modal open={open} onClose={onClose} title="Makanan Kustom" size="sm">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <p className="text-xs text-muted">Nilai gizi per 1 porsi sajian di bawah ini.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Pecel Ayam" />
          </Field>
          <Field label="Merek" hint="opsional">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </Field>
          <Field label="Porsi (g)" required>
            <Input type="number" inputMode="numeric" value={serving} onChange={(e) => setServing(e.target.value)} />
          </Field>
          <Field label="Kalori" required>
            <Input type="number" inputMode="numeric" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="250" />
          </Field>
          <Field label="Protein (g)">
            <Input type="number" inputMode="decimal" value={p} onChange={(e) => setP(e.target.value)} />
          </Field>
          <Field label="Karbo (g)">
            <Input type="number" inputMode="decimal" value={c} onChange={(e) => setC(e.target.value)} />
          </Field>
          <Field label="Lemak (g)">
            <Input type="number" inputMode="decimal" value={f} onChange={(e) => setF(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}
