import { connection } from "next/server";

/**
 * Waktu server-side yang aman dipanggil saat render: `connection()`
 * menandai render sebagai dinamis sehingga Date.now() tidak melanggar purity.
 */
export async function nowMs(): Promise<number> {
  await connection();
  return Date.now();
}
