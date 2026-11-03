"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { registerAction, registerFormAction, type AuthActionResult } from "../actions";
import { registerSchema } from "@/lib/validations";
import { isRedirectError } from "@/lib/redirect-error";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("password", values.password);
    let result: AuthActionResult;
    try {
      result = await registerAction(fd);
    } catch (e) {
      if (isRedirectError(e)) throw e;
      result = { ok: false, error: "Terjadi kesalahan. Coba lagi." };
    }
    if (!result.ok) {
      if (result.field === "email") {
        setError("email", { message: result.error });
      } else {
        setFormError(result.error ?? "Gagal mendaftar.");
      }
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight">Buat akun LIFTLOG</h1>
      <p className="mt-1 text-xs text-muted">
        Gratis selamanya. Semua data latihan Anda privat.
      </p>

      {formError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-xs text-danger animate-fade-in"
        >
          {formError}
        </div>
      )}

      <form
        // fallback tanpa-JS/hidrasi lambat: submit native POST ke server action,
        // mencegah kredensial bocor ke query string saat form belum ter-hydrate
        method="post"
        action={registerFormAction}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
        noValidate
      >
        <Field label="Nama" error={errors.name?.message} required>
          <Input
            autoComplete="name"
            placeholder="Nama Anda"
            invalid={!!errors.name}
            {...register("name")}
          />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint="Minimal 8 karakter, mengandung huruf dan angka."
          required
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="pr-10"
              invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2 hover:text-foreground transition-colors"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {!isSubmitting && <UserPlus size={16} />}
          Daftar Sekarang
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Masuk
        </Link>
      </p>
    </Card>
  );
}
