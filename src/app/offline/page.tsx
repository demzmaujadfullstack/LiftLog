import type { Metadata } from "next";
import { OfflineStatus } from "./offline-status";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#bef264" strokeWidth="2" strokeLinecap="round">
          <path d="M6.5 6.5 17.5 17.5" />
          <path d="M4 10v4M20 10v4" />
          <path d="M7 8.5v7M17 8.5v7" />
          <line x1="2" y1="2" x2="22" y2="22" stroke="#71717a" />
        </svg>
      </div>
      <h1 className="text-lg font-bold tracking-tight">Kamu sedang offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Koneksi internet belum tersedia. Data workout dan nutrisi yang kamu catat tetap
        aman di perangkat dan otomatis disinkronkan saat koneksi pulih.
      </p>
      <OfflineStatus />
    </main>
  );
}
