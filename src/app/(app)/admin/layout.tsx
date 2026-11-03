import { requireAdmin } from "@/lib/session";
import { AdminTabs } from "./admin-tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft/40 px-3 py-2">
        <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
          Admin
        </span>
        <span className="text-xs text-muted">
          Panel platform — data privat pengguna (workout, foto, nutrisi) tidak ditampilkan di sini.
        </span>
      </div>
      <AdminTabs />
      {children}
    </div>
  );
}
