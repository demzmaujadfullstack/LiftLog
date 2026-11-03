"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { changePasswordAction } from "./actions";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function save() {
    setError(null);
    if (next !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setSaving(true);
    const r = await changePasswordAction({ currentPassword: current, newPassword: next });
    setSaving(false);
    if (r.ok) {
      toast("Kata sandi diganti.");
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    } else setError(r.error ?? "Gagal mengganti kata sandi.");
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Kata Sandi</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted">Minimal 8 karakter, mengandung huruf dan angka.</p>
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <Field label="Kata Sandi Saat Ini" required>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-2 hover:text-foreground"
              aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kata Sandi Baru" required>
            <Input
              type={show ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Konfirmasi" required>
            <Input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} loading={saving} disabled={!current || !next}>
            Ganti Kata Sandi
          </Button>
        </div>
      </div>
    </Card>
  );
}
