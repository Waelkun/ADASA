/**
 * Modern Arabic (Gregorian) date display helpers — display only.
 * Western digits everywhere; stored values are never touched.
 */

/** Modern Gregorian month names (index 0 = January) */
export const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/** Colloquial weekday names, Sunday-first (index 0 = Sunday) */
export const WEEKDAYS_AR = [
  "أحد",
  "اثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
  "سبت",
] as const;

/** Short weekday names (same colloquial forms — they are already compact) */
export const WEEKDAYS_AR_SHORT = WEEKDAYS_AR;

export interface DateArOpts {
  weekday?: "long" | "short" | false;
  day?: boolean;
  month?: "long" | "short" | "numeric" | false;
  year?: boolean;
}

/**
 * Format a date in Arabic with modern month names + Western digits.
 * "أحد، 25 أكتوبر" (default) · "أحد، 25 أكتوبر 2026" · "أكتوبر 2026".
 */
export function dfAr(d: Date, opts: DateArOpts = {}): string {
  const { weekday = false, day = true, month = "long", year = false } = opts;
  const monthName = MONTHS_AR[d.getMonth()];
  // core: "25 أكتوبر" | "25/10" | "25" | "أكتوبر" | ""
  let core: string;
  if (day && (month === "long" || month === "short")) core = `${d.getDate()} ${monthName}`;
  else if (day && month === "numeric") core = `${d.getDate()}/${d.getMonth() + 1}`;
  else if (day) core = String(d.getDate());
  else if (month !== false) core = monthName;
  else core = "";
  let s = "";
  if (weekday) s += `${WEEKDAYS_AR[d.getDay()]}، `;
  if (core) s += core + (year ? " " : "");
  if (year) s += String(d.getFullYear());
  return s.trim();
}

/** "أكتوبر 2026" — calendar titles / period headers */
export function monthYearAr(d: Date): string {
  return `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "25 أكتوبر" — chart tooltips / short date chips */
export function shortDateAr(d: Date, withYear = false): string {
  return withYear
    ? `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`
    : `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

/** Colloquial weekday name for a date (chart tick / calendar header) */
export function weekdayAr(d: Date): string {
  return WEEKDAYS_AR[d.getDay()];
}
