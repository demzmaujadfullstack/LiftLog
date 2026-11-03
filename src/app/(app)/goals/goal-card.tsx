"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  deleteGoalAction,
  setGoalStatusAction,
  updateGoalProgressAction,
} from "./actions";
import { GoalFormModal, type GoalValues } from "./goal-form-modal";

export type GoalCardData = {
  id: string;
  title: string;
  type: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startValue: number | null;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  deadline: string | null;
  serverNow: number;
  exerciseName: string | null;
  milestones: { id: string; value: number; note: string | null; date: string }[];
  formValues: GoalValues;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tercapai",
  ABANDONED: "Ditutup",
};

export function GoalCard({
  goal,
  exercises,
}: {
  goal: GoalCardData;
  exercises: { id: string; name: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [progressValue, setProgressValue] = useState(goal.currentValue?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const start = goal.startValue ?? 0;
  const current = goal.currentValue;
  const span = goal.targetValue - start;
  const pct =
    current == null || span === 0
      ? current != null && span === 0
        ? 100
        : 0
      : Math.max(0, Math.min(100, Math.round(((current - start) / span) * 100)));

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - goal.serverNow) / 86_400_000)
    : null;
  const overdue = goal.status === "ACTIVE" && daysLeft != null && daysLeft < 0;

  async function saveProgress() {
    if (progressValue === "") return;
    const n = Number(progressValue);
    if (!Number.isFinite(n)) {
      toast("Nilai progres tidak valid.", "error");
      return;
    }
    setBusy(true);
    const r = await updateGoalProgressAction(goal.id, n);
    setBusy(false);
    if (r.ok) {
      toast("Progres goal tersimpan.");
      router.refresh();
    } else toast(r.error ?? "Gagal menyimpan progres.", "error");
  }

  async function setStatus(status: "ACTIVE" | "COMPLETED" | "ABANDONED") {
    setBusy(true);
    const r = await setGoalStatusAction(goal.id, status);
    setBusy(false);
    if (r.ok) {
      toast(status === "COMPLETED" ? "Goal tercapai! 🎉" : status === "ABANDONED" ? "Goal ditutup." : "Goal diaktifkan lagi.");
      router.refresh();
    } else toast(r.error ?? "Gagal mengubah status.", "error");
  }

  async function confirmDelete() {
    setBusy(true);
    const r = await deleteGoalAction(goal.id);
    setBusy(false);
    if (r.ok) {
      toast("Goal dihapus.");
      router.refresh();
    } else {
      toast(r.error ?? "Gagal menghapus.", "error");
      setDeleteOpen(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong",
        goal.status === "ABANDONED" && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{goal.title}</h3>
            <Badge
              variant={
                goal.status === "COMPLETED"
                  ? "success"
                  : goal.status === "ABANDONED"
                    ? "default"
                    : "accent"
              }
            >
              {STATUS_LABEL[goal.status]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            {goal.exerciseName ? `${goal.exerciseName} · ` : ""}
            target {formatNumber(goal.targetValue)}
            {goal.unit ? ` ${goal.unit}` : ""}
            {goal.startValue != null ? ` dari ${formatNumber(goal.startValue)}` : ""}
          </p>
          {goal.deadline && (
            <p className={cn("mt-0.5 text-xs", overdue ? "text-danger" : "text-muted")}>
              {overdue
                ? `Lewat ${Math.abs(daysLeft!)} hari dari deadline ${formatDate(goal.deadline)}`
                : `${daysLeft} hari tersisa · deadline ${formatDate(goal.deadline)}`}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setEditOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-accent/40 hover:text-accent transition"
            aria-label={`Edit goal ${goal.title}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:border-danger/40 hover:bg-danger-soft hover:text-danger transition"
            aria-label={`Hapus goal ${goal.title}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs text-muted">Progres</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {current != null ? formatNumber(current) : "—"}
            {goal.unit ? ` ${goal.unit}` : ""}
            <span className="ml-1 text-xs font-normal text-muted">({pct}%)</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-3">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              goal.status === "COMPLETED" ? "bg-success" : "bg-accent"
            )}
            style={{ width: `${goal.status === "COMPLETED" ? 100 : pct}%` }}
          />
        </div>
      </div>

      {goal.status === "ACTIVE" ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step={0.1}
            value={progressValue}
            onChange={(e) => setProgressValue(e.target.value)}
            placeholder="nilai terbaru"
            className="h-9 max-w-32"
            aria-label="Nilai progres terbaru"
          />
          <Button size="sm" variant="secondary" onClick={saveProgress} loading={busy} disabled={progressValue === ""}>
            Update
          </Button>
          <button
            onClick={() => setStatus("COMPLETED")}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-3 hover:text-success transition"
          >
            <CheckCircle2 size={13} /> Tandai Tercapai
          </button>
        </div>
      ) : goal.status === "COMPLETED" ? (
        <button
          onClick={() => setStatus("ACTIVE")}
          className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-3 hover:text-foreground transition"
        >
          <RotateCcw size={13} /> Buka lagi
        </button>
      ) : (
        <button
          onClick={() => setStatus("ACTIVE")}
          className="flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-3 hover:text-foreground transition"
        >
          <RotateCcw size={13} /> Aktifkan lagi
        </button>
      )}

      {goal.milestones.length > 0 && (
        <div>
          <button
            onClick={() => setShowMilestones((s) => !s)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition"
            aria-expanded={showMilestones}
          >
            <ChevronDown
              size={13}
              className={cn("transition-transform", showMilestones && "rotate-180")}
            />
            Riwayat ({goal.milestones.length})
          </button>
          {showMilestones && (
            <ul className="animate-slide-up mt-2 flex flex-col gap-1 border-l border-line pl-3">
              {goal.milestones.map((m) => (
                <li key={m.id} className="text-xs text-muted">
                  <span className="font-medium text-foreground tabular-nums">
                    {formatNumber(m.value)}
                    {goal.unit ? ` ${goal.unit}` : ""}
                  </span>{" "}
                  · {formatDate(m.date)}
                  {m.note && <span className="text-muted-2"> — {m.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {goal.status !== "ABANDONED" && (
        <button
          onClick={() => setStatus("ABANDONED")}
          className="flex w-fit items-center gap-1 text-xs text-muted-2 hover:text-danger transition"
        >
          <XCircle size={12} /> Tutup goal
        </button>
      )}

      <GoalFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={goal.formValues}
        exercises={exercises}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        loading={busy}
        title="Hapus goal?"
        message="Goal beserta seluruh riwayat milestone akan dihapus permanen."
      />
    </div>
  );
}
