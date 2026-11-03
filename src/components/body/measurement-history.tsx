"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, GitCompareArrows } from "lucide-react";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteMeasurementAction } from "@/app/(app)/body-progress/actions";
import { MeasurementFormModal, type MeasurementValues } from "@/app/(app)/body-progress/measurement-form-modal";
import { formatDate, formatNumber } from "@/lib/utils";

export type Row = MeasurementValues & { id: string };

const COLS: { key: keyof MeasurementValues; label: string; unit: string }[] = [
  { key: "weightKg", label: "Berat", unit: "kg" },
  { key: "chestCm", label: "Dada", unit: "cm" },
  { key: "waistCm", label: "Pinggang", unit: "cm" },
  { key: "armCm", label: "Lengan", unit: "cm" },
  { key: "thighCm", label: "Paha", unit: "cm" },
  { key: "calfCm", label: "Betis", unit: "cm" },
  { key: "bodyFatPercent", label: "BF", unit: "%" },
];

function cell(v: number | null | undefined, unit: string) {
  if (v == null) return "—";
  return `${formatNumber(v, unit === "%" ? 1 : 1)}${unit === "%" ? "%" : ""}`;
}

export function MeasurementHistory({ rows }: { rows: Row[] }) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [loadingDel, setLoadingDel] = useState(false);
  const [compareA, setCompareA] = useState<Row | null>(null);
  const [compareB, setCompareB] = useState<Row | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function confirmDelete() {
    if (!deleting) return;
    setLoadingDel(true);
    const result = await deleteMeasurementAction(deleting.id);
    setLoadingDel(false);
    if (result.ok) {
      toast("Pengukuran dihapus.");
      setDeleting(null);
      router.refresh();
    } else {
      toast(result.error ?? "Gagal menghapus.", "error");
    }
  }

  function openCompare() {
    if (rows.length < 2) {
      toast("Butuh minimal 2 catatan pengukuran untuk membandingkan.", "info");
      return;
    }
    setCompareA(rows[rows.length - 1]);
    setCompareB(rows[0]);
    setCompareOpen(true);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Riwayat Pengukuran</h2>
        <button
          onClick={openCompare}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-medium text-muted hover:text-foreground hover:border-accent/40 transition"
        >
          <GitCompareArrows size={13} /> Bandingkan
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left text-[10px] uppercase tracking-wider text-muted-2">
              <th className="px-4 py-2.5 font-medium">Tanggal</th>
              {COLS.map((c) => (
                <th key={String(c.key)} className="px-3 py-2.5 font-medium text-right">{c.label}</th>
              ))}
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/40 transition-colors">
                <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{formatDate(r.date)}</td>
                {COLS.map((c) => (
                  <td key={String(c.key)} className="px-3 py-2.5 text-right tabular-nums text-xs">
                    {cell(r[c.key] as number | null, c.unit)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button
                    onClick={() => setEditing(r)}
                    className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-2 hover:bg-surface-3 hover:text-foreground transition"
                    aria-label={`Edit pengukuran ${formatDate(r.date)}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleting(r)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-2 hover:bg-danger-soft hover:text-danger transition"
                    aria-label={`Hapus pengukuran ${formatDate(r.date)}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <MeasurementFormModal open onClose={() => setEditing(null)} initial={editing} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={loadingDel}
        title="Hapus pengukuran?"
        message={`Catatan ${deleting ? formatDate(deleting.date) : ""} akan dihapus permanen.`}
      />

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Perbandingan Sebelum vs Sesudah" size="md">
        <div className="grid grid-cols-2 gap-3">
          <CompareSelect label="Sebelum" rows={rows} value={compareA} onChange={setCompareA} />
          <CompareSelect label="Sesudah" rows={rows} value={compareB} onChange={setCompareB} />
        </div>
        {compareA && compareB && (
          <div className="mt-4 flex flex-col gap-1.5">
            {COLS.map((c) => {
              const a = compareA[c.key] as number | null;
              const b = compareB[c.key] as number | null;
              if (a == null && b == null) return null;
              const diff = a != null && b != null ? b - a : null;
              return (
                <div key={String(c.key)} className="flex items-center justify-between rounded-xl bg-surface-2 px-3.5 py-2 text-xs">
                  <span className="text-muted">{c.label}</span>
                  <span className="tabular-nums">
                    {cell(a, c.unit)} → {cell(b, c.unit)}
                    {diff != null && diff !== 0 && (
                      <span className={cnDiff(diff, c.key)}>({diff > 0 ? "+" : ""}{formatNumber(diff, 1)})</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

function cnDiff(diff: number, key: keyof MeasurementValues): string {
  // turun itu bagus untuk berat/BF/pinggang; naik bagus untuk lingkar otot
  const lowerIsBetter = key === "weightKg" || key === "bodyFatPercent" || key === "waistCm";
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return ` ml-2 text-[11px] font-semibold tabular-nums ${good ? "text-success" : "text-danger"}`;
}

function CompareSelect({
  label,
  rows,
  value,
  onChange,
}: {
  label: string;
  rows: Row[];
  value: Row | null;
  onChange: (r: Row) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-muted">{label}</p>
      <select
        value={value?.id ?? ""}
        onChange={(e) => {
          const r = rows.find((x) => x.id === e.target.value);
          if (r) onChange(r);
        }}
        className="h-9 w-full rounded-xl border border-line bg-surface-2 px-3 text-xs focus:outline-none focus:border-accent/60"
      >
        {rows.map((r) => (
          <option key={r.id} value={r.id}>{formatDate(r.date)}</option>
        ))}
      </select>
    </div>
  );
}
