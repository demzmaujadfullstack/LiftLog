"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn, MEAL_LABELS, formatNumber } from "@/lib/utils";
import { logFoodAction } from "./actions";
import { newIdempotencyKey } from "@/lib/offline/sync";
import { offlineDb } from "@/lib/offline/db";

export type FoodOption = {
  id: string;
  name: string;
  brand: string | null;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSizeG: number;
  isSystem: boolean;
};

const MEALS = Object.keys(MEAL_LABELS) as (keyof typeof MEAL_LABELS)[];

export function FoodPickerModal({
  open,
  onClose,
  date,
  foods,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  foods: FoodOption[];
}) {
  const [tab, setTab] = useState<"list" | "manual">("list");
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<string>("BREAKFAST");
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [servings, setServings] = useState("1");
  const [mName, setMName] = useState("");
  const [mCal, setMCal] = useState("");
  const [mProtein, setMProtein] = useState("");
  const [mCarbs, setMCarbs] = useState("");
  const [mFat, setMFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods
      .filter((f) => !q || f.name.toLowerCase().includes(q) || (f.brand ?? "").toLowerCase().includes(q))
      .slice(0, 80);
  }, [foods, query]);

  async function submit() {
    setError(null);
    const srv = Number(servings);
    if (tab === "list" && !selected) {
      setError("Pilih makanan dulu.");
      return;
    }
    if (tab === "manual" && (!mName.trim() || mCal === "" || Number(mCal) <= 0)) {
      setError("Isi nama dan kalori manual.");
      return;
    }
    setSaving(true);
    const payload =
      tab === "list"
        ? {
            date,
            meal,
            foodItemId: selected!.id,
            name: selected!.name,
            servings: srv,
            idempotencyKey: newIdempotencyKey(),
          }
        : {
            date,
            meal,
            foodItemId: null,
            name: mName.trim(),
            servings: 1,
            caloriesKcal: Number(mCal),
            proteinG: mProtein === "" ? null : Number(mProtein),
            carbsG: mCarbs === "" ? null : Number(mCarbs),
            fatG: mFat === "" ? null : Number(mFat),
            idempotencyKey: newIdempotencyKey(),
          };

    if (!navigator.onLine) {
      await offlineDb.queue({
        idempotencyKey: payload.idempotencyKey,
        endpoint: "/api/sync/nutrition",
        method: "POST",
        payload,
      });
      setSaving(false);
      toast("Tersimpan offline — akan sinkron saat online.");
      onClose();
      return;
    }

    const r = await logFoodAction(payload);
    setSaving(false);
    if (r.ok) {
      toast("Makanan dicatat.");
      onClose();
      router.refresh();
    } else setError(r.error ?? "Gagal mencatat makanan.");
  }

  const preview =
    selected && servings
      ? {
          cal: selected.caloriesKcal * Number(servings || 1),
          p: selected.proteinG * Number(servings || 1),
          c: selected.carbsG * Number(servings || 1),
          f: selected.fatG * Number(servings || 1),
        }
      : null;

  return (
    <Modal open={open} onClose={onClose} title="Catat Makanan" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Sumber makanan">
          {(["list", "manual"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
                tab === t ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              )}
            >
              {t === "list" ? "Dari Database" : "Manual"}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}

        <Field label="Kategori Meal">
          <Select value={meal} onChange={(e) => setMeal(e.target.value)}>
            {MEALS.map((m) => (
              <option key={m} value={m}>{MEAL_LABELS[m]}</option>
            ))}
          </Select>
        </Field>

        {tab === "list" ? (
          <>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="cari makanan…"
                className="pl-9"
                aria-label="Cari makanan"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {filtered.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setSelected(f)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-surface-2",
                      selected?.id === f.id && "bg-accent-soft"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{f.name}</span>
                      <span className="text-[11px] text-muted-2">
                        per ±{formatNumber(f.servingSizeG)} g · {f.isSystem ? "sistem" : "kustom"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{Math.round(f.caloriesKcal)} kkal</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-8 text-center text-xs text-muted">Tidak ada yang cocok — coba tab Manual.</li>
              )}
            </ul>
            {selected && (
              <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                <Field label="Porsi (× porsi sajian)">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0.5}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </Field>
                {preview && (
                  <p className="mt-2 text-xs tabular-nums text-muted">
                    ≈ {Math.round(preview.cal)} kkal · P {formatNumber(Math.round(preview.p))} g · KH{" "}
                    {formatNumber(Math.round(preview.c))} g · L {formatNumber(Math.round(preview.f))} g
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Nama Makanan" required>
                <Input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="mis. Gado-gado" />
              </Field>
            </div>
            <Field label="Kalori (kkal)" required>
              <Input type="number" inputMode="numeric" value={mCal} onChange={(e) => setMCal(e.target.value)} placeholder="350" />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" inputMode="decimal" value={mProtein} onChange={(e) => setMProtein(e.target.value)} placeholder="12" />
            </Field>
            <Field label="Karbo (g)">
              <Input type="number" inputMode="decimal" value={mCarbs} onChange={(e) => setMCarbs(e.target.value)} placeholder="40" />
            </Field>
            <Field label="Lemak (g)">
              <Input type="number" inputMode="decimal" value={mFat} onChange={(e) => setMFat(e.target.value)} placeholder="15" />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={submit} loading={saving}>Catat</Button>
        </div>
      </div>
    </Modal>
  );
}
