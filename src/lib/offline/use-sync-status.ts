"use client";

import { useEffect, useState, useCallback } from "react";
import { offlineDb } from "./db";
import { useOnline } from "./use-online";

export function useSyncStatus(): { online: boolean; pending: number; refresh: () => void } {
  const online = useOnline();
  const [pending, setPending] = useState(0);

  const refresh = useCallback(() => {
    if (!offlineDb.available()) return;
    offlineDb
      .getQueue()
      .then((q) => setPending(q.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();

    const goOnline = () => {
      // sinkronisasi foreground saat kembali online
      import("./sync").then((m) => m.syncPendingQueue()).then(refresh).catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        import("./sync").then((m) => m.syncPendingQueue()).then(refresh).catch(() => {});
      }
      refresh();
    };

    window.addEventListener("online", goOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(refresh, 5000);

    return () => {
      window.removeEventListener("online", goOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [refresh]);

  return { online, pending, refresh };
}
