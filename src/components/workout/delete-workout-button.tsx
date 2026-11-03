"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteWorkoutAction } from "@/app/(app)/workout/actions";

export function DeleteWorkoutButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function confirm() {
    setLoading(true);
    const result = await deleteWorkoutAction(id);
    setLoading(false);
    if (result.ok) {
      toast("Workout dihapus.");
      router.push("/workout");
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
        aria-label="Hapus workout"
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={loading}
        title="Hapus workout?"
        message="Sesi workout beserta seluruh set akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
      />
    </>
  );
}
