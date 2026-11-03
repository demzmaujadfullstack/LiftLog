"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { profileSchema, changePasswordSchema } from "@/lib/validations";

export type SettingsActionResult = { ok: boolean; error?: string };

export async function updateProfileAction(input: unknown): Promise<SettingsActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const email = d.email.trim().toLowerCase();
  const clash = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (clash) return { ok: false, error: "Email sudah dipakai akun lain." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: d.name.trim(), email },
    }),
    prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        heightCm: d.heightCm ?? null,
        birthDate: d.birthDate ? new Date(d.birthDate) : null,
        gender: d.gender ?? null,
        bio: d.bio?.trim() || null,
      },
      update: {
        heightCm: d.heightCm ?? null,
        birthDate: d.birthDate ? new Date(d.birthDate) : null,
        gender: d.gender ?? null,
        bio: d.bio?.trim() || null,
      },
    }),
  ]);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(input: unknown): Promise<SettingsActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const d = parsed.data;

  const account = await prisma.user.findUnique({ where: { id: user.id } });
  if (!account?.passwordHash) {
    return { ok: false, error: "Akun ini tidak memiliki kata sandi (login lewat provider)." };
  }
  const valid = await bcrypt.compare(d.currentPassword, account.passwordHash);
  if (!valid) return { ok: false, error: "Kata sandi saat ini salah." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(d.newPassword, 12) },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccountAction(confirm: string): Promise<SettingsActionResult> {
  const user = await requireUser();
  if (confirm !== "HAPUS") return { ok: false, error: 'Ketik "HAPUS" untuk konfirmasi.' };

  await prisma.user.delete({ where: { id: user.id } });
  revalidatePath("/", "layout");
  return { ok: true };
}
