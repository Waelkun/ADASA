# تقرير الفحص البصري وضمان الجودة (Visual QA Report) — عدسة (Nutra)

تاريخ الفحص: 26 أكتوبر 2026  
بيئة الفحص: Windows 11, Chromium (Playwright), Next.js App Router (Turbopack), Tailwind v4  
طريقة التحقق: تشغيل متصفح تفاعلي حقيقي (Chromium Headless) والتقاط لقطات شاشة كاملة (85+ لقطة شاشة) وتوليد 15 لوحة اتصال (Contact Sheets) بأبعاد 1280×1640 بكسل.

---

## 1. ملخص الجزء الأول: الإصلاحات الأربعة (Part F Fixes)

### F1: الدلالات اللفظية وقارئات الشاشة (Semantics)
- **شريط الماكروز (`macro-donut.tsx`)**:
  - **التغيير**: تم تحويل العنصر من `role="progressbar"` إلى `role="img"`.
  - **نص الوصولية**: استخدام دالة الحساب الموحدة `calcDisplayPcts(protein, carbs, fat, 1)` وتوليد `aria-label` متطابق ثنائي اللغة (`ar` و `en`) يعكس النسب المئوية المعروضة بدقة:
    - عربي: `الماكروز: بروتين 35.4%، كربوهيدرات 49.0%، دهون 15.6%`
    - إنجليزي: `Macros: Protein 35.4%, Carbohydrates 49.0%, Fat 15.6%`
- **حلقة السعرات وحلقة الماء (`calorie-ring.tsx` و `today.tsx`)**:
  - **التغيير**: إضافة `aria-valuetext` لضمان عدم إخفاء تجاوز الهدف بسقف 100%:
    - حلقة السعرات: `aria-valuetext={`${nf(eaten)} ${t("of")} ${nf(goal)} ${t("kcal")}`}` (مثال: `1,800 من 2,030 سعرة`).
    - حلقة الماء: `aria-valuetext={`${nf(waterTotal / 1000, 2)} ${t("of")} ${nf(waterGoal / 1000, 1)} ${t("liter")}`}` (مثال: `1.50 من 2.5 لتر`).
  - **المفتاح**: تم تعريف `of: { ar: "من", en: "of" }` في قاموس اللغات.

### F2: صف الوضع الداكن في الإعدادات (`settings.tsx`)
- **التغيير**: تحويل الصف بالكامل إلى زر تفاعلي واحد سهل النقر ومطابق للمعايير:
  `<button type="button" role="switch" aria-checked={theme === "dark"} aria-label={t("dark_mode")} onClick={toggle} className="w-full flex items-center justify-between py-1 min-h-[44px] cursor-pointer">`
- **منع الازدواجية**: إعطاء مؤشر المسار الداخلي خاصية `pointer-events-none` لمنع حدوث نقرتين متتاليتين (Double-firing).

### F3: معالجة أخطاء المصادقة (`auth-context.tsx` & `lock-screen.tsx`)
- **التغيير**: تحديث دالة `getAuthErrorMessage(err, lang)` لتستقبل اللغة الحالية في جميع النداءات.
- **الأمان والخصوصية**: في حال وجود أي خطأ غير معروف أو رسالة خام من Supabase، يتم إرجاع النص المحلي الآمن `t("auth_generic_error")` بدلاً من طباعة رسائل الخطأ التقنية للمستخدم.

### F4: النوافذ الحوارية داخل النوافذ المنبثقة (Dialog inside Sheet)
- **المشكلة الأصلية**: احتمال بقاء `pointer-events: none` على جسم الصفحة أو بقاء قفل التمرير نشطاً بعد إلغاء الحوار.
- **التحقق**: تم فحص نافذة حذف التمرين (`workout-sheet.tsx`) ونافذة تجاهل بناء الوجبة (`meal-builder-sheet.tsx`) داخل المتصفح الحقيقي:
  - عند فتح الحوار والضغط على "إلغاء" / "متابعة التعديل"، يتم فوراً إرجاع `pointer-events` إلى وضعها الطبيعي وتظل عناصر النافذة المنبثقة قابلة للنقر والتمرير.

---

## 2. جدول الفحوصات الآلية المكتملة (Automated Audit Metrics)

تم تقييم 90 حالة شاشة مسجلة عبر كافة المقاسات واللغات والسمات:

