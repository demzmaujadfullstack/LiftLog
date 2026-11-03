"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteExerciseAction } from "@/app/(app)/exercises/actions";

export function DeleteExerciseButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function confirm() {
    setLoading(true);
    const result = await deleteExerciseAction(id);
    setLoading(false);
    if (result.ok) {
      toast("Latihan kustom dihapus.");
      router.push("/exercises");
      router.refresh();
    } else {
      toast(result.error ?? "Gagal menghapus.", "error");
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:border-danger/40 hover:bg-danger-soft hover:text-danger transition"
        aria-label="Hapus latihan"
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={loading}
        title="Hapus latihan kustom?"
        message="Latihan akan dihapus permanen. Riwayat workout Anda tidak akan terpengaruh."
      />
    </>
  );
}
