import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DeleteAccountSection } from "./delete-account";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Kelola profil, keamanan akun, dan data Anda."
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <Card className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold">{user.name ?? user.email}</p>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
          <Badge variant={user.role === "ADMIN" ? "accent" : "default"}>
            {user.role === "ADMIN" ? "Administrator" : "Pengguna"}
          </Badge>
        </Card>

        <ProfileForm
          initial={{
            name: user.name ?? "",
            email: user.email ?? "",
            heightCm: profile?.heightCm ?? null,
            birthDate: profile?.birthDate ? profile.birthDate.toISOString().slice(0, 10) : null,
            gender: profile?.gender ?? null,
            bio: profile?.bio ?? null,
          }}
        />
        <PasswordForm />
        <DeleteAccountSection />
      </div>
    </>
  );
}