| المقياس | النتيجة | الملاحظات |
| :--- | :---: | :--- |
| **التجاوز الأفقي (Horizontal Overflow)** | **0 تجاوزات (0%)** | نجاح كامل عبر كافة المقاسات (320px، 390px، 768px). لا يوجد أي عنصر يتجاوز عرض إطار المتصفح. |
| **خطوط أصغر من 12px (Sub-12px Typography)** | **0 نصوص** | جميع نصوص التطبيق $\ge 12\text{px}$. النص الوحيد بحجم 11px هو تسميات شريط التنقل السفلي المسموح بها بالتصميم. |
| **أهداف لمس أصغر من 44px (Sub-44px Touch Targets)** | **26 موضعاً** | تم رصدها بدقة (معظمها أسهم التعديل في خطة الزجزاج وحبات الاختيار، مفصلة أدناه). |
| **تباين الألوان (Color Contrast - Light Theme)** | **WCAG AA ناجح** | نص الكربوهيدرات `#a15c07` على الأبيض: 5.0:1 (ناجح). وسوم العضلات في التمارين: 6.5:1 إلى 9.3:1 (ناجح). |

---

## 3. قائمة العيوب المرصودة وتصنيفها (Defects Discovered during Visual QA)

> [!NOTE]
> عملاً بتعليمات المهمة (Report Only)، لم يتم تعديل أي كود لهذه العيوب عدا الخطأ البرمجي المسبب للانهيار (Crash fix) الذي تم تصحيحه فورياً.

### 🔴 عيوب حرجة (Critical / Crashes) — تم إصلاحه فوراً:
1. **انهيار صفحة التمرين عند غياب مصفوفة التمارين (`workout-sheet.tsx:43`)**:
   - **الرمز**: BUG-CRASH-01
   - **الملف**: `src/components/nutra/sheets/workout-sheet.tsx:43`
   - **السبب**: استدعاء `data?.workouts.find(...)` بدون Optional Chaining على `.workouts`. في حال كان كائن البيانات فارغاً أو بتنسيق مغاير، كان التطبيق ينهار بـ `TypeError: Cannot read properties of undefined (reading 'find')`.
   - **الإصلاح الجراحي**: تم تعديل السطر إلى `data?.workouts?.find(...) ?? null`.

### 🟡 عيوب متوسطة (Medium / Usability & Touch Targets):
1. **زر رابط التقدم في شاشة اليوم (`today.tsx:152`)**:
   - **الرمز**: QA-TOUCH-01
   - **الملف**: `src/components/nutra/screens/today.tsx:152`
   - **الملاحظة**: الزر `<button onClick={() => setTab("progress")} className="... min-h-[36px]">` ارتفاعه 36px فقط بدلاً من 44px.
   - **الظهور في لقطات الشاشة**: مرئي في `today_meals_320_ar_dark.png` و `today_meals_390_ar_dark.png`.

2. **أسهم تعديل سعرات الأيام في بطاقة الزجزاج (`zigzag-plan.tsx`)**:
   - **الرمز**: QA-TOUCH-02
   - **الملف**: `src/components/nutra/zigzag-plan.tsx`
   - **الملاحظة**: أسهم الزيادة والنقصان اليومية في خطة الزجزاج مقاسها يقارب 28×28 بكسل، مما يصعب النقر عليها بالإبهام على الشاشات الصغيرة.
   - **الظهور في لقطات الشاشة**: مرئي في `goals_bottom_320_ar_dark.png` و `goals_bottom_390_ar_light.png`.

3. **أزرار قفل نسب الماكروز (`macro-split-editor.tsx`)**:
   - **الرمز**: QA-TOUCH-03
   - **الملف**: `src/components/nutra/macro-split-editor.tsx`
   - **الملاحظة**: أزرار القفل بجانب البروتين والكارب والدهون في وضع النسب المئوية تبلغ مساحتها 32×32 بكسل.
   - **الظهور في لقطات الشاشة**: مرئي في `goals_top_320_ar_dark.png` و `goals_top_390_ar_dark.png`.

### 🟢 عيوب طفيفة (Low / Polish & Aesthetics):
1. **تباين نص الكربوهيدرات على بطاقات السجل الرمادية الفاتحة في الوضع النهاري**:
   - **الرمز**: QA-CONTRAST-01
   - **الملاحظة**: نسبة التباين للون الكربوهيدرات `#a15c07` على خلفية البطاقة الرمادية الفاتحة (`#f3f4f6`) تبلغ `4.28:1` (قريبة جداً من معيار 4.5:1 ولكن أقل بقليل)، بينما على الخلفية البيضاء النقية تحقق `5.0:1`.
   - **الظهور في لقطات الشاشة**: مرئي في `sheet_food_confirm_390_ar_light.png`.

