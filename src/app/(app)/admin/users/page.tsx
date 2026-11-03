import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import { SuspendToggle } from "./suspend-toggle";

export const metadata = { title: "Admin — Pengguna" };

const PAGE_SIZE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const { q, page: rawPage } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(rawPage) || 1);

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => `/admin/users?page=${p}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <>
      <PageHeader title="Kelola Pengguna" description={`${total} pengguna terdaftar.`} />

      <form className="mb-4 max-w-sm" action="/admin/users">
        <Input name="q" defaultValue={query} placeholder="cari nama atau email…" aria-label="Cari pengguna" />
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-130 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
              <th className="px-4 py-3 font-medium">Pengguna</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Daftar</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-2/50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name ?? "(tanpa nama)"}</p>
                  <p className="text-[11px] text-muted-2">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === "ADMIN" ? "accent" : "default"}>{u.role === "ADMIN" ? "Admin" : "User"}</Badge>
                </td>
                <td className="px-4 py-3">
                  {u.suspended ? <Badge variant="danger">Ditangguhkan</Badge> : <Badge variant="success">Aktif</Badge>}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <SuspendToggle
                    userId={u.id}
                    userName={u.name ?? u.email}
                    suspended={u.suspended}
                    canManage={u.id !== admin.id && u.role !== "ADMIN"}
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs text-muted">
                  Tidak ada pengguna yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-2">
            Halaman {page} dari {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs(page - 1)} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-accent/40 transition">
                ← Sebelumnya
              </Link>
            )}
            {page < pages && (
              <Link href={qs(page + 1)} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-accent/40 transition">
                Berikutnya →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
