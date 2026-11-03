"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { PROGRAM_TEMPLATES } from "@/lib/program-templates";
import { createProgramFromTemplateAction } from "./actions";
import { useToast } from "@/components/ui/toast";

export function TemplateGallery() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function applyTemplate(key: string, name: string) {
    setBusyKey(key);
    const r = await createProgramFromTemplateAction(key);
    setBusyKey(null);
    if (r.ok && r.id) {
      toast(`Template ${name} ditambahkan sebagai program.`);
      router.push(`/programs/${r.id}`);
    } else toast(r.error ?? "Gagal membuat program.", "error");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {PROGRAM_TEMPLATES.filter((t) => t.days.length > 0).map((t) => (
        <div
          key={t.key}
          className="flex flex-col gap-2 rounded-2xl border border-line bg-surface/60 p-4 transition hover:border-accent/30"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-accent">
              <Layers size={15} />
            </div>
            <h3 className="text-sm font-semibold">{t.name}</h3>
          </div>
          <p className="text-xs text-muted">{t.description}</p>
          <p className="text-[11px] text-muted-2">
            {t.days.length} hari · {t.days.map((d) => d.name).join(" / ")}
          </p>
          <button
            onClick={() => applyTemplate(t.key, t.name)}
            disabled={busyKey !== null}
            className="mt-1 flex h-9 items-center justify-center rounded-xl bg-surface-2 text-xs font-semibold text-foreground transition hover:bg-accent-soft hover:text-accent disabled:opacity-50"
          >
            {busyKey === t.key ? "Membuat…" : "Gunakan Template"}
          </button>
        </div>
      ))}
    </div>
  );
}
