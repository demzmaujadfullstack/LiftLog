"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MeasurementFormModal } from "@/app/(app)/body-progress/measurement-form-modal";

export function AddMeasurementButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black hover:bg-accent-strong transition active:scale-[0.98]"
      >
        <Plus size={16} /> Catat Pengukuran
      </button>
      {open && <MeasurementFormModal open onClose={() => setOpen(false)} />}
    </>
  );
}
