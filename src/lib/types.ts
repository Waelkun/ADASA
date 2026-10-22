/** Shared domain types for Nutra */

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type SourceType = "scan" | "manual" | "myfoods";
export type TabId = "today" | "log" | "progress" | "workouts" | "settings";

export interface Profile {
  id: number;
  displayName: string;
  sex: string;
  birthYear: number;
  heightCm: number;
  activityLevel: string;
  goalType: string;
  kcalGoal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterGoalMl: number;
  goalWeightKg: number | null;
  workoutsPerWeek: number;
  units: string;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  servingSizeG: number | null;
  kcal100: number;
  protein100: number;
  carbs100: number;
  sugar100: number | null;
  fat100: number;
  satFat100: number | null;
  fiber100: number | null;
  salt100: number | null;
  isFavorite: boolean;
}

export interface FoodLog {
  id: string;
  foodId: string | null;
  name: string;
  loggedAt: string; // ISO
  mealType: MealType;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: SourceType;
}

export interface WaterLog {
  id: string;
  loggedAt: string;
  amountMl: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string | null;
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  muscleGroups: string[];
  durationMin: number | null;
  note: string | null;
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "arms"
  | "legs"
  | "abs"
  | "shoulders"
  | "cardio"
  | "other";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "arms",
  "legs",
  "abs",
  "shoulders",
  "cardio",
  "other",
];

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

/** Scan result returned by /api/scan (already validated) */
export interface ScanResult {
  product_name: string;
  brand: string | null;
  serving_size_g: number | null;
  servings_per_container: number | null;
  per_100g: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    sugar_g: number | null;
    fat_g: number;
    sat_fat_g: number | null;
    fiber_g: number | null;
    salt_g: number | null;
  };
  per_serving: ScanResult["per_100g"] | null;
  confidence: number;
  notes: string | null;
  sanity_ok: boolean;
  source?: "ai" | "demo";
}

/** Aggregated today payload */
export interface TodayPayload {
  profile: Profile;
  logs: FoodLog[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  waterToday: { total: number; entries: WaterLog[] };
  weightToday: WeightEntry | null;
  workoutToday: Workout | null;
  streak: number;
}

/** food awaiting confirmation (from scan / my-foods / manual) */
export interface PendingFood {
  id?: string;
  name: string;
  brand?: string | null;
  servingSizeG?: number | null;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
  source: "myfoods" | "scan" | "manual";
  confidence?: number;
  sanityOk?: boolean;
  notes?: string | null;
  sugar100?: number | null;
  satFat100?: number | null;
  fiber100?: number | null;
  salt100?: number | null;
}
