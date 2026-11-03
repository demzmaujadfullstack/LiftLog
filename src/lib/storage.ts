import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export type StoredObject = { url: string; key: string };

export interface StorageDriver {
  name: string;
  put(userId: string, data: Buffer, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

const MAGIC_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_IMAGE_TYPES = Object.keys(MAGIC_EXT);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function safeExt(contentType: string) {
  return MAGIC_EXT[contentType] ?? "jpg";
}

function fileName(userId: string) {
  return `${Date.now()}-${createHash("sha1").update(userId).digest("hex").slice(0, 8)}-${randomBytes(4).toString("hex")}`;
}

/**
 * Development driver — menyimpan file di public/uploads.
 * Filesystem Vercel bersifat sementara, jadi produksi harus memakai Blob via BLOB_READ_WRITE_TOKEN.
 */
const localDriver: StorageDriver = {
  name: "local",
  async put(userId, data, contentType) {
    const dir = path.join(process.cwd(), "public", "uploads", userId);
    await mkdir(dir, { recursive: true });
    const name = `${fileName(userId)}.${safeExt(contentType)}`;
    await writeFile(path.join(dir, name), data);
    return { url: `/uploads/${userId}/${name}`, key: `uploads/${userId}/${name}` };
  },
  async delete(key) {
    if (!key.startsWith("uploads/")) return;
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const abs = path.resolve(uploadsRoot, path.relative("uploads", key));
    if (!abs.startsWith(uploadsRoot)) return;
    await unlink(abs).catch(() => {});
  },
};

const blobDriver: StorageDriver = {
  name: "blob",
  async put(userId, data, contentType) {
    const { put } = await import("@vercel/blob");
    const res = await put(`${fileName(userId)}.${safeExt(contentType)}`, data, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      contentType,
    });
    return { url: res.url, key: res.pathname };
  },
  async delete(key) {
    try {
      const { del, head } = await import("@vercel/blob");
      const listed = await head(key);
      await del(listed.url);
    } catch {
      // file sudah hilang / token bermasalah — biarkan baris DB tetap dihapus
    }
  },
};

export function getStorageDriver(): StorageDriver {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobDriver : localDriver;
}
