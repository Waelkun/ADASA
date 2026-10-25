"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dfAr } from "./date-ar";

export type Lang = "ar" | "en";

const dict = {
  // tabs
  tab_today: { ar: "اليوم", en: "Today" },
  tab_log: { ar: "السجل", en: "Log" },
  tab_goals: { ar: "الأهداف", en: "Goals" },
  tab_progress: { ar: "التقدم", en: "Progress" },
  tab_workouts: { ar: "التمارين", en: "Workouts" },
  tab_settings: { ar: "الإعدادات", en: "Settings" },

  // common
  add: { ar: "إضافة", en: "Add" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  save: { ar: "حفظ", en: "Save" },
  delete: { ar: "حذف", en: "Delete" },
  edit: { ar: "تعديل", en: "Edit" },
  retry: { ar: "إعادة المحاولة", en: "Retry" },
  close: { ar: "إغلاق", en: "Close" },
  done: { ar: "تم", en: "Done" },
  next: { ar: "التالي", en: "Next" },
  kcal: { ar: "سعرة", en: "kcal" },
  kcalUnit: { ar: "سعرة حرارية", en: "kilocalories" },
  grams: { ar: "غ", en: "g" },
  gramsFull: { ar: "غرام", en: "grams" },
  protein: { ar: "بروتين", en: "Protein" },
  carbs: { ar: "كارب", en: "Carbs" },
  fat: { ar: "دهون", en: "Fat" },
  water: { ar: "الماء", en: "Water" },
  weight: { ar: "الوزن", en: "Weight" },
  liter: { ar: "لتر", en: "L" },
  ml: { ar: "مل", en: "ml" },
  min: { ar: "دقيقة", en: "min" },
  kg: { ar: "كغ", en: "kg" },
  lb: { ar: "رطل", en: "lb" },
  cm: { ar: "سم", en: "cm" },

  // meals
  breakfast: { ar: "فطور", en: "Breakfast" },
  lunch: { ar: "غداء", en: "Lunch" },
  dinner: { ar: "عشاء", en: "Dinner" },
  snack: { ar: "سناك", en: "Snack" },

  // ranges
  range_1w: { ar: "أسبوع", en: "1W" },
  range_1m: { ar: "شهر", en: "1M" },
  range_3m: { ar: "3 أشهر", en: "3M" },
  range_all: { ar: "الكل", en: "All" },
  range_custom: { ar: "مخصص", en: "Custom" },
  date_from: { ar: "من", en: "From" },
  date_to: { ar: "إلى", en: "To" },
  days_count: { ar: "يوماً", en: "days" },

  // today
  good_morning: { ar: "صباح الخير", en: "Good morning" },
  good_afternoon: { ar: "طاب يومك", en: "Good afternoon" },
  good_evening: { ar: "مساء الخير", en: "Good evening" },
  calories_left: { ar: "متبقي اليوم", en: "left today" },
  over_by: { ar: "زيادة عن الهدف", en: "over goal" },
  eaten: { ar: "المتناول", en: "Eaten" },
  goal: { ar: "الهدف", en: "Goal" },
  of_goal: { ar: "من الهدف", en: "of goal" },
  macros: { ar: "الماكروز", en: "Macros" },
  meals: { ar: "الوجبات", en: "Meals" },
  no_meals: { ar: "لا وجبات بعد", en: "No meals yet" },
  no_meals_hint: { ar: "أضف أول وجبة لك اليوم", en: "Add your first meal of the day" },
  streak_days: { ar: "أيام متتالية", en: "day streak" },
  logged_today: { ar: "مسجّل اليوم", en: "Logged today" },
  trained_today: { ar: "تمرين اليوم ✓", en: "Trained today ✓" },
  not_trained: { ar: "لا تمرين بعد", en: "No workout yet" },

  // quick add
  quick_add: { ar: "إضافة سريعة", en: "Quick add" },
  build_meal: { ar: "بناء وجبة", en: "Build a meal" },
  build_meal_hint: { ar: "عدة عناصر بوجبة وحدة", en: "Several items in one meal" },
  scan_product: { ar: "امسح منتجاً", en: "Scan product" },
  scan_hint: { ar: "صوّر الملصق الغذائي ونقرأ القيم بالذكاء الاصطناعي", en: "Snap the nutrition label, AI reads it for you" },
  manual_entry: { ar: "إدخال يدوي", en: "Manual entry" },
  manual_hint: { ar: "أدخل الطعام والقيم بنفسك", en: "Enter food and values yourself" },
  add_water: { ar: "أضف ماءً", en: "Add water" },
  log_weight: { ar: "سجّل وزنك", en: "Log weight" },
  log_workout: { ar: "سجّل تمريناً", en: "Log workout" },

  // water
  water_progress: { ar: "من هدف الماء", en: "of water goal" },
  water_week: { ar: "الماء هذا الأسبوع", en: "Water this week" },
  daily_avg: { ar: "المتوسط اليومي", en: "Daily average" },
  undo: { ar: "تراجع", en: "Undo" },
  custom_amount: { ar: "كمية مخصصة", en: "Custom amount" },

  // log screen
  food_log: { ar: "سجل الطعام", en: "Food log" },
  my_foods: { ar: "أطعمتي", en: "My foods" },
  search_foods: { ar: "ابحث في أطعمتك…", en: "Search your foods…" },
  favorites: { ar: "المفضلة", en: "Favorites" },
  all: { ar: "الكل", en: "All" },
  no_foods: { ar: "لا أطعمة محفوظة", en: "No saved foods" },
  no_foods_hint: { ar: "امسح منتجاً أو أضف يدوياً لتبدأ مكتبتك", en: "Scan a product or add manually to start your library" },
  no_results: { ar: "لا نتائج مطابقة", en: "No matches" },
  source_scan: { ar: "مسح", en: "Scan" },
  source_manual: { ar: "يدوي", en: "Manual" },
  source_myfoods: { ar: "أطعمتي", en: "My foods" },
  today_log: { ar: "اليوم", en: "Today" },
  prev_day: { ar: "اليوم السابق", en: "Previous day" },
  next_day: { ar: "اليوم التالي", en: "Next day" },
  back_to_today: { ar: "الرجوع لليوم", en: "Back to today" },
  delete_confirm: { ar: "حذف هذا الإدخال؟", en: "Delete this entry?" },
  per_100g: { ar: "لكل 100غ", en: "per 100g" },
  per_serving: { ar: "للحصة", en: "per serving" },
  serving: { ar: "حصة", en: "serving" },
  brand: { ar: "العلامة التجارية", en: "Brand" },
  name: { ar: "الاسم", en: "Name" },
  quantity: { ar: "الكمية", en: "Quantity" },
  meal: { ar: "الوجبة", en: "Meal" },
  total: { ar: "الإجمالي", en: "Total" },

  // scan flow
  scan_title: { ar: "امسح منتجاً", en: "Scan product" },
  front_photo: { ar: "صورة الواجهة", en: "Front photo" },
  front_photo_hint: { ar: "لاسم والعلامة (اختياري)", en: "For name & brand (optional)" },
  label_photo: { ar: "صورة الملصق الغذائي", en: "Nutrition label photo" },
  label_photo_hint: { ar: "المصدر الأساسي للقيم", en: "Primary source of values" },
  take_photo: { ar: "التقاط / اختيار صورة", en: "Take / choose photo" },
  camera: { ar: "كاميرا", en: "Camera" },
  from_gallery: { ar: "من المعرض", en: "From gallery" },
  retake: { ar: "تغيير الصورة", en: "Retake" },
  analyze: { ar: "تحليل الملصق", en: "Analyze label" },
  analyzing: { ar: "جارٍ قراءة الملصق…", en: "Reading the label…" },
  analyzing_hint: { ar: "يستغرق عادة بضع ثوانٍ", en: "Usually takes a few seconds" },
  scan_result: { ar: "نتيجة المسح", en: "Scan result" },
  estimated_weight: { ar: "الوزن التقديري", en: "Estimated weight" },
  estimated_weight_hint: { ar: "من الصورة — عدّله لو حابب", en: "From the photo — adjust if you like" },
  verify_values: { ar: "رجاءً تحقق من القيم قبل الإضافة", en: "Please verify values before adding" },
  low_confidence: { ar: "ثقة منخفضة — راجع القيم", en: "Low confidence — review values" },
  confidence: { ar: "الثقة", en: "Confidence" },
  scan_notes: { ar: "ملاحظات", en: "Notes" },
  quick_50: { ar: "50غ", en: "50g" },
  quick_100: { ar: "100غ", en: "100g" },
  quick_serving: { ar: "حصة", en: "1 serving" },
  add_to_log: { ar: "أضف إلى السجل", en: "Add to log" },
  save_to_my_foods: { ar: "حفظ في أطعمتي", en: "Save to My foods" },
  scan_error_blurry: { ar: "الصورة غير واضحة — أعد التصوير بثبات", en: "Photo looks blurry — retake steadily" },
  scan_error_no_label: { ar: "لم أجد ملصقاً غذائياً في الصورة", en: "No nutrition label found in the photo" },
  scan_error_generic: { ar: "تعذّر تحليل الصورة، حاول مجدداً", en: "Could not analyze the photo, try again" },
  scan_error_size: { ar: "الصورة كبيرة جداً (الحد 8 ميغابايت)", en: "Image too large (max 8MB)" },
  try_demo: { ar: "جرّب بصورة تجريبية", en: "Try with a demo image" },
  demo_note: { ar: "صورة تجريبية", en: "Demo image" },
  scan_note_field: { ar: "وصف أو وزن تقريبي (اختياري) — مثال: شاورما 250غ", en: "Description or weight hint (optional) — e.g. shawarma 250g" },

  // manual entry
  manual_title: { ar: "إدخال يدوي", en: "Manual entry" },
  food_name: { ar: "اسم الطعام", en: "Food name" },
  kcal_per_100g: { ar: "سعرات / 100غ", en: "kcal / 100g" },
  macros_per_100g: { ar: "ماكروز / 100غ (غ)", en: "Macros / 100g (g)" },
  grams_eaten: { ar: "الكمية المتناولة (غ)", en: "Amount eaten (g)" },

  // my-foods add sheet
  choose_meal: { ar: "اختر الوجبة", en: "Choose meal" },
  add_food: { ar: "أضف طعاماً", en: "Add food" },

  // meal builder
  search_products: { ar: "ابحث في منتجاتك…", en: "Search your products…" },
  edit_amount: { ar: "تعديل الكمية", en: "Edit amount" },
  meal_items: { ar: "عناصر الوجبة", en: "Meal items" },
  meal_builder_empty: { ar: "لا عناصر بعد — اختر من القائمة فوق", en: "No items yet — pick from the list above" },
  save_meal: { ar: "حفظ الوجبة", en: "Save meal" },
  discard_meal_q: { ar: "تتجاهل الوجبة؟", en: "Discard this meal?" },
  discard_meal_desc: { ar: "رح تنحذف كل العناصر المضافة", en: "All added items will be removed" },
  keep_editing: { ar: "متابعة", en: "Continue" },
  discard: { ar: "تجاهل", en: "Discard" },
  added_to_meal: { ar: "أُضيف إلى الوجبة", en: "Added to meal" },
  draft_restored: { ar: "رجّعنا لك مسودة وجبتك", en: "Your meal draft was restored" },
  meal_saved: { ar: "تم حفظ الوجبة", en: "Meal saved" },

  // progress
  progress: { ar: "التقدم", en: "Progress" },
  latest: { ar: "الأحدث", en: "Latest" },
  change: { ar: "التغيير", en: "Change" },
  weekly_avg: { ar: "متوسط الأسبوع", en: "Weekly average" },
  avg_kcal: { ar: "متوسط السعرات", en: "Avg calories" },
  avg_water: { ar: "متوسط الماء", en: "Avg water" },
  min_max: { ar: "الأدنى / الأعلى", en: "Min / Max" },
  total_change: { ar: "إجمالي التغيير", en: "Total change" },
  to_goal: { ar: "المتبقي للهدف", en: "To goal" },
  goal_reached: { ar: "وصلت لهدفك 🎉", en: "Goal reached 🎉" },
  moving_avg7: { ar: "متوسط 7 أيام", en: "7-day average" },
  no_weight_yet: { ar: "لا بيانات وزن بعد", en: "No weight data yet" },
  log_first_weight: { ar: "سجّل وزنك لعرض التقدم", en: "Log your weight to see progress" },
  avg_macros: { ar: "متوسط الماكروز", en: "Average macros" },
  logged_days: { ar: "أيام مسجّلة", en: "Logged days" },
  workouts_week: { ar: "تمارين الأسبوع", en: "Workouts this week" },

  // weight sheet
  today_weight: { ar: "وزن اليوم", en: "Today's weight" },
  yesterday: { ar: "أمس", en: "Yesterday" },
  weight_note: { ar: "ملاحظة (اختياري)", en: "Note (optional)" },
  weight_logged: { ar: "تم تسجيل الوزن", en: "Weight logged" },

  // workouts
  workouts: { ar: "التمارين", en: "Workouts" },
  workout_calendar: { ar: "تقويم التمارين", en: "Workout calendar" },
  this_week: { ar: "هذا الأسبوع", en: "This week" },
  vs_target: { ar: "من الهدف", en: "of target" },
  muscle_groups: { ar: "المجموعات العضلية", en: "Muscle groups" },
  chest: { ar: "صدر", en: "Chest" },
  back_m: { ar: "ظهر", en: "Back" },
  arms: { ar: "ذراعين", en: "Arms" },
  legs: { ar: "أرجل", en: "Legs" },
  abs: { ar: "بطن", en: "Abs" },
  shoulders: { ar: "أكتاف", en: "Shoulders" },
  cardio: { ar: "كارديو", en: "Cardio" },
  other: { ar: "أخرى", en: "Other" },
  duration_min: { ar: "المدة (دقيقة)", en: "Duration (min)" },
  workout_note: { ar: "ملاحظة (اختياري)", en: "Note (optional)" },
  presets: { ar: "قوالب سريعة", en: "Quick presets" },
  preset_push: { ar: "دفع", en: "Push" },
  preset_pull: { ar: "سحب", en: "Pull" },
  preset_legs: { ar: "أرجل", en: "Legs" },
  preset_upper: { ar: "أعلى الجسم", en: "Upper" },
  preset_lower: { ar: "أسفل الجسم", en: "Lower" },
  preset_full: { ar: "كامل الجسم", en: "Full body" },
  workouts_this_week: { ar: "تمارين هذا الأسبوع", en: "Workouts this week" },
  workout_streak: { ar: "سلسلة التمارين", en: "Workout streak" },
  count_per_group: { ar: "عدد التمارين لكل مجموعة", en: "Sessions per muscle group" },
  last_trained: { ar: "آخر تمرين", en: "Last trained" },
  never: { ar: "أبداً", en: "Never" },
  add_or_edit_day: { ar: "إضافة / تعديل تمرين", en: "Add / edit workout" },
  no_workout_day: { ar: "لا تمرين بهذا اليوم", en: "No workout on this day" },
  workout_saved: { ar: "تم حفظ التمرين", en: "Workout saved" },

  // settings
  settings: { ar: "الإعدادات", en: "Settings" },
  daily_goals: { ar: "الأهداف اليومية", en: "Daily goals" },
  kcal_goal: { ar: "هدف السعرات", en: "Calorie goal" },
  macro_targets: { ar: "أهداف الماكروز (غ)", en: "Macro targets (g)" },
  protein_goal: { ar: "هدف البروتين", en: "Protein goal" },
  carbs_goal: { ar: "هدف الكارب", en: "Carbs goal" },
  fat_goal: { ar: "هدف الدهون", en: "Fat goal" },
  water_goal: { ar: "هدف الماء (لتر)", en: "Water goal (L)" },
  goal_weight: { ar: "وزن الهدف", en: "Goal weight" },
  workouts_target: { ar: "عدد التمارين أسبوعياً", en: "Workouts per week" },
  body_profile: { ar: "الملف الجسدي", en: "Body profile" },
  display_name: { ar: "الاسم", en: "Display name" },
  sex: { ar: "الجنس", en: "Sex" },
  male: { ar: "ذكر", en: "Male" },
  female: { ar: "أنثى", en: "Female" },
  birth_year: { ar: "سنة الميلاد", en: "Birth year" },
  height: { ar: "الطول (سم)", en: "Height (cm)" },
  activity: { ar: "مستوى النشاط", en: "Activity level" },
  act_sedentary: { ar: "خفيف جداً", en: "Sedentary" },
  act_light: { ar: "خفيف", en: "Light" },
  act_moderate: { ar: "متوسط", en: "Moderate" },
  act_active: { ar: "نشيط", en: "Active" },
  act_very: { ar: "نشيط جداً", en: "Very active" },
  goal_type: { ar: "الهدف", en: "Goal" },
  goal_lose: { ar: "خسارة وزن", en: "Lose weight" },
  goal_maintain: { ar: "حفاظ", en: "Maintain" },
  goal_gain: { ar: "زيادة وزن", en: "Gain weight" },
  calculate_tdee: { ar: "احسب الهدف المقترح", en: "Calculate suggested goal" },
  suggested: { ar: "المقترح", en: "Suggested" },
  apply: { ar: "تطبيق", en: "Apply" },
  macro_split_auto: { ar: "توزيع ماكروز مقترح", en: "Suggested macro split" },
  preferences: { ar: "التفضيلات", en: "Preferences" },
  units: { ar: "الوحدات", en: "Units" },
  metric: { ar: "متري (كغ، سم)", en: "Metric (kg, cm)" },
  imperial: { ar: "إمبراطوري (رطل)", en: "Imperial (lb)" },
  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "Arabic" },
  english: { ar: "English", en: "English" },
  dark_mode: { ar: "الوضع الليلي", en: "Dark mode" },
  settings_saved: { ar: "تم حفظ الإعدادات", en: "Settings saved" },
  data_reset: { ar: "إعادة تعيين البيانات التجريبية", en: "Reset demo data" },
  data_reset_hint: { ar: "يعيد توليد بيانات العرض التجريبية", en: "Regenerate the demo dataset" },
  data_reset_done: { ar: "تمت إعادة التهيئة", en: "Demo data reset" },

  // goals screen
  edit_goals: { ar: "تعديل الأهداف", en: "Edit goals" },
  goals_now: { ar: "الحالي", en: "Current" },
  goals_left: { ar: "متبقي", en: "left" },
  goals_weight_hint: { ar: "حدد وزن الهدف من الإعدادات", en: "Set a goal weight in Settings" },
  goals_of: { ar: "من الهدف", en: "of goal" },

  // toasts
  added_toast: { ar: "تمت الإضافة إلى السجل", en: "Added to log" },
  deleted_toast: { ar: "تم الحذف", en: "Deleted" },
  saved_toast: { ar: "تم الحفظ", en: "Saved" },
  error_toast: { ar: "حدث خطأ، حاول مجدداً", en: "Something went wrong" },
  favorite_toast: { ar: "تم تحديث المفضلة", en: "Favorites updated" },

  // onboarding (welcome screen)
  onb_title: { ar: "أهلاً بك في Nutra", en: "Welcome to Nutra" },
  onb_sub: {
    ar: "رفيقك اليومي للسعرات والماكروز والوزن والتمارين",
    en: "Your daily companion for calories, macros, weight and workouts",
  },
  onb_f1: { ar: "امسح منتجاً بالكاميرا واقرأ الملصق فوراً", en: "Scan a product and read its label instantly" },
  onb_f2: { ar: "تابع السعرات والماكروز والماء لحظة بلحظة", en: "Track calories, macros and water live" },
  onb_f3: { ar: "تقويم تمارين ومخطط وزن يتحرك معك", en: "Workout calendar and a weight chart that moves with you" },
  onb_goal_q: { ar: "وش هدفك؟", en: "What's your goal?" },
  onb_goal_sub: {
    ar: "بنضبط أهدافك على أساسه — وتقدر تغيّره لاحقاً من الإعدادات",
    en: "We'll shape your targets around it — changeable later in Settings",
  },
  onb_ready: { ar: "يلا نبدأ!", en: "Let's go!" },
  onb_ready_sub: {
    ar: "كل شي جاهز — اضغط ابدأ وادخل التطبيق",
    en: "All set — tap start and dive in",
  },
  onb_start: { ar: "ابدأ", en: "Start" },
  onb_back: { ar: "رجوع", en: "Back" },
} as const;

