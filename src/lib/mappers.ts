import type {
  Food,
  FoodLog,
  Profile,
  SavedMeal,
  SavedMealItem,
  WaterLog,
  WeightEntry,
  Workout,
} from "./types";

export function mapProfileFromDb(row: Record<string, any>): Profile {
  return {
    id: row.user_id as unknown as number,
    displayName: row.display_name ?? "مستخدم عدسة",
    sex: row.sex ?? "male",
    birthYear: Number(row.birth_year ?? 1995),
    heightCm: Number(row.height_cm ?? 175),
    activityLevel: row.activity_level ?? "moderate",
    goalType: row.goal_type ?? "lose",
    kcalGoal: Number(row.kcal_goal ?? 2100),
    proteinG: Number(row.protein_g ?? 160),
    carbsG: Number(row.carbs_g ?? 190),
    fatG: Number(row.fat_g ?? 70),
    waterGoalMl: Number(row.water_goal_ml ?? 2800),
    goalWeightKg: row.goal_weight_kg != null ? Number(row.goal_weight_kg) : null,
    workoutsPerWeek: Number(row.workouts_per_week ?? 4),
    units: row.units ?? "metric",
    onboardingCompleted: Boolean(row.onboarding_completed),
    zigzagPlan: row.zigzag_plan ?? null,
    zigzagStart: row.zigzag_start ?? null,
  };
}

export function mapFoodFromDb(row: Record<string, any>): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? null,
    servingSizeG: row.serving_size_g != null ? Number(row.serving_size_g) : null,
    kcal100: Number(row.kcal100 ?? 0),
    protein100: Number(row.protein100 ?? 0),
    carbs100: Number(row.carbs100 ?? 0),
    sugar100: row.sugar100 != null ? Number(row.sugar100) : null,
    fat100: Number(row.fat100 ?? 0),
    satFat100: row.sat_fat100 != null ? Number(row.sat_fat100) : null,
    fiber100: row.fiber100 != null ? Number(row.fiber100) : null,
    salt100: row.salt100 != null ? Number(row.salt100) : null,
    imageUrl: row.image_url ?? null,
    isFavorite: Boolean(row.is_favorite),
  };
}

export function mapFoodLogFromDb(row: Record<string, any>): FoodLog {
  return {
    id: row.id,
    foodId: row.food_id ?? null,
    name: row.name,
    loggedAt:
      typeof row.logged_at === "string"
        ? row.logged_at
        : new Date(row.logged_at).toISOString(),
    mealType: row.meal_type,
    grams: Number(row.grams ?? 0),
    kcal: Number(row.kcal ?? 0),
    proteinG: Number(row.protein_g ?? 0),
    carbsG: Number(row.carbs_g ?? 0),
    fatG: Number(row.fat_g ?? 0),
    source: row.source ?? "manual",
    dayDate: typeof row.day_date === "string" ? row.day_date : String(row.day_date),
    kcal100: row.kcal100 != null ? Number(row.kcal100) : null,
    protein100: row.protein100 != null ? Number(row.protein100) : null,
    carbs100: row.carbs100 != null ? Number(row.carbs100) : null,
    fat100: row.fat100 != null ? Number(row.fat100) : null,
    imageUrl: row.image_url ?? null,
  };
}

export function mapWeightFromDb(row: Record<string, any>): WeightEntry {
  return {
    date: typeof row.date === "string" ? row.date : String(row.date),
    weightKg: Number(row.weight_kg ?? 0),
    note: row.note ?? null,
  };
}

export function mapWaterLogFromDb(row: Record<string, any>): WaterLog {
  return {
    id: row.id,
    loggedAt:
      typeof row.logged_at === "string"
        ? row.logged_at
        : new Date(row.logged_at).toISOString(),
    amountMl: Number(row.amount_ml ?? 0),
  };
}

export function mapWorkoutFromDb(row: Record<string, any>): Workout {
  return {
    id: row.id,
    date: typeof row.date === "string" ? row.date : String(row.date),
    muscleGroups: Array.isArray(row.muscle_groups)
      ? row.muscle_groups
      : typeof row.muscle_groups === "string" && row.muscle_groups.trim()
      ? row.muscle_groups.split(",").map((s) => s.trim())
      : [],
    durationMin: row.duration_min != null ? Number(row.duration_min) : null,
    note: row.note ?? null,
  };
}

export function mapSavedMealFromDb(row: Record<string, any>): SavedMeal {
  let items: SavedMealItem[] = [];
  if (Array.isArray(row.items)) {
    items = row.items;
  } else if (typeof row.items === "string") {
    try {
      items = JSON.parse(row.items);
    } catch {
      items = [];
    }
  }
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    items,
  };
}
