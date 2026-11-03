"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cookie, Droplets, Plus, Salad, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { newIdempotencyKey } from "@/lib/offline/sync";
import { offlineDb } from "@/lib/offline/db";
import { logWaterAction } from "./actions";
import { FoodPickerModal, type FoodOption } from "./food-picker-modal";
import { CustomFoodModal, TargetFormModal, type TargetValues } from "./modals";

export function NutritionActions({
  date,
  foods,
  target,
}: {
  date: string;
  foods: FoodOption[];
  target: TargetValues;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [waterMl, setWaterMl] = useState("250");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function addWater(ml: number) {
    const key = newIdempotencyKey();
    const payload = { date, waterMl: ml, idempotencyKey: key };
    if (!navigator.onLine) {
      await offlineDb.queue({
        idempotencyKey: key,
        endpoint: "/api/sync/nutrition",
        method: "POST",
        payload: { ...payload, kind: "water" },
      });
      toast(`${ml} ml air dicatat offline.`);
      setWaterOpen(false);
      return;
    }
    setBusy(true);
    const r = await logWaterAction(payload);
    setBusy(false);
    if (r.ok) {
      toast(`${ml} ml air dicatat.`);
      setWaterOpen(false);
      router.refresh();
    } else toast(r.error ?? "Gagal mencatat air.", "error");
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPickerOpen(true)}>
          <Plus size={15} /> Catat Makanan
        </Button>
        <Button variant="secondary" onClick={() => setWaterOpen(true)}>
          <Droplets size={14} className="text-blue-400" /> Air
        </Button>
        <Button variant="outline" onClick={() => setFoodOpen(true)}>
          <Salad size={14} /> Makanan Kustom
        </Button>
        <Button variant="ghost" onClick={() => setTargetOpen(true)}>
          <Settings2 size={14} /> Target
        </Button>
      </div>

      <FoodPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} date={date} foods={foods} />
      <CustomFoodModal open={foodOpen} onClose={() => setFoodOpen(false)} />
      <TargetFormModal open={targetOpen} onClose={() => setTargetOpen(false)} initial={target} />

      <Modal open={waterOpen} onClose={() => setWaterOpen(false)} title="Catat Air Minum" size="sm">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 1000].map((ml) => (
              <Button key={ml} variant="secondary" onClick={() => addWater(ml)} disabled={busy}>
                {ml} ml
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              value={waterMl}
              onChange={(e) => setWaterMl(e.target.value)}
              className="max-w-32"
              aria-label="Jumlah air (ml)"
            />
            <span className="text-xs text-muted">ml</span>
            <Button size="sm" onClick={() => addWater(Number(waterMl))} disabled={busy || !Number(waterMl)}>
              <Cookie size={13} /> Catat
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
