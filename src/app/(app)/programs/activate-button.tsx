"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { activateProgramAction } from "./actions";

export function ActivateProgramButton({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function activate() {
    setBusy(true);
    const r = await activateProgramAction(id);
    setBusy(false);
    if (r.ok) {
      toast(`Program "${name}" sekarang aktif.`);
      router.refresh();
    } else toast(r.error ?? "Gagal mengaktifkan.", "error");
  }

  return (
    <Button size="sm" variant="secondary" onClick={activate} loading={busy}>
      <Star size={13} /> Aktifkan
    </Button>
  );
}
