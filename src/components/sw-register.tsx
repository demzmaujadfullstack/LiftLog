"use client";

import { useEffect } from "react";
import { syncPendingQueue } from "@/lib/offline/sync";

export function SWRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Sinkronkan antrean offline saat service worker meminta (mis. connectivity restore).
    const onMessage = (event: MessageEvent) => {
      if (event.data === "LIFTLOG_FLUSH_QUEUE") {
        syncPendingQueue().catch(() => {});
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // service worker tidak tersedia — aplikasi tetap berjalan normal
      });
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  return null;
}