export type DictKey = keyof typeof dict;

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  /** format number with Western digits + thousands separators */
  nf: (n: number, decimals?: number) => string;
  /** format a date — ar: modern months + Western digits (date-ar.ts), en: en-US */
  df: (d: Date, opts?: Intl.DateTimeFormatOptions) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  // hydrate from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    let cancelled = false;
    // async read so state updates happen outside the effect body
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = window.localStorage.getItem("nutra-lang");
      if (saved === "en" || saved === "ar") setLangState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // reflect on <html>
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("nutra-lang", l);
  }, []);

  const t = useCallback(
    (key: DictKey) => dict[key]?.[lang] ?? String(key),
    [lang]
  );

  const nf = useCallback(
    (n: number, decimals = 0) => {
      const v = Number.isFinite(n) ? n : 0;
      return v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    []
  );

  const df = useCallback(
    (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) => {
      if (lang === "ar") {
        // modern Arabic months (يناير…) + Western digits — lib/date-ar.ts
        // falls back to Intl only for unsupported options (e.g. time parts)
        const timeParts = opts.hour != null || opts.minute != null || opts.second != null;
        if (!timeParts) {
          return dfAr(d, {
            weekday: opts.weekday === "long" ? "long" : opts.weekday === "short" ? "short" : false,
            day: opts.day === "numeric" || opts.day === "2-digit",
            month:
              opts.month === "long" || opts.month === "short"
                ? "long"
                : opts.month === "numeric" || opts.month === "2-digit"
                  ? "numeric"
                  : false,
            year: !!opts.year,
          });
        }
        try {
          return new Intl.DateTimeFormat("ar-SY-u-nu-latn", opts).format(d);
        } catch {
          return d.toDateString();
        }
      }
      try {
        return new Intl.DateTimeFormat("en-US", opts).format(d);
      } catch {
        return d.toDateString();
      }
    },
    [lang]
  );

  const value: I18nCtx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    isRTL: lang === "ar",
    setLang,
    t,
    nf,
    df,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
