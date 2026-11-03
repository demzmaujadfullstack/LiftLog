"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Images, Trash2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn, PHOTO_ANGLE_LABELS, formatDate } from "@/lib/utils";
import { deletePhotoAction, uploadPhotoAction } from "./actions";

export type PhotoData = {
  id: string;
  url: string;
  angle: string;
  takenAt: string;
  notes: string | null;
};

const ANGLES = Object.keys(PHOTO_ANGLE_LABELS) as (keyof typeof PHOTO_ANGLE_LABELS)[];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function UploadPhotoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [angle, setAngle] = useState("FRONT");
  const [takenAt, setTakenAt] = useState(todayKey());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  function pick(f: File | null) {
    setError(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function save() {
    setError(null);
    if (!file) {
      setError("Pilih gambar dulu (JPG/PNG/WebP, maks 10 MB).");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.set("photo", file);
    fd.set("angle", angle);
    fd.set("takenAt", takenAt);
    fd.set("notes", notes.trim());
    try {
      const r = await uploadPhotoAction(fd);
      if (r.ok) {
        toast("Foto progres diunggah.");
        pick(null);
        onClose();
        router.refresh();
      } else setError(r.error ?? "Gagal mengunggah foto.");
    } catch {
      setError("Server menolak unggahan. Coba gambar lebih kecil atau hubungi admin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Unggah Foto Progres" size="md">
      <div className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-2.5 text-xs text-danger">
            {error}
          </div>
        )}
        <label
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface-2/40 p-4 transition hover:border-accent/40",
            preview && "border-solid"
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau foto" className="max-h-64 rounded-xl object-contain" />
          ) : (
            <>
              <Upload size={22} className="text-muted-2" />
              <span className="text-xs text-muted">Ketuk untuk memilih gambar</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sudut" required>
            <Select value={angle} onChange={(e) => setAngle(e.target.value)}>
              {ANGLES.map((a) => (
                <option key={a} value={a}>{PHOTO_ANGLE_LABELS[a]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tanggal Foto" required>
            <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          </Field>
        </div>
        <Field label="Catatan" hint="opsional">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="mis. minggu ke-8 cutting…" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={save} loading={saving} disabled={!file}>Unggah</Button>
        </div>
      </div>
    </Modal>
  );
}

export function UploadPhotoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload size={15} /> Unggah Foto
      </Button>
      {open && <UploadPhotoModal open onClose={() => setOpen(false)} />}
    </>
  );
}

export function ComparePhotos({ photos }: { photos: PhotoData[] }) {
  const [open, setOpen] = useState(false);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const a = photos.find((p) => p.id === aId);
  const b = photos.find((p) => p.id === bId);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={photos.length < 2}>
        <Images size={14} /> Bandingkan
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Before / After" size="lg">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sebelum">
              <Select value={aId} onChange={(e) => setAId(e.target.value)}>
                <option value="">— pilih —</option>
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatDate(p.takenAt)} · {PHOTO_ANGLE_LABELS[p.angle]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sesudah">
              <Select value={bId} onChange={(e) => setBId(e.target.value)}>
                <option value="">— pilih —</option>
                {photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatDate(p.takenAt)} · {PHOTO_ANGLE_LABELS[p.angle]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {a && b ? (
            <div className="grid grid-cols-2 gap-3">
              {[a, b].map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`${PHOTO_ANGLE_LABELS[p.angle]} ${formatDate(p.takenAt)}`} className="aspect-[3/4] w-full object-cover" />
                  <figcaption className="flex items-center justify-between px-3 py-2 text-[11px] text-muted">
                    <span>{formatDate(p.takenAt)}</span>
                    <Badge variant="accent">{PHOTO_ANGLE_LABELS[p.angle]}</Badge>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-muted">Pilih dua foto untuk membandingkan.</p>
          )}
        </div>
      </Modal>
    </>
  );
}

export function PhotoCard({ photo }: { photo: PhotoData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function confirm() {
    setBusy(true);
    const r = await deletePhotoAction(photo.id);
    setBusy(false);
    if (r.ok) {
      toast("Foto dihapus.");
      router.refresh();
    } else {
      toast(r.error ?? "Gagal menghapus.", "error");
      setOpen(false);
    }
  }

  return (
    <figure className="group overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={`Foto progres ${PHOTO_ANGLE_LABELS[photo.angle]} ${formatDate(photo.takenAt)}`}
          className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute left-2 top-2">
          <Badge variant="accent">{PHOTO_ANGLE_LABELS[photo.angle]}</Badge>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/55 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-danger"
          aria-label="Hapus foto"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <figcaption className="px-3 py-2">
        <p className="text-xs font-medium">{formatDate(photo.takenAt)}</p>
        {photo.notes && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">{photo.notes}</p>}
      </figcaption>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        loading={busy}
        title="Hapus foto?"
        message="Foto akan dihapus permanen dari galeri Anda."
      />
    </figure>
  );
}

export function PhotosEmpty() {
  return (
    <EmptyState
      icon={<Camera size={28} />}
      title="Belum ada foto progres"
      description="Dokumentasi perubahan tubuh dari waktu ke waktu. Foto bersifat privat — hanya Anda yang bisa melihatnya."
    />
  );
}