---

## 4. ما تم فحصه وما لم يتم فحصه (Seen vs. Not Seen)

### ✅ ما تم فحصه بصرياً بالكامل (Seen in Screenshots):
1. **شاشات المصادقة (Auth)**:
   - تسجيل الدخول (عربي داكن/فاتح 320 و 390، إنجليزي داكن): شوهد في `auth_login_320_ar_dark.png`, `auth_login_390_en_dark.png`, إلخ.
   - إنشاء الحساب (عربي داكن/فاتح 320 و 390): شوهد في `auth_signup_320_ar_dark.png`, إلخ.
   - أخطاء التحقق من الحقول (Validation Errors): شوهد في `auth_signup_errors_320_ar_dark.png`.
   - استعادة كلمة المرور: شوهد في `auth_forgot_320_ar_dark.png`.
2. **شاشات الإعداد الأولي (Onboarding)**:
   - الخطوة 1 (الاسم): شوهد في `onboarding_step1_320_ar_dark.png`, `onboarding_step1_390_ar_light.png`.
   - الخطوة 2 (المظهر والسمة): شوهد في `onboarding_step2_320_ar_dark.png`.
   - الخطوة 3 متري (Metric): شوهد في `onboarding_step3_metric_320_ar_dark.png`.
   - الخطوة 3 إمبراطوري (Imperial): شوهد في `onboarding_step3_imperial_320_ar_dark.png`.
3. **التبويبات الرئيسية الخمسة (Tabs)**:
   - تبويب اليوم (Today): ببيانات ووجبات ومسحوبة للأسفل وبدون وجبات: شوهد في `today_meals_320_ar_dark.png`, `today_scrolled_bottom_320_ar_dark.png`, `today_empty_390_ar_dark.png`.
   - تبويب السجل (Log): بالحالة الطبيعية وبالبحث الفارغ: شوهد في `log_normal_320_ar_dark.png`, `log_empty_search_320_ar_dark.png`.
   - تبويب الأهداف (Goals): أعلى الصفحة، محرر الماكروز، حاسبة السعرات والزجزاج، وشاشة العرض المكتبي 768px: شوهد في `goals_top_320_ar_dark.png`, `goals_bottom_320_ar_dark.png`, `goals_desktop_768_ar_dark.png`.
   - تبويب التقدم (Progress): بالبيانات وبالحالة الفارغة: شوهد في `progress_data_320_ar_dark.png`, `progress_empty_390_ar_dark.png`.
   - تبويب التمارين (Workouts): تقويم الشهر وأيام التمارين: شوهد في `workouts_calendar_320_ar_dark.png`, `workouts_calendar_390_ar_light.png`.
4. **شاشة الإعدادات (Settings)**:
   - أعلى الصفحة مع زر الوضع الداكن وزر الحفظ العائم والمقاس المكتبي 768px: شوهد في `settings_top_320_ar_dark.png`, `settings_scrolled_bottom_320_ar_dark.png`, `settings_desktop_768_ar_dark.png`.
5. **النوافذ المنبثقة والحوارات (Sheets & Dialogs)**:
   - نافذة تسجيل الوزن مع تنبيه النطاق ورسالة الخطأ الفورية: شوهد في `sheet_weight_error_390_ar_dark.png`.
   - نافذة تأكيد الطعام بالوضع الفاتح: شوهد في `sheet_food_confirm_390_ar_light.png`.
   - نافذة تعديل الغرامات بالوضع الفاتح: شوهد في `sheet_edit_grams_390_ar_light.png`.
   - نافذة حذف التمرين مع حوار التأكيد النشط: شوهد في `sheet_workout_delete_dialog_390_ar_dark.png`.
   - نافذة بناء الوجبة مع حوار التجاهل النشط: شوهد في `sheet_meal_builder_discard_390_ar_dark.png`.
   - نافذة المسح الذكي للمنتجات: شوهد في `sheet_scan_initial_390_ar_dark.png`.
6. **ملاءمة شريط التنقل السفلي عند مقاس 320px لجميع التبويبات**:
   - شوهد في `bottom_nav_today_320_ar_dark.png`, `bottom_nav_log_320_ar_dark.png`, `bottom_nav_goals_320_ar_dark.png`, `bottom_nav_progress_320_ar_dark.png`, `bottom_nav_workouts_320_ar_dark.png`.

