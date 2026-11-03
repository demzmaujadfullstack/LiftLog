import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z.string().email("Email tidak valid").max(120),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter")
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72)
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z.string().email("Email tidak valid"),
  heightCm: z.coerce.number().min(100).max(250).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72)
    .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
    .regex(/[0-9]/, "Password harus mengandung angka"),
});

export const workoutSetSchema = z.object({
  setNumber: z.number().int().min(1).max(50),
  reps: z.number().int().min(0).max(1000),
  weightKg: z.number().min(0).max(1000),
  rpe: z.number().min(1).max(10).optional().nullable(),
  isWarmup: z.boolean().default(false),
  isBodyweight: z.boolean().default(false),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(0),
  notes: z.string().max(1000).optional().nullable(),
  sets: z.array(workoutSetSchema).min(1, "Minimal 1 set"),
});

export const workoutSessionSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(100),
  notes: z.string().max(2000).optional().nullable(),
  performedAt: z.string().min(1),
  durationMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  programDayId: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  idempotencyKey: z.string().max(64).optional().nullable(),
  exercises: z.array(workoutExerciseSchema).min(1, "Tambahkan minimal 1 latihan"),
});

export const exerciseSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(80),
  description: z.string().max(2000).optional().nullable(),
  primaryMuscle: z.enum([
    "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS",
    "QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ABS",
  ]),
  secondaryMuscles: z
    .array(z.enum([
      "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS",
      "QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ABS",
    ]))
    .default([]),
  equipment: z.enum(["BARBELL", "DUMBBELL", "MACHINE", "CABLE", "BODYWEIGHT", "KETTLEBELL", "BAND", "OTHER"]),
  type: z.enum(["STRENGTH", "BODYWEIGHT", "CARDIO", "ISOLATION", "OLYMPIC", "OTHER"]),
  instructions: z.string().max(4000).optional().nullable(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

export const programExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(0).default(0),
  targetSets: z.number().int().min(1).max(20).default(3),
  targetRepsMin: z.number().int().min(1).max(200).optional().nullable(),
  targetRepsMax: z.number().int().min(1).max(200).optional().nullable(),
  targetWeightKg: z.number().min(0).max(1000).optional().nullable(),
  restSeconds: z.number().int().min(0).max(1800).optional().nullable(),
});

export const workoutDaySchema = z.object({
  name: z.string().min(1, "Nama hari wajib diisi").max(60),
  dayIndex: z.number().int().min(0).max(20),
  exercises: z.array(programExerciseSchema).default([]),
});

export const programSchema = z.object({
  name: z.string().min(2, "Nama program minimal 2 karakter").max(80),
  description: z.string().max(1000).optional().nullable(),
  template: z.string().max(40).optional().nullable(),
  days: z.array(workoutDaySchema).default([]),
});

export const bodyMeasurementSchema = z.object({
  date: z.string().min(1),
  weightKg: z.number().min(20).max(400).optional().nullable(),
  heightCm: z.number().min(100).max(250).optional().nullable(),
  chestCm: z.number().min(30).max(250).optional().nullable(),
  waistCm: z.number().min(30).max(250).optional().nullable(),
  armCm: z.number().min(10).max(100).optional().nullable(),
  forearmCm: z.number().min(10).max(100).optional().nullable(),
  thighCm: z.number().min(20).max(150).optional().nullable(),
  calfCm: z.number().min(15).max(100).optional().nullable(),
  bodyFatPercent: z.number().min(2).max(70).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const nutritionTargetSchema = z.object({
  caloriesKcal: z.number().min(500).max(10000),
  proteinG: z.number().min(0).max(600),
  carbsG: z.number().min(0).max(1500),
  fatG: z.number().min(0).max(600),
  waterMl: z.number().min(0).max(15000),
});

export const foodItemSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  brand: z.string().max(100).optional().nullable(),
  caloriesKcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(500),
  servingSizeG: z.number().min(1).max(2000),
});

export const nutritionLogSchema = z.object({
  date: z.string().min(1),
  meal: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).default("SNACK"),
  foodItemId: z.string().optional().nullable(),
  name: z.string().min(1, "Nama makanan wajib diisi").max(120),
  servings: z.number().min(0.1).max(50),
  caloriesKcal: z.number().min(0).max(9999).optional().nullable(),
  proteinG: z.number().min(0).max(999).optional().nullable(),
  carbsG: z.number().min(0).max(999).optional().nullable(),
  fatG: z.number().min(0).max(999).optional().nullable(),
  idempotencyKey: z.string().max(64).optional().nullable(),
});

export const waterLogSchema = z.object({
  date: z.string().min(1),
  waterMl: z.number().min(10).max(5000),
  idempotencyKey: z.string().max(64).optional().nullable(),
});

export const goalSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(100),
  type: z.enum(["BODY_WEIGHT", "BENCH_PRESS", "SQUAT", "DEADLIFT", "WEEKLY_WORKOUTS", "EXERCISE_WEIGHT", "OTHER"]),
  exerciseId: z.string().optional().nullable(),
  startValue: z.number().optional().nullable(),
  targetValue: z.number().min(-1000).max(10000),
  currentValue: z.number().optional().nullable(),
  unit: z.string().max(10).optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const progressPhotoSchema = z.object({
  angle: z.enum(["FRONT", "SIDE", "BACK"]),
  takenAt: z.string().min(1),
  notes: z.string().max(500).optional().nullable(),
});
