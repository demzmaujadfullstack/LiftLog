import Link from "next/link";
import {
  Dumbbell,
  LineChart,
  Apple,
  CalendarDays,
  Camera,
  Target,
  WifiOff,
  ShieldCheck,
  ArrowRight,
  Flame,
} from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Workout Tracking",
    desc: "Catat setiap set, rep, dan beban. Volume dihitung otomatis, PR terdeteksi langsung saat latihan.",
  },
  {
    icon: LineChart,
    title: "Strength Analytics",
    desc: "Grafik progresi kekuatan, estimasi 1RM (Epley), dan perbandingan performa bulan ke bulan.",
  },
  {
    icon: Apple,
    title: "Nutrition Tracker",
    desc: "Log makanan harian, target kalori dan makro, serta pantau asupan air — semua tersimpan rapi.",
  },
  {
    icon: CalendarDays,
    title: "Kalender & Streak",
    desc: "Lihat konsistensi latihan Anda dalam kalender bulanan dan jaga streak tetap menyala.",
  },
  {
    icon: Camera,
    title: "Progress Photos",
    desc: "Simpan foto transformasi depan, samping, dan belakang. Bandingkan sebelum dan sesudah.",
  },
  {
    icon: Target,
    title: "Goal Management",
    desc: "Target berat badan, bench press, squat, deadlift — dengan progres persentase dan deadline.",
  },
  {
    icon: WifiOff,
    title: "Offline Ready",
    desc: "Tetap bisa mencatat workout tanpa internet. Data tersinkron otomatis saat kembali online.",
  },
  {
    icon: ShieldCheck,
    title: "Privat & Aman",
    desc: "Setiap akun terisolasi penuh. Data latihan Anda hanya bisa diakses oleh Anda.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black">
              <Dumbbell size={18} strokeWidth={2.4} />
            </span>
            <span className="text-base font-bold tracking-tight">
              LIFT<span className="text-accent">LOG</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="h-9 rounded-xl px-4 text-sm text-muted hover:text-foreground transition-colors leading-9"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-black hover:bg-accent-strong transition-colors"
            >
              Daftar Gratis
              <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 0%, rgba(190,242,100,0.12), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted">
            <Flame size={13} className="text-accent" />
            Track Every Rep. Build Your Progress.
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Semua progres fitness Anda,
            <br />
            <span className="text-accent">dalam satu platform.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            LIFTLOG adalah platform tracking fitness dan bodybuilding: catat workout,
            pantau transformasi tubuh, ukur progresi kekuatan, dan kelola nutrisi —
            bahkan tanpa koneksi internet.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-8 text-sm font-semibold text-black shadow-[0_0_30px_rgba(190,242,100,0.25)] transition hover:bg-accent-strong active:scale-[0.98] sm:w-auto"
            >
              Mulai Sekarang — Gratis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-line-strong px-8 text-sm font-medium text-foreground transition hover:bg-surface-2 active:scale-[0.98] sm:w-auto"
            >
              Sudah punya akun
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Dibangun untuk atlet serius
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
            Bukan sekadar catatan. LIFTLOG menganalisis setiap repetisi untuk menunjukkan
            perkembangan nyata.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
                  <f.icon size={19} />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line/60">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="text-xs uppercase tracking-widest text-muted-2">
            Installable PWA — tampil seperti aplikasi native di Android & desktop
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-black hover:bg-accent-strong transition"
          >
            Buat Akun LIFTLOG
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/60 py-6">
        <p className="text-center text-xs text-muted-2">
          © {new Date().getFullYear()} LIFTLOG — Track Every Rep. Build Your Progress.
        </p>
      </footer>
    </main>
  );
}
