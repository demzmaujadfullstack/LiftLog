"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { forgotPasswordAction, forgotPasswordFormAction } from "../actions";
import { forgotPasswordSchema } from "@/lib/validations";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    const fd = new FormData();
    fd.set("email", values.email);
    try {
      const result = await forgotPasswordAction(fd);
      if (result.ok) {
        setSent(true);
        if (result.resetUrl) setDevResetUrl(result.resetUrl);
      } else {
        setError(result.error ?? "Gagal memproses permintaan.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight">Lupa password</h1>
      <p className="mt-1 text-xs text-muted">
        Masukkan email akun Anda. Kami akan mengirim link untuk mengatur ulang password.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      {sent ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center animate-fade-in">
          <CheckCircle2 size={36} className="text-success" />
          <p className="text-sm font-medium">Permintaan terkirim</p>
          <p className="text-xs text-muted max-w-xs">
            Jika email tersebut terdaftar, link reset password telah dikirim dan berlaku 1 jam.
          </p>
          {devResetUrl && (
            <div className="mt-2 w-full rounded-xl border border-accent/25 bg-accent-soft px-4 py-3">
              <p className="text-[11px] font-medium text-accent">
                Mode development — link reset (email server belum dikonfigurasi):
              </p>
              <Link href={devResetUrl} className="mt-1 block break-all text-[11px] text-foreground underline">
                {devResetUrl}
              </Link>
            </div>
          )}
          <Link href="/login" className="mt-2 text-xs text-accent hover:underline">
            Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <form
          // fallback tanpa-JS/hidrasi lambat: submit native POST ke server action
          method="post"
          action={forgotPasswordFormAction}
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <Field label="Email" error={errors.email?.message} required>
            <Input type="email" autoComplete="email" placeholder="nama@email.com" invalid={!!errors.email} {...register("email")} />
          </Field>
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            {!isSubmitting && <KeyRound size={16} />}
            Kirim Link Reset
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        Ingat password Anda?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Masuk
        </Link>
      </p>
    </Card>
  );
}
