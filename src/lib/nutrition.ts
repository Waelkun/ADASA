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
