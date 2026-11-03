"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dumbbell, Menu, X, LogOut, ChevronRight, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useSyncStatus } from "@/lib/offline/use-sync-status";

function NavLinks({
  pathname,
  isAdmin,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-accent-soft text-accent font-semibold"
                : "text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            <item.icon size={17} strokeWidth={active ? 2.3 : 2} />
            <span className="flex-1">{item.label}</span>
            {active && <ChevronRight size={14} className="opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  userName,
  userEmail,
  isAdmin,
  children,
}: {
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { online, pending } = useSyncStatus();

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <Link href="/overview" className="flex h-16 items-center gap-2 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black">
            <Dumbbell size={18} strokeWidth={2.4} />
          </span>
          <span className="text-base font-bold tracking-tight">
            LIFT<span className="text-accent">LOG</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
              {userName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{userName}</p>
              <p className="truncate text-[11px] text-muted-2">{userEmail}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-2 hover:text-danger transition-colors"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface animate-slide-up">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-base font-bold tracking-tight">
                LIFT<span className="text-accent">LOG</span>
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} isAdmin={isAdmin} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="border-t border-line p-3">
              <div className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{userName}</p>
                  <p className="truncate text-[11px] text-muted-2">{userEmail}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-muted-2 hover:text-danger transition-colors"
                  aria-label="Keluar"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Konten */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-background/85 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold tracking-tight">
            LIFT<span className="text-accent">LOG</span>
          </span>
          <span className="ml-auto flex items-center gap-2">
            {pending > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-warning" title={`${pending} data menunggu sinkronisasi`}>
                <RefreshCw size={11} className="animate-spin [animation-duration:3s]" />
                {pending}
              </span>
            )}
            {online ? (
              <Wifi size={14} className="text-success" aria-label="Online" />
            ) : (
              <WifiOff size={14} className="text-warning" aria-label="Offline" />
            )}
          </span>
        </header>

        {/* Indikator offline/pending desktop */}
        <div className="hidden lg:block">
          {(!online || pending > 0) && (
            <div className="flex items-center gap-2 border-b border-line bg-surface px-6 py-1.5 text-[11px] text-muted">
              {!online && (
                <span className="flex items-center gap-1.5 text-warning">
                  <WifiOff size={12} /> Mode offline — perubahan disimpan lokal
                </span>
              )}
              {pending > 0 && (
                <span className="flex items-center gap-1.5 text-accent">
                  <RefreshCw size={12} /> {pending} data menunggu sinkronisasi
                </span>
              )}
            </div>
          )}
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
