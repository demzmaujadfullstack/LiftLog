"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createExerciseAction, updateExerciseAction } from "@/app/(app)/exercises/actions";
import { exerciseSchema } from "@/lib/validations";
import { MUSCLE_LABELS, EQUIPMENT_LABELS, TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/utils";

type FormValues = z.infer<typeof exerciseSchema>;

export function ExerciseForm({
  exerciseId,
  initial,
}: {
  exerciseId?: string;
  initial?: FormValues;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // secondaryMuscles punya .default([]) sehingga tipe input zod berbeda dari output;
    // formulir selalu menyediakan array, jadi resolver-nya di-cast ke tipe output.
    resolver: zodResolver(exerciseSchema) as unknown as Resolver<FormValues, unknown, FormValues>,
    defaultValues: initial ?? {
      name: "",
      description: "",
      primaryMuscle: "CHEST",
      secondaryMuscles: [],
      equipment: "BARBELL",
      type: "STRENGTH",
      instructions: "",
      difficulty: "BEGINNER",
    },
  });

  const secondary = watch("secondaryMuscles") ?? [];

  async function onSubmit(values: FormValues) {
    const result = exerciseId
      ? await updateExerciseAction(exerciseId, values)
      : await createExerciseAction(values);
    if (result.ok) {
      toast(exerciseId ? "Latihan diperbarui." : "Latihan kustom dibuat.");
      if (result.id) router.push(`/exercises/${result.id}`);
      else router.push("/exercises");
    } else {
      toast(result.error ?? "Gagal menyimpan.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/exercises"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:text-foreground hover:bg-surface-2 transition"
          aria-label="Kembali"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">
          {exerciseId ? "Edit Latihan Kustom" : "Buat Latihan Kustom"}
        </h1>
      </div>

      <Card className="p-5 sm:p-6">
        <form method="post" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Field label="Nama Latihan" error={errors.name?.message} required>
            <Input placeholder="mis. Landmine Press" invalid={!!errors.name} {...register("name")} />
          </Field>

          <Field label="Deskripsi" error={errors.description?.message}>
            <Textarea placeholder="Deskripsi singkat latihan..." rows={2} invalid={!!errors.description} {...register("description")} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Otot Utama" required>
              <Select {...register("primaryMuscle")}>
                {Object.entries(MUSCLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tingkat Kesulitan" required>
              <Select {...register("difficulty")}>
                {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Alat" required>
              <Select {...register("equipment")}>
                {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tipe" required>
              <Select {...register("type")}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Otot Pendukung" hint="Klik untuk menambah/menghapus.">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MUSCLE_LABELS)
                .filter(([k]) => k !== watch("primaryMuscle"))
                .map(([k, v]) => {
                  const active = (secondary as string[]).includes(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? secondary.filter((m) => m !== k)
                          : [...secondary, k];
                        setValue("secondaryMuscles", next as FormValues["secondaryMuscles"], {
                          shouldDirty: true,
                        });
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                        active
                          ? "border-accent/40 bg-accent-soft text-accent"
                          : "border-line text-muted hover:bg-surface-2"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
            </div>
          </Field>

          <Field label="Instruksi" error={errors.instructions?.message}>
            <Textarea
              placeholder="Langkah-langkah melakukan latihan dengan benar..."
              rows={4}
              invalid={!!errors.instructions}
              {...register("instructions")}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/exercises"
              className="flex h-10 items-center rounded-xl px-4 text-sm text-muted hover:text-foreground transition"
            >
              Batal
            </Link>
            <Button type="submit" loading={isSubmitting} size="lg">
              {exerciseId ? "Simpan Perubahan" : "Buat Latihan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
