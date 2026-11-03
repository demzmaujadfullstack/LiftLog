import Link from "next/link";
import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(500px 250px at 50% 0%, rgba(190,242,100,0.08), transparent 70%)",
        }}
        aria-hidden
      />
      <Link href="/" className="relative mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-black">
          <Dumbbell size={20} strokeWidth={2.4} />
        </span>
        <span className="text-lg font-bold tracking-tight">
          LIFT<span className="text-accent">LOG</span>
        </span>
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
      <p className="relative mt-8 text-[11px] text-muted-2">
        Track Every Rep. Build Your Progress.
      </p>
    </main>
  );
}
