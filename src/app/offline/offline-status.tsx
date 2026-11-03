"use client";

import { useEffect, useState } from "react";
import { offlineDb } from "@/lib/offline/db";
import { useOnline } from "@/lib/offline/use-online";

export function OfflineStatus() {
  const [pending, setPending] = useState<number | null>(null);
  const online = useOnline();

  useEffect(() => {
    offlineDb
      .getQueue()
      .then((q) => setPending(q.length))
      .catch(() => setPending(0));
  }, []);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {pending !== null && pending > 0 && (
        <p className="rounded-xl bg-surface-2 px-4 py-2 text-xs text-muted">
          <span className="font-semibold text-foreground">{pending}</span> perubahan menunggu
          sinkronisasi.
        </p>
      )}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-95"
      >
        {online ? "Coba lagi" : "Masih offline — cek ulang"}
      </button>
    </div>
  );
}
