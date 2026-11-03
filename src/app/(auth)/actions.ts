"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations";

export type AuthActionResult = { ok: boolean; error?: string; field?: string };

async function authRateOk(action: string): Promise<boolean> {
  const h = await headers();
  return rateLimit(`auth:${action}:${clientKey(h)}`, 10, 60_000);
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  if (!(await authRateOk("register"))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." };
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: first.path[0] as string };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar. Silakan login.", field: "email" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      role: "USER", // registrasi publik tidak pernah menghasilkan admin
      profile: { create: {} },
      nutritionTarget: { create: {} },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/overview",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { ok: false, error: "Akun dibuat, tetapi gagal login otomatis. Silakan login manual." };
    }
    throw e;
  }
  void user;
  return { ok: true };
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  if (!(await authRateOk("login"))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Email dan password wajib diisi." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirectTo: "/overview",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const msg = e.cause?.err?.message ?? e.message ?? "";
      if (String(msg).includes("ACCOUNT_SUSPENDED")) {
        return { ok: false, error: "Akun Anda ditangguhkan. Hubungi administrator." };
      }
      return { ok: false, error: "Email atau password salah." };
    }
    throw e;
  }
  return { ok: true };
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult & { resetUrl?: string }> {
  if (!(await authRateOk("forgot"))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." };
  }

  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Email tidak valid.", field: "email" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // selalu balas sama, jangan bocorkan apakah email terdaftar
  if (!user) return { ok: true };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 jam
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;

  if (process.env.NODE_ENV !== "production") {
    // tanpa provider email, tampilkan link di development agar fitur tetap dapat diuji
    return { ok: true, resetUrl };
  }

  console.info(`[LIFTLOG] Password reset requested for ${email}. Configure SMTP/Resend to deliver: ${resetUrl}`);
  return { ok: true };
}

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  if (!(await authRateOk("reset"))) {
    return { ok: false, error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." };
  }

  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, field: "password" };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "Token reset tidak valid atau kedaluwarsa. Minta ulang link reset." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // token lama lainnya untuk user ini dibuat hangus
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, id: { not: record.id }, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

// Fallback submit native (pra-hidrasi / tanpa JS): hasil dibuang agar cocok dengan
// tipe form action React; NEXT_REDIRECT dari signIn di dalam action tetap diteruskan.
export async function loginFormAction(formData: FormData): Promise<void> {
  await loginAction(formData);
}

export async function registerFormAction(formData: FormData): Promise<void> {
  await registerAction(formData);
}

export async function forgotPasswordFormAction(formData: FormData): Promise<void> {
  await forgotPasswordAction(formData);
}

export async function resetPasswordFormAction(formData: FormData): Promise<void> {
  await resetPasswordAction(formData);
}
