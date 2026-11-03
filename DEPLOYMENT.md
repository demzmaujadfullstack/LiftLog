# Deploy LIFTLOG ke Vercel

## 1. Prasyarat database

PostgreSQL lokal tidak bisa diakses Vercel langsung. Untuk produksi, pakai
penyimpanan database hosted, misalnya:

- Neon (neon.tech) — gratis, PostgreSQL serverless, integrasi langsung Vercel
- Supabase — proyek PostgreSQL
- Vercel Postgres (Marketplace → Storage)

Salin connection string-nya, format:
`postgresql://USER:PASSWORD@HOST/db?sslmode=require&channel_binding=require`

## 2. Environment variables (Project → Settings → Environment Variables)

Lihat `.env.example` untuk daftar lengkap. Wajib diisi:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL hosted (dengan `sslmode=require`) |
| `AUTH_SECRET` | Hasilkan: `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | URL produksi, mis. `https://liftlog.vercel.app` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Opsional, untuk bootstrap admin saat seed |
| `BLOB_READ_WRITE_TOKEN` | **Sangat disarankan.** Tanpa ini, upload foto progress masuk ke
  filesystem sementara Vercel dan hilang saat redeploy. Buat di Vercel Dashboard →
  Storage → Blob, lalu driver `src/lib/storage.ts` otomatis memakainya. |

## 3. Build & migrasi

Jalankan migrasi ke database produksi **sekali** dari mesin lokal (bukan
`db push`, jangan `--force-reset`):

```bash
DATABASE_URL="postgresql://...hosted..." npx prisma migrate deploy
DATABASE_URL="postgresql://...hosted..." npx prisma db seed   # opsional: admin + latihan bawaan
```

Lalu deploy:

```bash
npm i -g vercel
vercel env pull .env.local   # opsional, uji lokal dengan env produksi
vercel --prod
```

`next build` sudah terverifikasi lolos (rute lengkap terdeteksi, `/offline` statis).

## 4. PWA

- `public/manifest.webmanifest` + `public/sw.js` + ikon sudah terpasang.
- Service worker hanya terdaftar pada build produksi (`npm run dev` tidak mendaftarkannya).
- Kebijakan cache: aset statis saja; halaman privat dan `/api/*` tidak pernah di-cache;
  navigasi offline menampilkan `/offline`.

## 5. Catatan keamanan

- Registrasi publik selalu mendapat role `USER`; admin hanya via seed/env.
- Semua otorisasi ownership diverifikasi server-side dari sesi, bukan dari input klien.
- Admin tidak dapat membuka record workout/ukuran tubuh/foto pengguna lain —
  dashboard admin hanya menampilkan agregat dan latihan sistem.
- Form auth memakai fallback `method="post" + server action` sehingga submit
  sebelum hidrasi tidak membocorkan kredensial ke URL.
