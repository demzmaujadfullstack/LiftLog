"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { progressPhotoSchema } from "@/lib/validations";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  getStorageDriver,
  StorageNotConfiguredError,
  type StoredObject,
} from "@/lib/storage";

export type PhotoActionResult = { ok: boolean; error?: string };

export async function uploadPhotoAction(formData: FormData): Promise<PhotoActionResult> {
  const user = await requireUser();

  const parsed = progressPhotoSchema.safeParse({
    angle: formData.get("angle"),
    takenAt: formData.get("takenAt"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "Pilih file gambar dulu." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Format harus JPG, PNG, atau WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Ukuran gambar maksimal 10 MB." };
  }

  const count = await prisma.progressPhoto.count({ where: { userId: user.id } });
  if (count >= 200) return { ok: false, error: "Maksimal 200 foto. Hapus yang lama dulu." };

  const buf = Buffer.from(await file.arrayBuffer());
  let stored: StoredObject;
  try {
    stored = await getStorageDriver().put(user.id, buf, file.type);
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) {
      return {
        ok: false,
        error:
          "Penyimpanan foto belum aktif di server. Admin harus menambahkan BLOB_READ_WRITE_TOKEN lalu deploy ulang.",
      };
    }
    return { ok: false, error: "Gagal menyimpan gambar ke penyimpanan. Coba lagi atau gunakan ukuran lebih kecil." };
  }

  await prisma.progressPhoto.create({
    data: {
      userId: user.id,
      angle: parsed.data.angle,
      takenAt: new Date(parsed.data.takenAt),
      url: stored.url,
      storageKey: stored.key,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  revalidatePath("/progress-photos");
  return { ok: true };
}

export async function deletePhotoAction(id: string): Promise<PhotoActionResult> {
  const user = await requireUser();
  const photo = await prisma.progressPhoto.findFirst({ where: { id, userId: user.id } });
  if (!photo) return { ok: false, error: "Foto tidak ditemukan." };

  await prisma.progressPhoto.delete({ where: { id } });
  try {
    if (photo.storageKey) await getStorageDriver().delete(photo.storageKey);
  } catch {
    // baris DB sudah terhapus; aset yatim dibersihkan manual
  }

  revalidatePath("/progress-photos");
  return { ok: true };
}