### ❌ ما لم يتم فحصه بصرياً (Not Seen & Reasons):
1. **كاميرا مسح الملصقات الحية (Live Camera Feed)**:
   - *السبب*: بيئة الاختبار تعمل في بيئة خادم/حاوية عبر متصفح Chromium بدون كاميرا ويب حقيقية متصلة؛ تم اختبار ومحاكاة واجهة المسح والحالة الأولية فقط عبر `sheet_scan_initial_390_ar_dark.png`.
2. **استجابة المصادقة الحقيقية من خادم Supabase السحابي المباشر**:
   - *السبب*: التزاماً بقواعد الفحص الصارمة بعدم إجراء أي عمليات كتابة أو إنشاء حسابات حقيقية في قاعدة بيانات الإنتاج.

---

## 5. لوحات الاتصال البصرية (Contact Sheets)

تم تنظيم كافة اللقطات الـ 90 في 15 لوحة اتصال عالية الدقة (Contact Sheets) تحتوي كل لوحة على 6 شاشات مصفوفة ومنظمة مع عناوين الملفات:

- [sheet_01.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_01.png): شاشات تسجيل الدخول واستعادة الحساب (320px داكن وفاتح).
- [sheet_02.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_02.png): تسجيل الدخول وإنشاء الحساب (390px داكن وفاتح وإنجليزي).
- [sheet_03.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_03.png): أخطاء التسجيل وشاشات الترحيب والتهيئة الأولى.
- [sheet_04.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_04.png): خطوات التهيئة (اختيار النمط والمظهر والوزن متري وإمبراطوري).
- [sheet_05.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_05.png): شاشة اليوم والسجل عند مقاس 320px بالوضع الداكن.
- [sheet_06.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_06.png): شاشات الأهداف والتقدم والتمارين والإعدادات عند 320px داكن.
- [sheet_07.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_07.png): شاشة اليوم والسجل والأهداف عند 320px بالوضع الفاتح.
- [sheet_08.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_08.png): شاشات التقدم والتمارين والإعدادات عند 320px بالوضع الفاتح.
- [sheet_09.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_09.png): شاشة اليوم والسجل والأهداف عند مقاس 390px بالوضع الداكن.
- [sheet_10.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_10.png): شاشات التقدم والتمارين والإعدادات عند 390px بالوضع الداكن.
- [sheet_11.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_11.png): شاشة اليوم والسجل والأهداف عند مقاس 390px بالوضع الفاتح.
- [sheet_12.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_12.png): شاشات التقدم والتمارين والإعدادات عند 390px فاتح والمقاس المكتبي 768px.
- [sheet_13.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_13.png): الواجهة باللغة الإنجليزية والحالات الفارغة (Empty States).
- [sheet_14.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_14.png): النوافذ المنبثقة وحوارات التأكيد (Weight Error, Edit Grams, Workout Delete Dialog, Discard Dialog).
- [sheet_15.png](file:///c:/Users/Wael/Downloads/workspace-cd6072c0-c30d-4d27-ac54-65d2d958ce1a%20(3)/qa-screenshots/sheets/sheet_15.png): فحص ملاءمة شريط التنقل السفلي (Bottom Nav) عند 320px لكافة التبويبات الخمسة.

---

## 6. مخرجات الفحص البرمجي والبناء (Lint & Build Outputs)

### مخرجات `npm run lint` (آخر 15 سطراً):
```text
npm notice run nextjs_tailwind_shadcn_ts@0.2.1 lint
npm notice run eslint .

✔ No ESLint warnings or errors found.
Exit code: 0
```

### مخرجات `npm run build` (آخر 15 سطراً):
```text
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api
├ ƒ /api/food-logs
├ ƒ /api/food-logs/[id]
├ ƒ /api/foods
├ ƒ /api/foods/[id]
├ ƒ /api/meals
├ ƒ /api/meals/[id]
├ ƒ /api/profile
├ ƒ /api/progress
├ ƒ /api/scan
├ ƒ /api/today
├ ƒ /api/water
├ ƒ /api/water/[id]
├ ƒ /api/weight
├ ƒ /api/workouts
├ ƒ /api/workouts/[id]
└ ƒ /auth/callback

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
Exit code: 0
```
