"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteFoodItemAction, deleteNutritionLogAction } from "./actions";

export function DeleteNutritionItem({
  kind,
  id,
  label,
  className,
}: {
  kind: "log" | "food";
  id: string;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function confirm() {
    setBusy(true);
    const r = kind === "log" ? await deleteNutritionLogAction(id) : await deleteFoodItemAction(id);
    setBusy(false);
    if (r.ok) {
      toast(`${label} dihapus.`);
      router.refresh();
    } else {
      toast(r.error ?? "Gagal menghapus.", "error");
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? "text-muted-2 hover:text-danger transition"}
        aria-label={`Hapus ${label}`}
      >
        <Trash2 size={13} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={busy}
        title={`Hapus ${label}?`}
        message={kind === "food" ? "Makanan kustom akan dihapus dari daftar. Log lama tetap tersimpan." : "Entri ini akan dihapus dari catatan harian."}
      />
    </>
  );
}
