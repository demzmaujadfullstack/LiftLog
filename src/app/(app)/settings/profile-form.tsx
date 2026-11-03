"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { profileSchema } from "@/lib/validations";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type FormValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; heightCm: number | null; birthDate: string | null; gender: string | null; bio: string | null };
}) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // field dengan .default/.optional membuat tipe input zod berbeda dari output; form selalu menyediakan nilai
    resolver: zodResolver(profileSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: {
      name: initial.name,
      email: initial.email,
      heightCm: initial.heightCm ?? undefined,
      birthDate: initial.birthDate ?? undefined,
      gender: (initial.gender as "MALE" | "FEMALE" | "OTHER" | undefined) ?? undefined,
      bio: initial.bio ?? undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    const r = await updateProfileAction(values);
    if (r.ok) {
      toast("Profil diperbarui.");
      router.refresh();
    } else toast(r.error ?? "Gagal memperbarui profil.", "error");
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Profil</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted">Informasi dasar akun dan tubuh Anda.</p>
      <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" required error={errors.name?.message}>
            <Input {...register("name")} invalid={!!errors.name} />
          </Field>
          <Field label="Email" required error={errors.email?.message}>
            <Input {...register("email")} type="email" invalid={!!errors.email} />
          </Field>
          <Field label="Tinggi Badan (cm)" error={errors.heightCm?.message}>
            <Input {...register("heightCm")} type="number" inputMode="decimal" step={0.5} placeholder="170" invalid={!!errors.heightCm} />
          </Field>
          <Field label="Tanggal Lahir" hint="opsional">
            <Input {...register("birthDate")} type="date" />
          </Field>
          <Field label="Jenis Kelamin">
            <Select {...register("gender")}>
              <option value="">— belum diset —</option>
              <option value="MALE">Laki-laki</option>
              <option value="FEMALE">Perempuan</option>
              <option value="OTHER">Lainnya</option>
            </Select>
          </Field>
        </div>
        <Field label="Bio" hint="maks 500 karakter" error={errors.bio?.message}>
          <Textarea {...register("bio")} rows={3} placeholder="Tentang tujuan latihan Anda…" />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            Simpan Profil
          </Button>
        </div>
      </form>
    </Card>
  );
}
