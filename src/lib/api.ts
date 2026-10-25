"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "./store";
import type {
  Food,
  FoodLog,
  Profile,
  SavedMeal,
  SavedMealItem,
  ScanResult,
  TodayPayload,
  WaterLog,
  WeightEntry,
  Workout,
} from "./types";

/* ---------- helpers ---------- */

export function localDayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed`);
  return res.json();
}
async function jsend<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error((data as { message?: string }).message ?? "request failed"), {
      payload: data,
      status: res.status,
    });
  }
  return data as T;
}

/* ---------- today ---------- */

/** day param = viewed day on Today screen (defaults to today) */
export function useToday(day?: string) {
  const d = day ?? localDayStr();
  return useQuery<TodayPayload>({
    queryKey: ["today", d],
    queryFn: () => jget<TodayPayload>(`/api/today?date=${d}`),
    // transient pooler/network blips must not break the app (item 29)
    retry: 3,
    retryDelay: (attempt) => 1000 + attempt * 1500,
  });
}

/* ---------- profile ---------- */

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ["profile"],
    queryFn: () => jget<Profile>("/api/profile"),
    retry: 3,
    retryDelay: (attempt) => 1000 + attempt * 1500,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => jsend<Profile>("/api/profile", "PUT", patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/* ---------- foods ---------- */

export function useFoods(q: string, fav = false, sort?: "usage") {
  return useQuery<Food[]>({
    queryKey: ["foods", q, fav, sort ?? null],
    queryFn: () =>
      jget<Food[]>(
        `/api/foods?q=${encodeURIComponent(q)}&fav=${fav ? 1 : 0}${sort ? `&sort=${sort}` : ""}`
      ),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      jsend<Food>(`/api/foods/${id}`, "PATCH", { isFavorite }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useCreateFood() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => jsend<Food>("/api/foods", "POST", body),
  });
}

/* ---------- food logs ---------- */

export interface AddLogBody {
  name: string;
  dayDate: string;
  mealType: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source?: string;
  foodId?: string | null;
  loggedAt?: string;
  /** additive per-100g values + thumbnail */
  kcal100?: number;
  protein100?: number;
  carbs100?: number;
  fat100?: number;
  imageUrl?: string;
}

export function useAddFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddLogBody) => jsend<FoodLog>("/api/food-logs", "POST", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useDeleteFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsend<{ ok: boolean }>(`/api/food-logs/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/** edit grams (and proportionally recomputed totals) of an existing entry */
export function useUpdateFoodLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      grams?: number;
      kcal?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      kcal100?: number | null;
      protein100?: number | null;
      carbs100?: number | null;
      fat100?: number | null;
    }) => jsend<FoodLog>(`/api/food-logs/${id}`, "PATCH", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/* ---------- water ---------- */

export interface WaterPayload {
  date: string;
  total: number;
  entries: WaterLog[];
  week: { date: string; total: number }[];
}

export function useWater(day?: string) {
  const d = day ?? localDayStr();
  return useQuery<WaterPayload>({
    queryKey: ["water", d],
    queryFn: () => jget<WaterPayload>(`/api/water?date=${d}`),
  });
}

export function useAddWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amountMl: number) =>
      jsend<WaterLog>("/api/water", "POST", {
        amountMl,
        dayDate: useAppStore.getState().selectedDay ?? localDayStr(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water"] });
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useUndoWater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsend<{ ok: boolean }>(`/api/water/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water"] });
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/* ---------- weight ---------- */

export function useWeight() {
  return useQuery<WeightEntry[]>({
    queryKey: ["weight"],
    queryFn: () => jget<WeightEntry[]>("/api/weight"),
  });
}

export function useLogWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date: string; weightKg: number; note?: string }) =>
      jsend<WeightEntry>("/api/weight", "POST", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weight"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

/* ---------- workouts ---------- */

export interface WorkoutsPayload {
  month: string;
  workouts: Workout[];
  stats: {
    thisWeekCount: number;
    streak: number;
    counts: Record<string, number>;
    lastTrained: Record<string, string>;
    lastWorkoutDate: string | null;
  };
}

export function useWorkouts(month: string) {
  return useQuery<WorkoutsPayload>({
    queryKey: ["workouts", month],
    queryFn: () => jget<WorkoutsPayload>(`/api/workouts?month=${month}`),
  });
}

export function useAddWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date: string; muscleGroups: string[]; durationMin?: number; note?: string }) =>
      jsend<Workout>("/api/workouts", "POST", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; muscleGroups?: string[]; durationMin?: number; note?: string }) =>
      jsend<Workout>(`/api/workouts/${id}`, "PATCH", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsend<{ ok: boolean }>(`/api/workouts/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["today"] });
    },
  });
}

/* ---------- progress ---------- */

export interface ProgressPayload {
  profile: Profile;
  weights: WeightEntry[];
  dailyKcal: { date: string; kcal: number }[];
  macroAvg: { protein: number; carbs: number; fat: number };
  waterAvg: number;
  /** per-day macro averages + water (56d) — period-aware stats (additive) */
  dailyMacros: { date: string; p: number; c: number; f: number }[];
  dailyWater: { date: string; ml: number }[];
  streak: number;
  loggedDays30: number;
}

export function useProgress() {
  return useQuery<ProgressPayload>({
    queryKey: ["progress"],
    queryFn: () => jget<ProgressPayload>("/api/progress"),
  });
}

/* ---------- saved meals (وجباتي) ---------- */

export function useMeals() {
  return useQuery<SavedMeal[]>({
    queryKey: ["meals"],
    queryFn: () => jget<SavedMeal[]>("/api/meals"),
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; items: SavedMealItem[] }) =>
      jsend<SavedMeal>("/api/meals", "POST", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jsend<{ ok: boolean }>(`/api/meals/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meals"] }),
  });
}

/* ---------- scan ---------- */

export function useScan() {
  return useMutation({
    mutationFn: (body: { labelImage?: string; frontImage?: string; note?: string }) =>
      jsend<ScanResult>("/api/scan", "POST", body),
  });
}

/* ---------- demo reset ---------- */

export function useDemoReset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => jsend<{ ok: boolean }>("/api/demo/reset", "POST"),
    onSuccess: () => qc.invalidateQueries(),
  });
}
