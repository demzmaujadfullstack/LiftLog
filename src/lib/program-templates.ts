export type TemplateExercise = {
  name: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
};

export type TemplateDay = {
  name: string;
  exercises: TemplateExercise[];
};

export type ProgramTemplate = {
  key: string;
  name: string;
  description: string;
  days: TemplateDay[];
};

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    key: "push-pull-legs",
    name: "Push Pull Legs",
    description: "Split 6 hari klasik: dorong, tarik, kaki. Cocok untuk hipertrofi dengan frekuensi tinggi.",
    days: [
      {
        name: "Push",
        exercises: [
          { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, restSeconds: 180 },
          { name: "Overhead Press (Barbell)", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Tricep Rope Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { name: "Overhead Tricep Extension (Dumbbell)", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { name: "Deadlift", targetSets: 3, targetRepsMin: 3, targetRepsMax: 5, restSeconds: 240 },
          { name: "Pull Up", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Barbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 150 },
          { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Face Pull", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 90 },
          { name: "Barbell Curl", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Barbell Back Squat", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 210 },
          { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 150 },
          { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 150 },
          { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Lying Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Standing Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
      {
        name: "Push (Volume)",
        exercises: [
          { name: "Dumbbell Shoulder Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Cable Crossover", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Lateral Raise", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
          { name: "Skull Crusher", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
          { name: "Cable Curl", targetSets: 2, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
      {
        name: "Pull (Volume)",
        exercises: [
          { name: "Lat Pulldown", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "T-Bar Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 150 },
          { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Rear Delt Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Dumbbell Hammer Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Face Pull", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: "Legs (Volume)",
        exercises: [
          { name: "Front Squat", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, restSeconds: 180 },
          { name: "Bulgarian Split Squat", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Hip Thrust", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 150 },
          { name: "Seated Leg Curl", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Walking Lunge", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Seated Calf Raise", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    key: "upper-lower",
    name: "Upper Lower",
    description: "Split 4 hari atas/bawah. Seimbang untuk kekuatan dan otot.",
    days: [
      {
        name: "Upper (Strength)",
        exercises: [
          { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 180 },
          { name: "Barbell Row", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8, restSeconds: 180 },
          { name: "Overhead Press (Barbell)", targetSets: 3, targetRepsMin: 6, targetRepsMax: 8, restSeconds: 150 },
          { name: "Pull Up", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Barbell Curl", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 90 },
          { name: "Skull Crusher", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 90 },
        ],
      },
      {
        name: "Lower (Strength)",
        exercises: [
          { name: "Barbell Back Squat", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 210 },
          { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 150 },
          { name: "Leg Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 150 },
          { name: "Lying Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Standing Calf Raise", targetSets: 4, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
      {
        name: "Upper (Hypertrophy)",
        exercises: [
          { name: "Incline Dumbbell Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Lat Pulldown", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Dumbbell Shoulder Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { name: "Tricep Rope Pushdown", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
      {
        name: "Lower (Hypertrophy)",
        exercises: [
          { name: "Deadlift", targetSets: 3, targetRepsMin: 3, targetRepsMax: 5, restSeconds: 240 },
          { name: "Bulgarian Split Squat", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Hip Thrust", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 150 },
          { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Seated Leg Curl", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Seated Calf Raise", targetSets: 4, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    key: "bro-split",
    name: "Bro Split",
    description: "Split 5 hari per kelompok otot. Volume tinggi per otot, frekuensi sekali seminggu.",
    days: [
      {
        name: "Chest",
        exercises: [
          { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180 },
          { name: "Incline Dumbbell Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Dumbbell Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Cable Crossover", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Dip (Chest Focus)", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
        ],
      },
      {
        name: "Back",
        exercises: [
          { name: "Deadlift", targetSets: 4, targetRepsMin: 3, targetRepsMax: 6, restSeconds: 240 },
          { name: "Pull Up", targetSets: 4, targetRepsMin: 6, targetRepsMax: 12, restSeconds: 150 },
          { name: "Barbell Row", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 150 },
          { name: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
      {
        name: "Shoulders",
        exercises: [
          { name: "Overhead Press (Barbell)", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Dumbbell Shoulder Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { name: "Rear Delt Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Face Pull", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { name: "Barbell Back Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 210 },
          { name: "Leg Press", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 150 },
          { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 150 },
          { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Lying Leg Curl", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Standing Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: "Arms & Abs",
        exercises: [
          { name: "Barbell Curl", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
          { name: "Dumbbell Hammer Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Tricep Rope Pushdown", targetSets: 4, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { name: "Overhead Tricep Extension (Dumbbell)", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { name: "Cable Crunch", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
    ],
  },
  {
    key: "full-body",
    name: "Full Body",
    description: "3 hari seluruh tubuh. Ideal untuk pemula dan jadwal padat.",
    days: [
      {
        name: "Full Body A",
        exercises: [
          { name: "Barbell Back Squat", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180 },
          { name: "Barbell Bench Press", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180 },
          { name: "Barbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10, restSeconds: 150 },
          { name: "Lateral Raise", targetSets: 2, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
          { name: "Plank", targetSets: 3, targetRepsMin: 30, targetRepsMax: 60, restSeconds: 60 },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { name: "Deadlift", targetSets: 3, targetRepsMin: 3, targetRepsMax: 6, restSeconds: 240 },
          { name: "Overhead Press (Barbell)", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Pull Up", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150 },
          { name: "Walking Lunge", targetSets: 2, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90 },
        ],
      },
      {
        name: "Full Body C",
        exercises: [
          { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 150 },
          { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120 },
          { name: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 120 },
          { name: "Dumbbell Hammer Curl", targetSets: 2, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { name: "Tricep Rope Pushdown", targetSets: 2, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 90 },
        ],
      },
    ],
  },
  {
    key: "custom",
    name: "Custom Program",
    description: "Mulai dari nol dan susun program latihan Anda sendiri.",
    days: [],
  },
];
