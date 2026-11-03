import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { MuscleGroup, Equipment, ExerciseType, Difficulty } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type SeedExercise = {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  type: ExerciseType;
  difficulty: Difficulty;
  description: string;
  instructions: string;
};

const exercises: SeedExercise[] = [
  // CHEST
  { name: "Barbell Bench Press", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Latihan compound utama untuk dada menggunakan barbell.", instructions: "Berbaring di flat bench, genggam barbell sedikit lebih lebar dari bahu. Turunkan bar ke tengah dada dengan siku sekitar 45 derajat, lalu dorong ke atas hingga lengan lurus." },
  { name: "Incline Dumbbell Press", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS], equipment: Equipment.DUMBBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Press dumbbell pada bench miring untuk menargetkan dada atas.", instructions: "Atur bench 30-45 derajat. Dorong dumbbell ke atas dari posisi sejajar dada hingga lengan hampir lurus, lalu turunkan terkontrol." },
  { name: "Dumbbell Fly", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Gerakan isolasi dada dengan dumbbell.", instructions: "Berbaring di flat bench, buka lengan ke samping dengan siku sedikit menekuk hingga terasa regangan di dada, lalu pertemukan kembali dumbbell di atas dada." },
  { name: "Cable Crossover", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi dada menggunakan kabel untuk tegangan konstan.", instructions: "Berdiri di antara dua kabel, condongkan badan sedikit ke depan, tarik handle menyilang ke depan tubuh dengan lengan sedikit menekuk." },
  { name: "Push Up", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS, MuscleGroup.ABS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.BEGINNER, description: "Latihan bodyweight klasik untuk dada dan triceps.", instructions: "Posisi plank lurus, turunkan tubuh hingga dada hampir menyentuh lantai, lalu dorong kembali ke atas. Jaga core tetap kencang." },
  { name: "Dip (Chest Focus)", primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.INTERMEDIATE, description: "Dip dengan badan condong ke depan untuk fokus dada bawah.", instructions: "Naik ke parallel bars, condongkan torso ke depan sekitar 30 derajat, turunkan tubuh hingga siku 90 derajat, lalu dorong ke atas." },

  // BACK
  { name: "Deadlift", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES, MuscleGroup.QUADRICEPS, MuscleGroup.FOREARMS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.ADVANCED, description: "Compound lift seluruh tubuh, fokus posterior chain.", instructions: "Berdiri dengan barbell di atas tengah kaki. Tekuk pinggul, genggam bar, jaga punggung netral, dorong lantai menjauh hingga berdiri tegak. Turunkan dengan pola yang sama." },
  { name: "Pull Up", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.FOREARMS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.INTERMEDIATE, description: "Latihan bodyweight utama untuk lebar punggung.", instructions: "Gantung di bar dengan grip sedikit lebih lebar dari bahu. Tarik tubuh hingga dagu melewati bar, turunkan terkontrol hingga lengan lurus." },
  { name: "Barbell Row", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.HAMSTRINGS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Rowing barbell untuk ketebalan punggung.", instructions: "Bungkukkan torso hingga hampir paralel lantai, punggung netral. Tarik bar ke arah perut bawah, lalu turunkan terkontrol." },
  { name: "Lat Pulldown", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS], equipment: Equipment.MACHINE, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Mesin pulldown untuk melatih latissimus.", instructions: "Duduk di mesin, genggam bar lebar. Tarik bar ke arah dada atas dengan memimpin menggunakan siku, lalu kembali terkontrol." },
  { name: "Seated Cable Row", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS], equipment: Equipment.CABLE, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Rowing kabel untuk punggung tengah.", instructions: "Duduk tegak, tarik handle ke arah perut dengan siku rapat ke tubuh, busungkan dada di akhir gerakan." },
  { name: "T-Bar Row", primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.HAMSTRINGS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Variasi row dengan beban tebal untuk punggung tengah.", instructions: "Posisikan tubuh di atas T-bar, bungukkan pinggul, tarik beban ke arah dada bawah dengan siku ke belakang." },

  // SHOULDERS
  { name: "Overhead Press (Barbell)", primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.ABS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Press barbell overhead untuk kekuatan bahu.", instructions: "Berdiri tegak, bar di rak depan bahu. Dorong bar lurus ke atas hingga lengan terkunci, kepala sedikit maju saat bar melewati wajah." },
  { name: "Dumbbell Shoulder Press", primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS], equipment: Equipment.DUMBBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Press dumbbell untuk deltoid.", instructions: "Duduk atau berdiri, dumbbell di sisi kepala. Dorong ke atas hingga hampir bersentuhan, turunkan terkontrol." },
  { name: "Lateral Raise", primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi deltoid samping.", instructions: "Berdiri dengan dumbbell di sisi tubuh, naikkan lengan ke samping hingga sejajar bahu dengan siku sedikit menekuk, turunkan perlahan." },
  { name: "Face Pull", primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.BACK], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Kesehatan bahu dan rear delt menggunakan tali kabel.", instructions: "Atur kabel setinggi wajah, tarik tali ke arah wajah dengan siku tinggi, akhiri dengan posisi seperti double biceps." },
  { name: "Rear Delt Fly", primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.BACK], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi deltoid belakang.", instructions: "Bungkukkan torso hingga hampir paralel lantai, buka dumbbell ke samping hingga sejajar tubuh." },

  // BICEPS
  { name: "Barbell Curl", primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS], equipment: Equipment.BARBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Curl barbell klasik untuk biceps.", instructions: "Berdiri tegak, siku rapat di sisi tubuh. Tekuk siku mengangkat bar ke arah bahu, turunkan terkontrol tanpa mengayun badan." },
  { name: "Dumbbell Hammer Curl", primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Curl grip netral untuk brachialis dan forearm.", instructions: "Pegang dumbbell dengan telapak saling berhadapan, tekuk siku mengangkat beban ke arah bahu." },
  { name: "Incline Dumbbell Curl", primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.INTERMEDIATE, description: "Curl di bench miring untuk peregangan biceps maksimal.", instructions: "Duduk di bench 45 derajat, biarkan lengan menggantung, curl dumbbell ke atas sambil menjaga siku tetap di belakang tubuh." },
  { name: "Preacher Curl", primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Curl dengan sandaran untuk isolasi ketat.", instructions: "Sandarkan lengan atas di pad, curl beban ke arah bahu lalu turunkan hingga lengan hampir lurus." },
  { name: "Cable Curl", primaryMuscle: MuscleGroup.BICEPS, secondaryMuscles: [MuscleGroup.FOREARMS], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Curl kabel dengan tegangan konstan.", instructions: "Berdiri menghadap katrol bawah, tekuk siku menarik bar ke arah bahu, turunkan perlahan." },

  // TRICEPS
  { name: "Close-Grip Bench Press", primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Bench press grip sempit untuk triceps.", instructions: "Genggam bar selebar bahu, turunkan ke dada bawah dengan siku rapat, dorong kembali ke atas." },
  { name: "Tricep Rope Pushdown", primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Pushdown kabel dengan tali untuk triceps.", instructions: "Berdiri menghadap katrol atas, siku rapat di sisi tubuh. Luruskan lengan ke bawah dan buka tali di akhir gerakan." },
  { name: "Skull Crusher", primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [], equipment: Equipment.BARBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.INTERMEDIATE, description: "Ekstensi triceps berbaring dengan EZ bar atau barbell.", instructions: "Berbaring, turunkan bar ke arah dahi dengan menekuk siku, lalu luruskan kembali ke atas." },
  { name: "Overhead Tricep Extension (Dumbbell)", primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Ekstensi overhead untuk kepala panjang triceps.", instructions: "Pegang satu dumbbell dengan dua tangan di atas kepala, turunkan ke belakang kepala dengan menekuk siku, luruskan kembali." },

  // FOREARMS
  { name: "Wrist Curl", primaryMuscle: MuscleGroup.FOREARMS, secondaryMuscles: [], equipment: Equipment.DUMBBELL, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi fleksor lengan bawah.", instructions: "Duduk, sandarkan lengan bawah di paha dengan telapak menghadap atas, tekuk pergelangan mengangkat beban." },
  { name: "Farmer's Walk", primaryMuscle: MuscleGroup.FOREARMS, secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.BACK], equipment: Equipment.DUMBBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Carry beban berat untuk grip dan core.", instructions: "Ambil dumbbell atau kettlebell berat di kedua tangan, berjalan dengan postur tegak sejauh jarak yang ditentukan." },

  // QUADRICEPS
  { name: "Barbell Back Squat", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS, MuscleGroup.ABS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Squat barbell, raja latihan kaki.", instructions: "Tempatkan bar di upper back, buka selebar bahu. Turunkan pinggul dan lutut hingga paha setidaknya paralel lantai, lalu dorong kembali ke atas." },
  { name: "Front Squat", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.ABS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.ADVANCED, description: "Squat dengan bar di depan untuk fokus quad dan core.", instructions: "Rack bar di deltoid depan dengan siku tinggi, squat dalam dengan torso tegak." },
  { name: "Leg Press", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS], equipment: Equipment.MACHINE, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Mesin press kaki untuk volume quad yang aman.", instructions: "Duduk di mesin, dorong platform dengan kaki hingga lutut hampir lurus (jangan dikunci), turunkan terkontrol." },
  { name: "Leg Extension", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi quadriceps menggunakan mesin.", instructions: "Duduk di mesin, luruskan kaki mengangkat beban, tahan sebentar, turunkan perlahan." },
  { name: "Walking Lunge", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS], equipment: Equipment.DUMBBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Lunge berjalan untuk kaki unilateral.", instructions: "Langkah maju, turunkan lutut belakang hampir menyentuh lantai, dorong kembali dan melangkah ke kaki berikutnya." },
  { name: "Bulgarian Split Squat", primaryMuscle: MuscleGroup.QUADRICEPS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS], equipment: Equipment.DUMBBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Split squat dengan kaki belakang ditinggikan.", instructions: "Letakkan kaki belakang di bench, turunkan tubuh lurus ke bawah hingga lutut depan 90 derajat, dorong kembali." },

  // HAMSTRINGS
  { name: "Romanian Deadlift", primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.BACK], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.INTERMEDIATE, description: "Hip hinge untuk hamstring dan glutes.", instructions: "Pegang barbell di depan paha, dorong pinggul ke belakang sambil menurunkan bar sepanjang kaki dengan punggung netral, kembali berdiri dengan mengencangkan glutes." },
  { name: "Lying Leg Curl", primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.CALVES], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Isolasi hamstring dengan mesin curl.", instructions: "Berbaring tengkurap, tekuk lutut mengangkat pad ke arah glutes, turunkan terkontrol." },
  { name: "Seated Leg Curl", primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Curl hamstring posisi duduk.", instructions: "Duduk di mesin, tekuk lutut menarik pad ke bawah, kembali perlahan." },
  { name: "Nordic Hamstring Curl", primaryMuscle: MuscleGroup.HAMSTRINGS, secondaryMuscles: [MuscleGroup.GLUTES], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.ADVANCED, description: "Latihan eccentric hamstring tingkat lanjut.", instructions: "Berlutut dengan pergelangan kaki ditahan, turunkan tubuh ke depan perlahan menggunakan hamstring, dorong kembali." },

  // GLUTES
  { name: "Hip Thrust", primaryMuscle: MuscleGroup.GLUTES, secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.QUADRICEPS], equipment: Equipment.BARBELL, type: ExerciseType.STRENGTH, difficulty: Difficulty.BEGINNER, description: "Latihan utama untuk kekuatan dan hipertrofi glutes.", instructions: "Sandarkan punggung atas di bench, bar di pinggul. Dorong pinggul ke atas hingga tubuh lurus dari bahu ke lutut, squeeze glutes di puncak." },
  { name: "Glute Bridge", primaryMuscle: MuscleGroup.GLUTES, secondaryMuscles: [MuscleGroup.HAMSTRINGS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.BEGINNER, description: "Bridge bodyweight untuk aktivasi glutes.", instructions: "Berbaring telentang, tekuk lutut, angkat pinggul ke atas dengan mengencangkan glutes." },
  { name: "Cable Kickback", primaryMuscle: MuscleGroup.GLUTES, secondaryMuscles: [MuscleGroup.HAMSTRINGS], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Kickback kabel untuk isolasi glutes.", instructions: "Pasang ankle strap di katrol bawah, tendang kaki lurus ke belakang dengan mengencangkan glutes." },

  // CALVES
  { name: "Standing Calf Raise", primaryMuscle: MuscleGroup.CALVES, secondaryMuscles: [], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Calf raise berdiri untuk gastrocnemius.", instructions: "Berdiri di mesin dengan bantalan di bahu, angkat tumit setinggi mungkin, turunkan hingga terasa regangan." },
  { name: "Seated Calf Raise", primaryMuscle: MuscleGroup.CALVES, secondaryMuscles: [], equipment: Equipment.MACHINE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Calf raise duduk untuk soleus.", instructions: "Duduk di mesin, angkat tumit maksimal, turunkan perlahan dengan regangan penuh." },

  // ABS
  { name: "Plank", primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [MuscleGroup.SHOULDERS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.BEGINNER, description: "Isometrik core fundamental.", instructions: "Tahan posisi forearm plank dengan tubuh lurus dari kepala ke tumit, kencangkan perut dan glutes." },
  { name: "Hanging Leg Raise", primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [MuscleGroup.FOREARMS], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.INTERMEDIATE, description: "Leg raise menggantung untuk perut bawah.", instructions: "Gantung di pull-up bar, angkat kaki lurus hingga sejajar lantai atau lebih tinggi tanpa mengayun." },
  { name: "Cable Crunch", primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [], equipment: Equipment.CABLE, type: ExerciseType.ISOLATION, difficulty: Difficulty.BEGINNER, description: "Crunch dengan beban menggunakan kabel.", instructions: "Berlutut menghadap katrol atas, tarik tali ke bawah dengan menekuk tulang belakang, bukan pinggul." },
  { name: "Russian Twist", primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [], equipment: Equipment.BODYWEIGHT, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.BEGINNER, description: "Rotasi core untuk obliques.", instructions: "Duduk dengan kaki terangkat sedikit, putar torso ke kiri dan kanan sambil memegang beban opsional." },
  { name: "Ab Wheel Rollout", primaryMuscle: MuscleGroup.ABS, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.BACK], equipment: Equipment.OTHER, type: ExerciseType.BODYWEIGHT, difficulty: Difficulty.ADVANCED, description: "Anti-extension core menggunakan roda ab.", instructions: "Berlutut memegang ab wheel, dorong ke depan sejauh kontrol memungkinkan, tarik kembali dengan perut." },
];

const foods = [
  { name: "Nasi Putih (masak)", caloriesKcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, servingSizeG: 100 },
  { name: "Dada Ayam (panggang)", caloriesKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, servingSizeG: 100 },
  { name: "Telur Ayam (rebus)", caloriesKcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, servingSizeG: 100 },
  { name: "Tempe Goreng", caloriesKcal: 337, proteinG: 20, carbsG: 14, fatG: 23, servingSizeG: 100 },
  { name: "Tahu Putih", caloriesKcal: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8, servingSizeG: 100 },
  { name: "Ikan Salmon (panggang)", caloriesKcal: 206, proteinG: 22, carbsG: 0, fatG: 12, servingSizeG: 100 },
  { name: "Daging Sapi (tanpa lemak)", caloriesKcal: 250, proteinG: 26, carbsG: 0, fatG: 15, servingSizeG: 100 },
  { name: "Pisang", caloriesKcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, servingSizeG: 100 },
  { name: "Oatmeal (kering)", caloriesKcal: 389, proteinG: 17, carbsG: 66, fatG: 7, servingSizeG: 100 },
  { name: "Selai Kacang", caloriesKcal: 588, proteinG: 25, carbsG: 20, fatG: 50, servingSizeG: 100 },
  { name: "Susu Full Cream", caloriesKcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, servingSizeG: 100 },
  { name: "Whey Protein (1 scoop)", caloriesKcal: 120, proteinG: 24, carbsG: 3, fatG: 1.5, servingSizeG: 30 },
  { name: "Alpukat", caloriesKcal: 160, proteinG: 2, carbsG: 9, fatG: 15, servingSizeG: 100 },
  { name: "Ubi Rebus", caloriesKcal: 90, proteinG: 2, carbsG: 21, fatG: 0.1, servingSizeG: 100 },
  { name: "Brokoli Kukus", caloriesKcal: 35, proteinG: 2.4, carbsG: 7, fatG: 0.4, servingSizeG: 100 },
];

async function main() {
  console.log("Seeding system exercises...");
  for (const ex of exercises) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isSystem: true },
    });
    if (!existing) {
      await prisma.exercise.create({
        data: { ...ex, isSystem: true },
      });
    }
  }

  console.log("Seeding system food items...");
  for (const food of foods) {
    const existing = await prisma.foodItem.findFirst({
      where: { name: food.name, isSystem: true },
    });
    if (!existing) {
      await prisma.foodItem.create({ data: { ...food, isSystem: true } });
    }
  }

  const exCount = await prisma.exercise.count();
  const foodCount = await prisma.foodItem.count();

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const existing = await prisma.user.findUnique({ where: { email: process.env.ADMIN_EMAIL } });
    if (existing) {
      if (existing.role !== "ADMIN") {
        await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
        console.log(`User ${process.env.ADMIN_EMAIL} dipromosikan menjadi ADMIN.`);
      }
    } else {
      const user = await prisma.user.create({
        data: {
          name: "Admin LIFTLOG",
          email: process.env.ADMIN_EMAIL,
          role: "ADMIN",
          emailVerified: new Date(),
          passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
          profile: { create: {} },
          nutritionTarget: { create: {} },
        },
      });
      console.log(`Admin dibuat: ${user.email}`);
    }
  } else {
    console.log("ADMIN_EMAIL/ADMIN_PASSWORD tidak diset — login admin dilewati.");
  }

  console.log(`Done. Exercises: ${exCount}, Food items: ${foodCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
