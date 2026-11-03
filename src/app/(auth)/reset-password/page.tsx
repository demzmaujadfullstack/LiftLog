"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { resetPasswordAction, resetPasswordFormAction } from "../actions";
import { resetPasswordSchema } from "@/lib/validations";

type FormValues = { password: string };

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema.pick({ password: true })),
  });

  if (!token) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <p className="text-sm font-semibold">Link tidak valid</p>
        <p className="mt-1 text-xs text-muted">Token reset tidak ditemukan pada URL.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-xs text-accent hover:underline">
          Minta link reset baru
        </Link>
      </Card>
    );
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    const fd = new FormData();
    fd.set("token", token);
    fd.set("password", values.password);
    try {
      const result = await resetPasswordAction(fd);
      if (result.ok) setDone(true);
      else setError(result.error ?? "Gagal mereset password.");
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
  }

  if (done) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <ShieldCheck size={36} className="mx-auto text-success" />
        <p className="mt-3 text-sm font-semibold">Password berhasil direset</p>
        <p className="mt-1 text-xs text-muted">Silakan masuk dengan password baru Anda.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-accent px-6 text-sm font-semibold text-black hover:bg-accent-strong transition"
        >
          Masuk
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight">Reset password</h1>
      <p className="mt-1 text-xs text-muted">Masukkan password baru untuk akun Anda.</p>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs text-danger">
          {error}
        </div>
      )}

      <form
        // fallback tanpa-JS/hidrasi lambat: submit native POST ke server action,
        // mencegah kredensial bocor ke query string saat form belum ter-hydrate
        method="post"
        action={resetPasswordFormAction}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <Field
          label="Password baru"
          error={errors.password?.message}
          hint="Minimal 8 karakter, mengandung huruf dan angka."
          required
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {!isSubmitting && <ShieldCheck size={16} />}
          Simpan Password Baru
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
