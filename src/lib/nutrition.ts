/** Nutrition calculations */

/** Mifflin-St Jeor BMR */
export function bmrMifflin(opts: {
  sex: "male" | "female";
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = opts;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function tdee(opts: {
  sex: string;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: string;
}): number {
  const f = ACTIVITY_FACTORS[opts.activityLevel] ?? 1.55;
  return bmrMifflin({
    sex: opts.sex === "female" ? "female" : "male",
    weightKg: opts.weightKg,
    heightCm: opts.heightCm,
    age: opts.age,
  }) * f;
}

export function suggestedKcal(opts: {
  sex: string;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: string;
  goalType: string;
}): number {
  const t = tdee(opts);
  const adj = opts.goalType === "lose" ? -450 : opts.goalType === "gain" ? 350 : 0;
  return Math.round((t + adj) / 10) * 10;
}

/** suggested macro split (g) from kcal target — 30P/40C/30F-ish, protein 1.8g/kg floor */
export function suggestedMacros(kcal: number, weightKg: number) {
  const protein = Math.max(Math.round((1.8 * weightKg) / 5) * 5, Math.round((kcal * 0.28) / 4));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 40);
  return { protein, carbs, fat };
}

/** kcal sanity: kcal ≈ 4p + 4c + 9f within ±20% (or sum of macros is ~0) */
export function kcalSanityOk(kcal: number, p: number, c: number, f: number): boolean {
  const derived = 4 * p + 4 * c + 9 * f;
  if (derived === 0) return kcal === 0;
  return Math.abs(derived - kcal) / derived <= 0.2;
}

export const kJtokcal = (kj: number) => kj / 4.184;

/** kg <-> lb */
export const kgToLb = (kg: number) => kg * 2.20462;
export const lbToKg = (lb: number) => lb / 2.20462;

/* ================= calorie zigzag (زجزاج) ================= */

/**
 * 7-day factor cycles — each sums to exactly 7.0 so the weekly total is
 * always 7 × the base target.
 */
export const ZIGZAG_FACTORS: Record<"plan1" | "plan2", number[]> = {
  // plan 1 — two high days (+15% ×2) balanced by five easy days
  plan1: [1.15, 1.15, 0.94, 0.94, 0.94, 0.94, 0.94],
  // plan 2 — gradient: builds up through the week
  plan2: [0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15],
};

const DAY_MS = 86400000;

/** days between two YYYY-MM-DD strings (b - a) */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / DAY_MS
  );
}

/** plan factor for a date — null when no plan / before the start day */
export function zigzagFactor(
  plan: string | null | undefined,
  start: string | null | undefined,
  date: string
): number | null {
  if (plan !== "plan1" && plan !== "plan2") return null;
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const idx = daysBetween(start, date);
  if (idx < 0) return null;
  return ZIGZAG_FACTORS[plan][idx % 7];
}

/** the kcal goal that applies to a specific day (base × plan factor) */
export function effectiveKcalGoal(
  baseKcal: number,
  plan: string | null | undefined,
  start: string | null | undefined,
  date: string
): number {
  const f = zigzagFactor(plan, start, date);
  // plain rounding keeps the weekly sum ≈ 7 × base (factors sum to exactly 7)
  return f == null ? baseKcal : Math.round(baseKcal * f);
}
