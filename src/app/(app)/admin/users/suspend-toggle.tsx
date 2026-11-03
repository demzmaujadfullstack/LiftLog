"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Play } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { setSuspendedAction } from "../actions";

export function SuspendToggle({
  userId,
  userName,
  suspended,
  canManage,
}: {
  userId: string;
  userName: string;
  suspended: boolean;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function apply() {
    setBusy(true);
    const r = await setSuspendedAction(userId, !suspended);
    setBusy(false);
    if (r.ok) {
      toast(suspended ? "Akun diaktifkan kembali." : "Akun ditangguhkan.");
      router.refresh();
    } else {
      toast(r.error ?? "Gagal mengubah status akun.", "error");
      setOpen(false);
    }
  }

  if (!canManage) {
    return <span className="text-[11px] text-muted-2">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          suspended
            ? "flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-success transition hover:border-success/40"
            : "flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-warning transition hover:border-warning/40"
        }
      >
        {suspended ? <Play size={11} /> : <Ban size={11} />}
        {suspended ? "Aktifkan" : "Tangguhkan"}
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={apply}
        loading={busy}
        title={suspended ? `Aktifkan ${userName}?` : `Tangguhkan ${userName}?`}
        message={
          suspended
            ? "Pengguna akan bisa login dan mengakses datanya kembali."
            : "Pengguna tidak bisa login sampai diaktifkan kembali. Datanya tetap tersimpan."
        }
      />
    </>
  );
}
