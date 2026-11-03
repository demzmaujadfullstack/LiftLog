export type PickerExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  type: string;
  difficulty: string;
  isSystem: boolean;
};

export type PreviousPerformance = {
  date: string;
  sets: { setNumber: number; reps: number; weightKg: number; rpe: number | null }[];
};
