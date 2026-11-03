"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { deleteAccountAction } from "./actions";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function doDelete() {
    setBusy(true);
    const r = await deleteAccountAction(confirm);
    if (r.ok) {
      await signOut({ callbackUrl: "/login" });
      return;
    }
    setBusy(false);
    toast(r.error ?? "Gagal menghapus akun.", "error");
  }

  return (
    <>
      <div className="rounded-2xl border border-danger/25 bg-danger-soft/40 p-5">
        <h2 className="text-sm font-semibold text-danger">Zona Berbahaya</h2>
        <p className="mt-1 mb-3 text-xs text-muted">
          Menghapus akun akan menghilangkan seluruh workout, pengukuran, goal, dan foto progres Anda secara permanen.
        </p>
        <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
          Hapus Akun
        </Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Hapus Akun Permanen" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            Ketik <span className="font-mono font-semibold text-danger">HAPUS</span> untuk mengonfirmasi. Data Anda tidak dapat dipulihkan.
          </p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="HAPUS" aria-label="Konfirmasi penghapusan" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={doDelete} loading={busy} disabled={confirm !== "HAPUS"}>
              Ya, Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
