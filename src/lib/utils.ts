import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatKg(n: number, digits = 1): string {
  return `${formatNumber(n, digits)} kg`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function daysAgo(n: number): Date {
  const x = startOfDay(new Date());
  x.setDate(x.getDate() - n);
  return x;
}

// Epley formula: 1RM = weight x (1 + reps / 30)
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export function calcVolume(sets: { reps: number; weightKg: number }[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
}

export const MUSCLE_LABELS: Record<string, string> = {
  CHEST: "Dada",
  BACK: "Punggung",
  SHOULDERS: "Bahu",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  FOREARMS: "Lengan Bawah",
  QUADRICEPS: "Quadriceps",
  HAMSTRINGS: "Hamstring",
  GLUTES: "Glutes",
  CALVES: "Betis",
  ABS: "Perut",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  BARBELL: "Barbell",
  DUMBBELL: "Dumbbell",
  MACHINE: "Mesin",
  CABLE: "Kabel",
  BODYWEIGHT: "Bodyweight",
  KETTLEBELL: "Kettlebell",
  BAND: "Resistance Band",
  OTHER: "Lainnya",
};

export const TYPE_LABELS: Record<string, string> = {
  STRENGTH: "Strength",
  BODYWEIGHT: "Bodyweight",
  CARDIO: "Cardio",
  ISOLATION: "Isolasi",
  OLYMPIC: "Olympic",
  OTHER: "Lainnya",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Pemula",
  INTERMEDIATE: "Menengah",
  ADVANCED: "Lanjutan",
};

export const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Sarapan",
  LUNCH: "Makan Siang",
  DINNER: "Makan Malam",
  SNACK: "Snack",
};

export const PHOTO_ANGLE_LABELS: Record<string, string> = {
  FRONT: "Depan",
  SIDE: "Samping",
  BACK: "Belakang",
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  BODY_WEIGHT: "Berat Badan",
  BENCH_PRESS: "Bench Press",
  SQUAT: "Squat",
  DEADLIFT: "Deadlift",
  WEEKLY_WORKOUTS: "Target Latihan Mingguan",
  EXERCISE_WEIGHT: "Beban Latihan",
  OTHER: "Lainnya",
};
