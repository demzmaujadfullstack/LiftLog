import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Ruler, Scale } from "lucide-react";
import { BodyMetricsChart, type BodyPoint } from "@/components/body/body-metrics-chart";
import { MeasurementHistory, type Row } from "@/components/body/measurement-history";
import { AddMeasurementButton } from "@/components/body/add-measurement-button";
import { StatCard } from "@/components/ui/stat-card";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Progress Tubuh" };

export default async function BodyProgressPage() {
  const user = await requireUser();

  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 200,
  });

  const latest = measurements[0];
  const heightCm = measurements.find((m) => m.heightCm != null)?.heightCm ?? null;
  const bmi =
    latest?.weightKg && heightCm
      ? latest.weightKg / Math.pow(heightCm / 100, 2)
      : null;

  const points: BodyPoint[] = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date.toISOString().slice(0, 10),
      weightKg: m.weightKg,
      heightCm: m.heightCm,
      chestCm: m.chestCm,
      waistCm: m.waistCm,
      armCm: m.armCm,
      forearmCm: m.forearmCm,
      thighCm: m.thighCm,
      calfCm: m.calfCm,
      bodyFatPercent: m.bodyFatPercent,
    }));

  const rows: Row[] = measurements.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    weightKg: m.weightKg,
    heightCm: m.heightCm,
    chestCm: m.chestCm,
    waistCm: m.waistCm,
    armCm: m.armCm,
    forearmCm: m.forearmCm,
    thighCm: m.thighCm,
    calfCm: m.calfCm,
    bodyFatPercent: m.bodyFatPercent,
    notes: m.notes,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Progress Tubuh"
        description="Pantau transformasi fisik Anda dari waktu ke waktu."
        actions={<AddMeasurementButton />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Berat Terakhir" value={latest?.weightKg ? `${formatNumber(latest.weightKg, 1)} kg` : "—"} icon={Scale} />
        <StatCard label="Body Fat" value={latest?.bodyFatPercent ? `${formatNumber(latest.bodyFatPercent, 1)}%` : "—"} />
        <StatCard label="BMI" value={bmi ? formatNumber(bmi, 1) : "—"} sub={heightCm ? `tinggi ${formatNumber(heightCm, 0)} cm` : "isi tinggi badan"} />
        <StatCard label="Catatan" value={String(measurements.length)} sub="total pengukuran" />
      </div>

      {measurements.length === 0 ? (
        <EmptyState
          icon={<Ruler size={22} />}
          title="Belum ada pengukuran"
          description="Catat berat badan dan lingkar tubuh Anda untuk mulai melihat tren transformasi."
          action={<AddMeasurementButton />}
        />
      ) : (
        <>
          <Card className="mb-4 p-5">
            <h2 className="mb-4 text-sm font-semibold">Grafik Progres</h2>
            <BodyMetricsChart data={points} />
          </Card>
          <MeasurementHistory rows={rows} />
        </>
      )}
    </div>
  );
}
