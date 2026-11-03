"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "7 Hari" },
  { key: "30", label: "30 Hari" },
  { key: "90", label: "90 Hari" },
  { key: "365", label: "1 Tahun" },
  { key: "all", label: "Semua" },
];

export function RangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "30";

  function setRange(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Rentang waktu">
      {RANGES.map((r) => (
        <button
          key={r.key}
          role="tab"
          aria-selected={current === r.key}
          onClick={() => setRange(r.key)}
          className={cn(
            "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            current === r.key
              ? "bg-accent text-black"
              : "text-muted hover:bg-surface-2 hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
