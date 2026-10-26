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
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  close: { ar: "إغلاق", en: "Close" },
  done: { ar: "تم", en: "Done" },
  next: { ar: "التالي", en: "Next" },
  kcal: { ar: "سعرة", en: "kcal" },
  kcalUnit: { ar: "سعرة حرارية", en: "kilocalories" },
  grams: { ar: "غ", en: "g" },
  gramsFull: { ar: "غرام", en: "grams" },
  protein: { ar: "بروتين", en: "Protein" },
  carbs: { ar: "كربوهيدرات", en: "Carbohydrate" },
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
  last_3_days: { ar: "آخر 3 أيام", en: "Last 3 days" },
  last_7_days: { ar: "آخر 7 أيام", en: "Last 7 days" },
  last_14_days: { ar: "آخر 14 يوم", en: "Last 14 days" },
  vs_prev_period: { ar: "مقابل الفترة السابقة", en: "vs previous period" },
  avg_weight_period: { ar: "متوسط الوزن", en: "Average weight" },
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
  scan_error_type: {
    ar: "نوع الملف غير مدعوم — المسموح: JPEG / PNG / WebP / HEIC",
    en: "Unsupported file type — allowed: JPEG / PNG / WebP / HEIC",
  },
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

  // my meals (وجباتي)
  my_meals: { ar: "وجباتي", en: "My meals" },
  save_as_meal: { ar: "حفظ كوجبة", en: "Save as meal" },
  meal_name_ph: { ar: "اسم الوجبة", en: "Meal name" },
  meal_saved_toast: { ar: "انحفظت بوجباتي", en: "Saved to My meals" },
  items_count: { ar: "عنصر", en: "items" },
  add_meal_title: { ar: "إضافة وجبة", en: "Add meal" },
  meal_added_toast: { ar: "تمت إضافة الوجبة", en: "Meal added" },
  target_day: { ar: "اليوم المستهدف", en: "Target day" },

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
  log_first_weight_cta: { ar: "سجّل أول وزن للبدء", en: "Log your first weight to begin" },
  required: { ar: "مطلوب", en: "Required" },
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
  carbs_goal: { ar: "هدف الكربوهيدرات", en: "Carbs goal" },
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
  switch_to_light: { ar: "التبديل إلى الوضع الفاتح", en: "Switch to light mode" },
  switch_to_dark: { ar: "التبديل إلى الوضع الداكن", en: "Switch to dark mode" },
  settings_saved: { ar: "تم حفظ الإعدادات", en: "Settings saved" },
  data_reset: { ar: "إعادة تعيين البيانات التجريبية", en: "Reset demo data" },
  data_reset_hint: { ar: "يعيد توليد بيانات العرض التجريبية", en: "Regenerate the demo dataset" },
  data_reset_done: { ar: "تمت إعادة التهيئة", en: "Demo data reset" },

  // goals screen
  edit_goals: { ar: "تعديل الأهداف", en: "Edit goals" },
  goals_now: { ar: "الحالي", en: "Current" },
  goals_left: { ar: "متبقي", en: "left" },
  goals_weight_hint: { ar: "حدد وزن الهدف من تبويب الأهداف", en: "Set a goal weight in Goals" },
  goals_of: { ar: "من الهدف", en: "of goal" },

  // macro split editor (22+23)
  save_daily_goals: { ar: "حفظ الأهداف اليومية", en: "Save daily goals" },
  save_macro_split: { ar: "حفظ توزيعة الماكروز", en: "Save macro split" },
  no_changes_to_save: { ar: "لا توجد تعديلات للحفظ", en: "No changes to save" },
  lock_only_in_percent_mode: { ar: "متاح فقط في وضع النسب", en: "Available in percent mode only" },
  macro_split_editor: { ar: "توزيعة الماكروز", en: "Macro split" },
  kcal_from_macros: { ar: "من الماكروز", en: "from macros" },
  kcal_formula: { ar: "بروتين × 4 + كربوهيدرات × 4 + دهون × 9", en: "protein × 4 + carbohydrate × 4 + fat × 9" },
  lock_kcal: { ar: "تثبيت السعرات", en: "Lock calories" },
  macro_editor_hint: {
    ar: "بوضع النسب مع التثبيت: أي زيادة بنسبة تنقص من الباقي والمجموع دايماً 100%",
    en: "In percent mode with lock: raising one percentage takes from the rest — the total is always 100%",
  },

  // calorie calculator (24)
  rate_lose025: { ar: "خسارة 0.25 كغ/أسبوع", en: "Lose 0.25 kg/wk" },
  rate_lose05: { ar: "خسارة 0.5 كغ/أسبوع", en: "Lose 0.5 kg/wk" },
  rate_lose1: { ar: "خسارة 1 كغ/أسبوع", en: "Lose 1 kg/wk" },
  adopt_and_save: { ar: "اعتمد وحفظ", en: "Adopt & save" },
  goal_adopted: { ar: "تم اعتماد الهدف — تحدّث بكل الشاشات", en: "Goal adopted — updated everywhere" },
  min_kcal_warning: {
    ar: "الهدف تحت الحد الأدنى الصحي — رفعناه للحد الأدنى",
    en: "Below the healthy minimum — raised to the minimum",
  },

  // zigzag (25)
  zigzag_title: { ar: "زجزاج السعرات", en: "Calorie zigzag" },
  zigzag_fixed: { ar: "ثابت (بلا خطة)", en: "Fixed (no plan)" },
  zigzag_plan1: { ar: "خطة 1 — يومان مرتفعان", en: "Plan 1 — two high days" },
  zigzag_plan1_desc: {
    ar: "يومان بعالي (+15%) والباقي أخف — مجموع الأسبوع ما يتغير",
    en: "Two high days (+15%), five easier days — same weekly total",
  },
  zigzag_plan2: { ar: "خطة 2 — تدرّج", en: "Plan 2 — gradient" },
  zigzag_plan2_desc: {
    ar: "يبدأ أخف ويتدرج أعلى خلال الأسبوع",
    en: "Starts lighter and ramps up through the week",
  },
  zigzag_adopt: { ar: "اعتمد الخطة", en: "Adopt plan" },
  zigzag_adopted: { ar: "تم اعتماد الخطة — حلقة اليوم تتبع هدف اليوم", en: "Plan adopted — Today ring follows the day's target" },
  zigzag_stop: { ar: "إيقاف", en: "Stop" },
  zigzag_stopped: { ar: "تم إيقاف الخطة", en: "Plan stopped" },
  zigzag_week_total: { ar: "مجموع الأسبوع", en: "Week total" },
  zigzag_started: { ar: "بدأت", en: "Started" },
  zigzag_higher: { ar: "أعلى", en: "Higher" },
  zigzag_lower: { ar: "أقل", en: "Lower" },
  tomorrow: { ar: "بكرة", en: "Tomorrow" },

  // toasts
  added_toast: { ar: "تمت الإضافة إلى السجل", en: "Added to log" },
  deleted_toast: { ar: "تم الحذف", en: "Deleted" },
  saved_toast: { ar: "تم الحفظ", en: "Saved" },
  error_toast: { ar: "حدث خطأ، حاول مجدداً", en: "Something went wrong" },
  favorite_toast: { ar: "تم تحديث المفضلة", en: "Favorites updated" },
  conn_error: { ar: "تعذر الاتصال", en: "Connection failed" },
  conn_error_hint: {
    ar: "تحقق من الإنترنت وجرب مجدداً — بياناتك محفوظة وما انمسحت",
    en: "Check your connection and try again — your data is safe",
  },

  // onboarding (welcome screen)
  onb_title: { ar: "أهلاً بك في عدسة", en: "Welcome to Adasa" },
  onb_sub: {
    ar: "رفيقك اليومي للسعرات والماكروز والوزن والتمارين",
    en: "Your daily companion for calories, macros, weight and workouts",
  },
  onb_f1: { ar: "امسح منتجاً بالكاميرا واقرأ الملصق فوراً", en: "Scan a product and read its label instantly" },
  onb_f2: { ar: "تابع السعرات والماكروز والماء لحظة بلحظة", en: "Track calories, macros and water live" },
  onb_f3: { ar: "تقويم تمارين ومخطط وزن يتحرك معك", en: "Workout calendar and a weight chart that moves with you" },
  onb_goal_q: { ar: "وش هدفك؟", en: "What's your goal?" },
  onb_goal_sub: {
    ar: "بنضبط أهدافك على أساسه — وتقدر تغيّره لاحقاً من تبويب الأهداف",
    en: "We'll shape your targets around it — changeable later in Goals",
  },
  onb_name_ph: { ar: "اسمك (اختياري)", en: "Your name (optional)" },
  onb_theme_q: { ar: "كيف تحب الثيم؟", en: "Pick a theme" },
  onb_theme_light: { ar: "فاتح", en: "Light" },
  onb_theme_dark: { ar: "غامق", en: "Dark" },
  onb_weight: { ar: "وزنك الحالي (كغ)", en: "Current weight (kg)" },
  onb_age: { ar: "عمرك (سنة)", en: "Age (years)" },
  onb_skip: { ar: "تخطي", en: "Skip" },
  onb_later: { ar: "لاحقاً", en: "Later" },
  onb_ready: { ar: "يلا نبدأ!", en: "Let's go!" },
  onb_ready_sub: {
    ar: "كل شي جاهز — اضغط ابدأ وادخل التطبيق",
    en: "All set — tap start and dive in",
  },
  onb_start: { ar: "ابدأ", en: "Start" },
  onb_back: { ar: "رجوع", en: "Back" },
  onb_step_1: { ar: "الخطوة 1 من 3: الاسم", en: "Step 1 of 3: Name" },
  onb_step_2: { ar: "الخطوة 2 من 3: المظهر", en: "Step 2 of 3: Theme" },
  onb_step_3: { ar: "الخطوة 3 من 3: الوزن والهدف", en: "Step 3 of 3: Weight & Goal" },
  logout: { ar: "تسجيل الخروج", en: "Log out" },
  logout_hint: {
    ar: "بينقفل التطبيق، وبياناتك تضل محفوظة عالجهاز",
    en: "Locks the app — your data stays saved on this device",
  },
  logout_q: { ar: "تسجيل الخروج؟", en: "Log out?" },
  logout_desc: {
    ar: "رح ينقفل التطبيق، بس كل بياناتك تضل محفوظة عالجهاز وتقدر ترجع تدخل وقت ما بدك.",
    en: "The app will lock, but all your data stays saved on this device — you can sign back in anytime.",
  },
  login: { ar: "تسجيل الدخول", en: "Sign in" },
  create_account: { ar: "إنشاء حساب جديد", en: "Create an account" },
  reset_password_title: { ar: "استعادة كلمة المرور", en: "Reset password" },
  login_sub: {
    ar: "سجّل دخولك لمتابعة سعراتك وبياناتك المحفوظة عبر السحاب",
    en: "Sign in to keep track of your calories and synced data",
  },
  signup_sub: {
    ar: "أنشئ حسابك لبدء تتبع أهدافك الغذائية والرياضية بأمان",
    en: "Create an account to securely track your nutrition and workout goals",
  },
  forgot_sub: {
    ar: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور",
    en: "Enter your email and we'll send you a password reset link",
  },
  env_warning_title: { ar: "تنبيه الإعداد المحلي:", en: "Local setup notice:" },
  env_warning_desc: {
    ar: "ملف .env.local غير موجود أو لم يتم ضبط متغيرات الاتصال به. يرجى إنشاء ملف .env.local وضبط:",
    en: ".env.local is missing or configuration variables are not set. Please create .env.local and configure:",
  },
  env_warning_restart: { ar: "ثم إعادة تشغيل السيرفر", en: "Then restart the server with" },
  signup_success_title: { ar: "تم إنشاء الحساب بنجاح!", en: "Account created successfully!" },
  signup_success_desc: {
    ar: "أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. يرجى فتح البريد والنقر على رابط التأكيد، ثم تسجيل الدخول.",
    en: "We sent a confirmation link to your email. Please open the email, click the link, and sign in.",
  },
  go_to_login: { ar: "التوجه لتسجيل الدخول", en: "Go to sign in" },
  forgot_success_title: { ar: "تحقق من بريدك الإلكتروني", en: "Check your email" },
  forgot_success_desc: {
    ar: "إذا كان هذا البريد مسجلاً لدينا، فستجد رابط استعادة كلمة المرور في صندوق الوارد أو الرسائل غير المرغوب فيها.",
    en: "If this email is registered, you will find a password reset link in your inbox or spam folder.",
  },
  back_to_login: { ar: "العودة لتسجيل الدخول", en: "Back to sign in" },
  google_signup: { ar: "التسجيل السريع باستخدام Google", en: "Quick sign up with Google" },
  google_login: { ar: "تسجيل الدخول باستخدام Google", en: "Sign in with Google" },
  or_email: { ar: "أو بالبريد الإلكتروني", en: "Or with email" },
  name_optional: { ar: "الاسم (اختياري)", en: "Name (optional)" },
  name_placeholder: { ar: "مثال: أحمد", en: "e.g. Alex" },
  email_label: { ar: "البريد الإلكتروني", en: "Email" },
  password_label: { ar: "كلمة المرور", en: "Password" },
  forgot_password_q: { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  signup_btn: { ar: "إنشاء الحساب", en: "Create account" },
  send_reset_link: { ar: "إرسال رابط الاستعادة", en: "Send reset link" },
  no_account_q: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  error_email_required: { ar: "يرجى إدخال البريد الإلكتروني.", en: "Please enter your email." },
  error_email_invalid: { ar: "يرجى إدخال بريد إلكتروني صالح.", en: "Please enter a valid email address." },
  error_password_min: { ar: "كلمة المرور يجب أن تكون 6 خانات على الأقل.", en: "Password must be at least 6 characters." },
  forgot_toast_sent: { ar: "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.", en: "Password reset link sent to your email." },
  show_password: { ar: "إظهار كلمة المرور", en: "Show password" },
  hide_password: { ar: "إخفاء كلمة المرور", en: "Hide password" },
  prev_month: { ar: "الشهر السابق", en: "Previous month" },
  next_month: { ar: "الشهر التالي", en: "Next month" },
  scan_error_limit: {
    ar: "لقد وصلت للحد اليومي لتحليل الوجبات (30 مسحة). يرجى المحاولة غداً.",
    en: "You have reached the daily meal scan limit (30 scans). Please try again tomorrow.",
  },
  scan_error_payload: {
    ar: "حجم الصورة كبير جداً، يرجى التقاط صورة أقرب وأصغر حجماً.",
    en: "Image file is too large. Please take a closer, smaller photo.",
  },
  clear_search: { ar: "مسح البحث", en: "Clear search" },
  add_custom_food: { ar: "إضافة كطعام مخصص", en: "Add as custom food" },
  of: { ar: "من", en: "of" },
  error_food_name_required: { ar: "يرجى إدخال اسم الطعام.", en: "Please enter food name." },
  error_meal_name_required: { ar: "يرجى إدخال اسم الوجبة.", en: "Please enter meal name." },
  weight_range_hint: { ar: "النطاق المسموح", en: "Allowed range" },
  error_weight_range: { ar: "يرجى إدخال وزن صالح ضمن النطاق المسموح.", en: "Please enter a valid weight within the allowed range." },
  delete_workout_q: { ar: "هل أنت متأكد من حذف هذا التمرين؟", en: "Are you sure you want to delete this workout?" },
  delete_workout_desc: { ar: "سيتم حذف بيانات التمرين المسجلة لهذا اليوم.", en: "Recorded workout data for this day will be deleted." },
  welcome_back: { ar: "أهلاً بعودتك", en: "Welcome back" },
  lock_sub: {
    ar: "سجّل دخولك لترجع لتطبيقك — كل بياناتك محفوظة عالجهاز",
    en: "Sign in to get back to your app — all your data stays saved on this device",
  },
  login_done: { ar: "رجّعناك لتطبيقك 👋", en: "Welcome back 👋" },
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
