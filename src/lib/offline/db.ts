export type SyncItem = {
  id?: number;
  idempotencyKey: string;
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

export type WorkoutDraft = {
  id: string;
  title: string;
  notes?: string;
  performedAt: string;
  exercises: DraftExercise[];
  updatedAt: number;
};

export type DraftExercise = {
  exerciseId: string;
  exerciseName: string;
  order: number;
  notes?: string;
  sets: { setNumber: number; reps: number; weightKg: number; rpe?: number | null; isWarmup: boolean; isBodyweight: boolean }[];
};

export type CachedExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  type: string;
  difficulty: string;
  isSystem: boolean;
};

const DB_NAME = "liftlog-offline";
const DB_VERSION = 1;
const STORE_SYNC = "sync-queue";
const STORE_DRAFTS = "workout-drafts";
const STORE_EXERCISES = "exercise-cache";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        db.createObjectStore(STORE_SYNC, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_EXERCISES)) {
        db.createObjectStore(STORE_EXERCISES, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const offlineDb = {
  available: () => typeof indexedDB !== "undefined",

  async queue(item: Omit<SyncItem, "id" | "createdAt" | "attempts">): Promise<void> {
    await tx(STORE_SYNC, "readwrite", (s) =>
      s.add({ ...item, createdAt: Date.now(), attempts: 0 } as SyncItem)
    );
  },

  async getQueue(): Promise<SyncItem[]> {
    return tx(STORE_SYNC, "readonly", (s) => s.getAll() as IDBRequest<SyncItem[]>);
  },

  async removeQueued(id: number): Promise<void> {
    await tx(STORE_SYNC, "readwrite", (s) => s.delete(id));
  },

  async updateQueued(item: SyncItem): Promise<void> {
    await tx(STORE_SYNC, "readwrite", (s) => s.put(item));
  },

  async saveDraft(draft: WorkoutDraft): Promise<void> {
    await tx(STORE_DRAFTS, "readwrite", (s) => s.put({ ...draft, updatedAt: Date.now() }));
  },

  async getDraft(id: string): Promise<WorkoutDraft | undefined> {
    return tx(STORE_DRAFTS, "readonly", (s) => s.get(id) as IDBRequest<WorkoutDraft | undefined>);
  },

  async getAllDrafts(): Promise<WorkoutDraft[]> {
    return tx(STORE_DRAFTS, "readonly", (s) => s.getAll() as IDBRequest<WorkoutDraft[]>);
  },

  async deleteDraft(id: string): Promise<void> {
    await tx(STORE_DRAFTS, "readwrite", (s) => s.delete(id));
  },

  async cacheExercises(exercises: CachedExercise[]): Promise<void> {
    await tx(STORE_EXERCISES, "readwrite", (s) => {
      s.clear();
      let req: IDBRequest | null = null;
      for (const ex of exercises) req = s.put(ex);
      return req ?? (s.getAll() as IDBRequest);
    });
  },

  async getCachedExercises(): Promise<CachedExercise[]> {
    return tx(STORE_EXERCISES, "readonly", (s) => s.getAll() as IDBRequest<CachedExercise[]>);
  },
};
