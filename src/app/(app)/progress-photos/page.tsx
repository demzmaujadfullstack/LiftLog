import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { cn, PHOTO_ANGLE_LABELS } from "@/lib/utils";
import { ComparePhotos, PhotoCard, PhotosEmpty, UploadPhotoButton, type PhotoData } from "./gallery";

export const metadata = { title: "Foto Progres" };

const ANGLES = ["ALL", "FRONT", "SIDE", "BACK"] as const;

export default async function ProgressPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ angle?: string }>;
}) {
  const user = await requireUser();
  const { angle: raw } = await searchParams;
  const angle = (ANGLES as readonly string[]).includes(raw ?? "") ? raw! : "ALL";

  const rows = await prisma.progressPhoto.findMany({
    where: { userId: user.id, ...(angle === "ALL" ? {} : { angle: angle as "FRONT" | "SIDE" | "BACK" }) },
    orderBy: { takenAt: "desc" },
  });

  const photos: PhotoData[] = rows.map((p) => ({
    id: p.id,
    url: p.url,
    angle: p.angle,
    takenAt: p.takenAt.toISOString(),
    notes: p.notes,
  }));

  return (
    <>
      <PageHeader
        title="Foto Progres"
        description="Dokumentasi privat perubahan tubuh Anda dari waktu ke waktu."
        actions={
          <div className="flex items-center gap-2">
            <ComparePhotos photos={photos} />
            <UploadPhotoButton />
          </div>
        }
      />

      <div className="mb-5 flex gap-1 rounded-xl bg-surface p-1" role="tablist" aria-label="Filter sudut foto">
        {ANGLES.map((a) => (
          <a
            key={a}
            href={a === "ALL" ? "/progress-photos" : `/progress-photos?angle=${a}`}
            role="tab"
            aria-selected={angle === a}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition",
              angle === a ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
            )}
          >
            {a === "ALL" ? "Semua" : PHOTO_ANGLE_LABELS[a]}
          </a>
        ))}
      </div>

      {photos.length === 0 ? (
        <PhotosEmpty />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} />
          ))}
        </div>
      )}
    </>
  );
}
