"use client";

import { useEffect } from "react";
import { offlineDb, type CachedExercise } from "@/lib/offline/db";

export function ExerciseCacheSync({ exercises }: { exercises: CachedExercise[] }) {
  useEffect(() => {
    if (!navigator.onLine || !offlineDb.available()) return;
    offlineDb.cacheExercises(exercises).catch(() => {});
  }, [exercises]);
  return null;
}
