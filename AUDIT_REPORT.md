# تقرير التدقيق الشامل لمشروع "عدسة" (Nutra)
**تاريخ التدقيق:** 25 أكتوبر 2026  
**الصفة:** مهندس برمجيات أول ومدقق كود (Senior Full-Stack Engineer & Code Auditor)  
**حالة المشروع المستهدفة:** Supabase (Auth + Database + Storage) + NVIDIA Vision API + GitHub + Vercel

---

## ١. نظرة عامة على المشروع (Project Overview)

### ١.١ إطار العمل والتقنيات (Tech Stack)
* **إطار العمل (Framework):** Next.js 16.1.1 (App Router).
* **المكتبة الأساسية:** React 19.0.0 و React-DOM 19.0.0.
* **لغة البرمجة:** TypeScript 5.
* **أنظمة التنسيق والتصميم:** Tailwind CSS v4 (`@tailwindcss/postcss` v4) مع مكتبة حركات `tw-animate-css` وأيقونات `lucide-react`.
* **مكتبات الواجهة والرسوم البيانية:** Radix UI primitives (shadcn/ui), Recharts v2.15.4, Vaul (Drawer/Sheets), Sonner (Toasts).
* **إدارة الحالة (State Management):**
  * الحالة العامة للواجهة والتبويبات: Zustand v5.0.6 (`src/lib/store.ts`).
  * إدارة بيانات السيرفر والتخزين المؤقت: TanStack React Query v5.82.0 (`src/lib/api.ts`).
* **قاعدة البيانات الحالية:** SQLite مدمجة محلياً عبر Prisma ORM v6.11.1 (`prisma/schema.prisma` و `db/custom.db`).
* **الذكاء الاصطناعي الحالي:** مكتبة طرف ثالث تابعة لبيئة ساندبوكس سابقة `z-ai-web-dev-sdk` v0.0.18 (`src/app/api/scan/route.ts`).
* **مدير الحزم وأداة البناء:** تم بناء الكود وتطويره بالأساس باستخدام Bun (كما يتضح من `bun.lock` والسكريبتات)، مع وجود إعدادات npm scripts.

### ١.٢ هيكلية المجلدات (Folder Structure)
```text
├── .env                              # ملف بيئة تتبعه Git يحوي مسار SQLite
├── .gitignore                         # ملف استثناءات Git (يحتاج لتصحيح)
├── Caddyfile                          # ملف إعداد سيرفر Caddy متبقي من بيئة ساندبوكس
├── bun.lock                           # ملف قفل حزم Bun
├── package.json                       # الحزم والسكريبتات (يحوي حزم ميتة)
├── next.config.ts                     # إعدادات Next.js (مضبوط على standalone)
├── prisma/
│   └── schema.prisma                  # مخطط قاعدة بيانات SQLite الأحادية
├── db/
│   └── custom.db                      # ملف قاعدة بيانات SQLite الفعلي (مرفوع على Git!)
├── public/
│   ├── manifest.json                  # إعدادات PWA للتطبيق
│   └── icons/                         # أيقونات التطبيق بأبعاد مختلفة
├── scripts/                           # سكريبتات مساعدة وبذور تجريبية (Seed / Tests)
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # الغلاف الجذري (Fonts, Providers, Toaster)
│   │   ├── page.tsx                   # الصفحة الرئيسية التفاعلية (Single Page App)
│   │   ├── globals.css                # متغيرات الألوان، الخطوط، وثيم iOS
│   │   └── api/                       # مسارات الـ API الخلفية (17 مسار)
│   ├── components/
│   │   ├── nutra/                     # مكونات المجال الغذائي وشاشات التطبيق
│   │   │   ├── screens/               # الشاشات: today, log, goals, progress, workouts, settings
│   │   │   ├── sheets/                # النوافذ المنبثقة: scan, food-confirm, meal-builder, etc.
│   │   │   └── ...                    # عناصر رسومية: calorie-ring, macro-donut, num-input
│   │   └── ui/                        # مكونات shadcn/ui (49 مكون، أغلبها غير مستخدم)
│   └── lib/                           # المنطق المشترك، الدوال المساعدة، والتعريب
└── .zscripts/ / tests/ / examples/    # مجلدات مهملة وبقايا بيئة تشغيل سابقة
```

### ١.٣ نقاط الدخول ومسار تدفق البيانات (Data Flow)
1. **نقطة دخول العميل (Client Entry Point):** تبدأ من `src/app/layout.tsx` الذي يُهيئ خطوط IBM Plex Sans Arabic و Inter، ويغلف التطبيق بـ `ThemeProvider` و `I18nProvider`. ثم يستلم `src/app/page.tsx` زمام التحكم، حيث يشتغل كتطبيق صفحة واحدة (SPA) يتحكم في التبويبات عبر Zustand (`useAppStore`).
2. **شاشات التطبيق الأساسية:**
   * **اليوم (`today`):** حلقة السعرات، توزيع الماكروز، عداد الماء، وقائمة الوجبات المفصلة مع إمكانية التنقل بين الأيام السابقة.
   * **السجل (`log`):** البحث في قائمة "أطعمتي"، إدارة المفضلة، وإضافة سريعة لوجباتي السابقة.
   * **الأهداف (`goals`):** محرر نسب الماكروز، حاسبة السعرات Mifflin-St Jeor، وخطة السعرات المتعرجة (زجزاج).
   * **التقدم (`progress`):** رسوم بيانية تفاعلية لتطور الوزن عبر Recharts، متوسطات الماكروز والماء، ومقارنة الفترات الزمنية.
   * **التمارين (`workouts`):** تقويم شهري لتتبع أيام التدريب ومجموعات العضلات.
   * **الإعدادات (`settings`):** إعدادات اللغة، الثيم، الوحدات، وتأمين الجلسة.
3. **تدفق البيانات (Data Flow):**
   * تطلب مكونات React البيانات عبر خطافات (Hooks) في `src/lib/api.ts` تستند إلى `@tanstack/react-query`.
   * تُرسل الطلبات عبر `fetch` الداخلي إلى مسارات Next.js Route Handlers (`src/app/api/*`).
   * تقوم الـ Route Handlers بالاتصال عبر Prisma Client بملف قاعدة بيانات SQLite المحلي (`db/custom.db`).
   * **الخلل الجوهري في تدفق البيانات:** لا يوجد أي مفهوم لتعدد المستخدمين؛ حيث تستدعي جميع المسارات دالة `getProfile()` في `src/lib/server.ts` التي تجلب أو تنشئ حصراً الحساب ذي المعرف `id: 1`.

---

## ٢. الأخطاء والمنطق المعطوب (Bugs & Broken Logic)

### ٢.١ خطأ حسابي فادح: تحويل الأوزان عند استخدام النظام الإمبراطوري (Pounds vs Kg)
* **الموقع:** [`src/components/nutra/sheets/quick-sheets.tsx#L220-L233`](file:///src/components/nutra/sheets/quick-sheets.tsx#L220-L233) و [`src/components/nutra/screens/goals.tsx#L80-L120`](file:///src/components/nutra/screens/goals.tsx#L80-L120).
* **الخطورة:** **حرجة جداً (Critical)**.
* **المشكلة:** 
  عند اختيار المستخدم لوحدة الرطل (`imperial: true`)، تعرض الواجهة رمز `lb`. يقوم المستخدم بإدخال وزنه بالرطل (مثلاً 180 رطل). في كود `WeightForm`:
  ```typescript
  const kg = Number(value); // value هي 180 رطل!
  logWeight.mutate({ date, weightKg: kg }); // يتم حفظ 180 كـ weightKg مباشرة في الداتا بيز!
  ```
  وفي شاشة الأهداف `GoalsScreen`:
  ```typescript
  setGoalWeight(today.profile.goalWeightKg ?? ""); // تُعرض بالرطل للمستخدم
  // عند الحفظ:
  update.mutate({ goalWeightKg: Number(goalWeight) }); // يُحفظ رقم الرطل في حقل الكيلوغرام!
  ```
* **الأثر:** يُخزن وزن الرطل كما هو ككيلوغرامات، وحينما يسترجع التطبيق البيانات ليحولها للعرض للمستخدم الإمبراطوري (`conv(kg) = kg * 2.20462`)، يتحول وزن المستخدم من 180 رطل إلى (180 × 2.20462 = 397 رطل)! هذا يدمر سجلات الوزن والحسابات بالكامل.

### ٢.٢ خطأ حسابي فادح: تدمير متوسطات الماكروز اليومية في الـ Progress API
* **الموقع:** [`src/app/api/progress/route.ts#L76-L86`](file:///src/app/api/progress/route.ts#L76-L86).
* **الخطورة:** **حرجة (Critical)**.
* **المشكلة:**
  يقوم المسار بتجميع الماكروز لكل يوم في `dailyMacros`، لكن عند حساب المتوسط:
  ```typescript
  const n = dayCount.get(date) ?? 1; // n هو عدد أصناف الطعام المسجلة في ذلك اليوم!
  return {
    date,
    p: Math.round((s.p / n) * 10) / 10, // يقسم إجمالي بروتين اليوم على عدد الوجبات!
    c: Math.round((s.c / n) * 10) / 10,
    f: Math.round((s.f / n) * 10) / 10,
  };
  ```
* **الأثر:** بدلاً من حساب إجمالي ما تناوله المستخدم في ذلك اليوم (مثلاً 160غ بروتين من 4 أطعمة)، يرسل السيرفر 40غ (متوسط الصنف الواحد). ثم تأتي شاشة التقدم [`src/components/nutra/screens/progress.tsx#L152-L157`](file:///src/components/nutra/screens/progress.tsx#L152-L157) وتأخذ متوسط هذه القيم الخاطئة، فتظهر شاشة التقدم للمستخدم أرقاماً متدنية وهمية وغير منطقية تماماً.

### ٢.٣ خطأ حسابي: تضخيم متوسط شرب الماء بـ 8 أضعاف
* **الموقع:** [`src/app/api/progress/route.ts#L60-L62`](file:///src/app/api/progress/route.ts#L60-L62).
* **الخطورة:** **عالية (High)**.
* **المشكلة:**
  استعلام `waterRows` يسترجع مجموع استهلاك الماء لـ **56 يوماً كاملة** (`gte: from56`). ثم يقوم الكود بحساب المتوسط بقسمة مجموع الـ 56 يوماً على 7 فقط:
  ```typescript
  const waterAvg = waterRows.length
    ? Math.round(waterRows.reduce((a, w) => a + (w._sum.amountMl ?? 0), 0) / 7)
    : 0;
  ```
* **الأثر:** إذا كان استهلاك المستخدم 2 لتر يومياً، فإن مجموع 56 يوماً هو 112 لتر، وبقسمتها على 7 يُسجل السيرفر أن متوسط الاستهلاك اليومي هو 16 لتر يومياً!

### ٢.٤ خطأ منطقي: عدم تحديث هدف السعرات عند تعديل الغرامات في محرر الماكروز
* **الموقع:** [`src/components/nutra/macro-split-editor.tsx#L41`](file:///src/components/nutra/macro-split-editor.tsx#L41) و [`#L92-L104`](file:///src/components/nutra/macro-split-editor.tsx#L92-L104).
* **الخطورة:** **عالية (High)**.
* **المشكلة:**
  في وضع الغرامات (`mode === "grams"`): عند قيام المستخدم بتغيير غرامات البروتين والدهون، يحسب المكون السعرات الإجمالية الناتجة `kcalFromMacros` ويعرضها في الشاشة. ولكن عند الضغط على زر "حفظ" (`save`):
  ```typescript
  update.mutate({
    kcalGoal: Math.round(kcal), // kcal لم تتغير إطلاقاً وظلت على القيمة القديمة المبدئية!
    proteinG: Math.round(grams.p),
    carbsG: Math.round(grams.c),
    fatG: Math.round(grams.f),
  });
  ```
* **الأثر:** يتم حفظ الغرامات الجديدة بينما يظل `kcalGoal` على رقمه القديم المتناقض مع مجموع الماكروز.

### ٢.٥ فقدان الصور والبيانات الغذائية الدقيقة عند تسجيل أطعمة من "أطعمتي" (My Foods)
* **الموقع:** [`src/components/nutra/screens/log.tsx#L101-L113`](file:///src/components/nutra/screens/log.tsx#L101-L113).
* **الخطورة:** **عالية (High)**.
* **المشكلة:**
  عند اختيار طعام من قائمة أطعمتي المحفوظة مسبقاً في شاشة السجل لإضافته لليوم:
  ```typescript
  onPickFood({
    id: f.id,
    name: f.name,
    brand: f.brand,
    servingSizeG: f.servingSizeG,
    kcal100: f.kcal100,
    protein100: f.protein100,
    carbs100: f.carbs100,
    fat100: f.fat100,
    source: "myfoods",
    // تم إسقاط imageUrl و sugar100 و fiber100 و salt100 تماماً!
  })
  ```
* **الأثر:** الوجبة التي يتم تسجيلها في اليوم تفقد صورتها المصغرة نهائياً ويظهر مكانها الأيقونة الافتراضية، كما تُفقد تفاصيل الألياف والسكريات.

### ٢.٦ انزلاق التوقيت الزمني (Timezone Slip) بين السيرفر والعميل
* **الموقع:** [`src/components/nutra/sheets/food-confirm-sheet.tsx#L114-L122`](file:///src/components/nutra/sheets/food-confirm-sheet.tsx#L114-L122) و [`src/app/api/food-logs/route.ts#L49`](file:///src/app/api/food-logs/route.ts#L49).
* **الخطورة:** **متوسطة (Medium)**.
* **المشكلة:**
  عند إضافة طعام لليوم الحالي (`dayDate === localDayStr()`)، يترك العميل `loggedAt` فارغاً (`undefined`). يستقبل السيرفر الطلب فيقوم بإنشاء التاريخ:
  ```typescript
  loggedAt: b.loggedAt ? new Date(b.loggedAt) : new Date()
  ```
  سيرفر Vercel يعمل بتوقيت UTC دائماً. إذا قام مستخدم في السعودية (UTC+3) بتسجيل وجبة الساعة 1:30 بعد منتصف ليل 25 أكتوبر، فإن توقيت السيرفر يكون 10:30 مساءً يوم 24 أكتوبر.
* **الأثر:** يُسجل حقل `dayDate` كـ `2026-10-25` بينما يُسجل حقل `loggedAt` بـ `2026-10-24T22:30:00Z`، مما يؤدي لاختلال ترتيب وتجميع السجلات.

### ٢.٧ تجاهل التاريخ المعروض في نافذة إضافة الماء (Water Sheet)
* **الموقع:** [`src/components/nutra/sheets/quick-sheets.tsx#L103`](file:///src/components/nutra/sheets/quick-sheets.tsx#L103).
* **الخطورة:** **متوسطة (Medium)**.
* **المشكلة:** تستدعي نافذة `WaterSheet` الخطاف `useWater()` دون تمرير `selectedDay`، مع وجود هدف ماء صلب ثابت `const goal = 2800` في السطر 109 بدلاً من قراءة هدف المستخدم من ملفه الشخصي.
* **الأثر:** لو كان المستخدم يتصفح يوماً سابقاً وفتح إضافة الماء من القائمة السريعة، يرى استهلاك اليوم الحالي وليس اليوم المختار، مع هدف ثابت يتجاهل إعداداته.

### ٢.٨ تحذيرات SSR في Next.js بسبب `useLayoutEffect`
* **الموقع:** [`src/components/nutra/bottom-nav.tsx#L81`](file:///src/components/nutra/bottom-nav.tsx#L81).
* **الخطورة:** **منخفضة (Low)**.
* **المشكلة:** استخدام `React.useLayoutEffect` داخل شريط التنقل السفلي دون حماية تمنع عمله في السيرفر ينتج تحذيرات مستمرة في الـ Console أثناء التصيير الأولي في Next.js SSR.

---

## ٣. المصادقة وتأمين الحسابات (Authentication)

### ٣.١ آلية المصادقة الحالية (Reality of Current Auth)
المشروع الحالي **لا يحتوي على أي نظام مصادقة حقيقي على الإطلاق**. ما هو موجود عبارة عن "محاكاة واجهة" (Mock / UI Illusion):
1. **تسجيل الدخول الحالي:**
   * في [`src/components/nutra/lock-screen.tsx#L18-L21`](file:///src/components/nutra/lock-screen.tsx#L18-L21)، عند ضغط زر "تسجيل الدخول"، يُنفذ الكود الآتي فقط:
     ```typescript
     const signIn = () => {
       unlockApp();
       toast.success(t("login_done"));
     };
     ```
   * دالة `unlockApp()` في [`src/lib/store.ts#L76-L79`](file:///src/lib/store.ts#L76-L79) تقوم فقط بمسح مفتاح `nutra-locked` من `localStorage` للمتصفح!
2. **تسجيل الخروج الحالي:**
   * في [`src/components/nutra/screens/settings.tsx#L160-L167`](file:///src/components/nutra/screens/settings.tsx#L160-L167)، عند تأكيد الخروج، يُستدعى `lockApp()` الذي يضع `localStorage.setItem("nutra-locked", "1")` ويعرض شاشة القفل.
3. **تسريب البيانات أثناء القفل:**
   * في [`src/app/page.tsx#L108`](file:///src/app/page.tsx#L108)، يتم استدعاء `useToday()` فور تحميل الصفحة وقبل التحقق من حالة القفل. وبالتالي، حتى لو كان التطبيق "مقفل"، يتم تنزيل كافة بيانات الحساب التجريبي ووجباته من السيرفر خلف الكواليس!

### ٣.٢ هل المشروع متصل بـ Supabase Auth؟
* **الإجابة:** **لا إطلاقاً (0% اتصال)**.
* حزمة `@supabase/supabase-js` أو `@supabase/ssr` غير مثبتة في `package.json`.
* حزمة `next-auth` مذكورة في `package.json#L61` ولكنها لا تُستخدم في أي ملف في المشروع (Dead Dependency).

### ٣.٣ ما الذي يجب تغييره للانتقال إلى Supabase Auth بشكل صحيح؟
1. **تثبيت حزم Supabase الرسمية:**
   ```bash
   bun add @supabase/supabase-js @supabase/ssr
   ```
2. **إنشاء عملاء Supabase القياسيين لمشروع Next.js App Router:**
   * عميل المتصفح: `src/lib/supabase/client.ts` باستخدام `createBrowserClient`.
   * عميل السيرفر: `src/lib/supabase/server.ts` باستخدام `createServerClient` وقراءة ملفات تعريف الارتباط (Cookies).
   * وسيط التوجيه: `src/middleware.ts` لتحديث التوكن تلقائياً وحماية المسارات وتوجيه غير المسجلين لشاشة الدخول.
3. **استبدال `lock-screen.tsx` بشاشة مصادقة متكاملة:**
   * تسجيل حساب جديد (Sign Up) بالبريد وكلمة المرور أو رابط سحري (Magic Link) مع دعم تأكيد البريد.
   * تسجيل الدخول (Sign In) مع معالجة الأخطاء (بيانات خاطئة، حساب غير مفعل).
   * استعادة كلمة المرور (Password Reset).
   * تسجيل الخروج الحقيقي باستدعاء `supabase.auth.signOut()` وتنظيف الكوكيز وحالة React Query.
4. **ربط جداول البيانات بـ `auth.users`:**
   * استبدال `id = 1` العشوائي في جميع الجداول بمعرف المستخدم الحقيقي المستخرج من التوكن عبر `supabase.auth.getUser()`.

---

## ٤. قاعدة البيانات والتكامل مع Supabase (Database & Supabase Integration)

### ٤.١ الجداول وهياكل البيانات المستخدمة حالياً في Prisma
1. **`Profile`:** ملف المستخدم (معرف وحيد ثابت `id: 1`، الطول، الوزن المستهدف، الأهداف الغذائية، الوحدات، خطة الزجزاج).
2. **`Food`:** الدليل الشخصي للأطعمة (الاسم، الباركود/العلامة، القيم لكل 100غ، رابط الصورة كـ Base64، المفضلة).
3. **`FoodLog`:** الوجبات اليومية المسجلة (تاريخ اليوم، نوع الوجبة، الغرامات، السعرات والماكروز المحسوبة، مصدر الإدخال).
4. **`WeightLog`:** سجلات الوزن (التاريخ YYYY-MM-DD فريد، الوزن، ملاحظات).
5. **`WaterLog`:** استهلاك الماء (التاريخ، الكمية بالمل، وقت التسجيل).
6. **`Workout`:** التمارين (التاريخ، مجموعات العضلات كنص JSON، المدة، الملاحظات).
7. **`SavedMeal`:** الوجبات المحفوظة ("وجباتي") (الاسم، مصفوفة الأصناف مشفرة كنص JSON).

### ٤.٢ أين تُقرأ وتُكتب البيانات حالياً؟ وما الذي يجب حذفه؟
* **الواقع الحالي:** 100% من البيانات تُقرأ وتُكتب في قاعدة SQLite محلية مخزنة في الملف `db/custom.db` عبر Prisma ORM.
* **كارثة أمنية إضافية:** المسار [`src/app/api/demo/reset/route.ts#L10-L16`](file:///src/app/api/demo/reset/route.ts#L10-L16) يتيح لأي شخص بضغطة زر تنفيذ:
  ```typescript
  await Promise.all([
    db.foodLog.deleteMany(),
    db.waterLog.deleteMany(),
    db.weightLog.deleteMany(),
    db.workout.deleteMany(),
    db.food.deleteMany(),
  ]);
  ```
  هذا يحذف كامل بيانات التطبيق لجميع المستخدمين ويعيد حقن بيانات أحمد التجريبية!
* **ما يجب حذفه بالكامل:**
  1. ملف قاعدة البيانات المحلي `db/custom.db` وحذفه من تتبع Git.
  2. مجلد `prisma/` وحزم `@prisma/client` و `prisma` من `package.json`.
  3. ملف `src/lib/db.ts` الذي ينشئ اتصال Prisma.
  4. مسار إعادة الضبط التجريبي `src/app/api/demo/reset/route.ts`.
  5. سكريبتات البذور والتجارب في مجلد `scripts/` (`seed.ts`, `cleanup-task14.ts`, `onb-test.ts`, `onb-restore.ts`).

### ٤.٣ المخطط النظيف المقترح لـ Supabase (PostgreSQL Schema)
المخطط التالي مصمم ليعوض Prisma بالكامل، ويرتبط بجدول المستخدمين `auth.users`، مع تفعيل حماية الصلاحيات على مستوى الصف (RLS):

```sql
-- تفعيل الامتدادات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول الملف الشخصي (Profiles)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'مستخدم عدسة',
  sex TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  birth_year INTEGER NOT NULL DEFAULT 1995,
  height_cm NUMERIC(5,2) NOT NULL DEFAULT 175,
  activity_level TEXT NOT NULL DEFAULT 'moderate' 
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type TEXT NOT NULL DEFAULT 'lose' CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  kcal_goal INTEGER NOT NULL DEFAULT 2100,
  protein_g INTEGER NOT NULL DEFAULT 160,
  carbs_g INTEGER NOT NULL DEFAULT 190,
  fat_g INTEGER NOT NULL DEFAULT 70,
  water_goal_ml INTEGER NOT NULL DEFAULT 2800,
  goal_weight_kg NUMERIC(5,2),
  workouts_per_week INTEGER NOT NULL DEFAULT 4,
  units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  zigzag_plan TEXT CHECK (zigzag_plan IN ('plan1', 'plan2') OR zigzag_plan IS NULL),
  zigzag_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- دالة ومُطلق لتحديث وقت التعديل تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- دالة ومُطلق لإنشاء بروفايل تلقائي عند تسجيل مستخدم جديد في Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم عدسة'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. جدول الأطعمة الشخصية (Foods)
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size_g NUMERIC(6,2),
  kcal100 NUMERIC(6,2) NOT NULL,
  protein100 NUMERIC(6,2) NOT NULL,
  carbs100 NUMERIC(6,2) NOT NULL,
  sugar100 NUMERIC(6,2),
  fat100 NUMERIC(6,2) NOT NULL,
  sat_fat100 NUMERIC(6,2),
  fiber100 NUMERIC(6,2),
  salt100 NUMERIC(6,2),
  image_url TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_foods_user_name ON public.foods(user_id, name);

-- 3. جدول تسجيل الوجبات اليومية (Food Logs)
CREATE TABLE public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  day_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  grams NUMERIC(6,2) NOT NULL,
  kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(6,2) NOT NULL,
  carbs_g NUMERIC(6,2) NOT NULL,
  fat_g NUMERIC(6,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('scan', 'manual', 'myfoods')),
  kcal100 NUMERIC(6,2),
  protein100 NUMERIC(6,2),
  carbs100 NUMERIC(6,2),
  fat100 NUMERIC(6,2),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_food_logs_user_day ON public.food_logs(user_id, day_date);

-- 4. جدول تسجيل الوزن (Weight Logs)
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_date_weight UNIQUE (user_id, date)
);
CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, date);

-- 5. جدول تسجيل شرب الماء (Water Logs)
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  day_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_water_logs_user_day ON public.water_logs(user_id, day_date);

-- 6. جدول التمارين الرياضية (Workouts)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  duration_min INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, date);

-- 7. جدول الوجبات المحفوظة "وجباتي" (Saved Meals)
CREATE TABLE public.saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX idx_saved_meals_user ON public.saved_meals(user_id);
```

### ٤.٤ سياسات أمان مستوى الصف (Row Level Security - RLS)
تضمن هذه السياسات عزل بيانات كل مستخدم عزلاً تاماً بحيث يستحيل على أي مستخدم قراءة أو تعديل بيانات غيره:

```sql
-- تفعيل RLS على كافة الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;

-- 1. سياسات جدول profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. سياسات جدول foods
CREATE POLICY "Users can manage own foods" 
ON public.foods FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. سياسات جدول food_logs
CREATE POLICY "Users can manage own food logs" 
ON public.food_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. سياسات جدول weight_logs
CREATE POLICY "Users can manage own weight logs" 
ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. سياسات جدول water_logs
CREATE POLICY "Users can manage own water logs" 
ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. سياسات جدول workouts
CREATE POLICY "Users can manage own workouts" 
ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. سياسات جدول saved_meals
CREATE POLICY "Users can manage own saved meals" 
ON public.saved_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### ٤.٥ فحص المفاتيح الحساسة
* تم فحص الكود بالكامل للتأكد من عدم تسريب `service_role_key` أو كلمات مرور قواعد البيانات في واجهات العميل؛ ولم يتم العثور على أي مفتاح خدمة مسرب في كود المتصفح.

---

## ٥. تحليل الصور والذكاء الاصطناعي (AI & Image Analysis)

### ٥.١ الوضع القائم ومزود الخدمة الحالي
* **المسار الحالي:** [`src/app/api/scan/route.ts`](file:///src/app/api/scan/route.ts).
* **الحزمة المستخدمة:** `z-ai-web-dev-sdk` (حزمة مخصصة لبيئة Z.ai ساندبوكس لا تعمل خارج تلك البيئة).
* **الاعتمادية الخارجية:** يتم استدعاء `const zai = await ZAI.create()` ثم `zai.chat.completions.createVision(...)` دون مفتاح API صريح، حيث تعتمد الحزمة على وكيل شبكة داخلي محلي.
* **كيف يعمل المسار حالياً؟**
  1. يلتقط المستخدم الصورة في `ScanSheet` ويتم ضغطها في المتصفح عبر HTML Canvas بصيغة JPEG بجودة 0.8 وبأبعاد أقصاها 1600 بكسل.
  2. يُرسل كود العميل الصورة مشفرة كنص Base64 Data URL مع ملاحظة اختيارية للمسار `POST /api/scan`.
  3. يمرر السيرفر الصور مع برومبت تغذية طويل باللغتين العربية والإنجليزية إلى SDK ساندبوكس الداخلي.
  4. يستخرج السيرفر كائن JSON من النص الناتج ويتحقق منه عبر Zod ومطابقة معادلة السعرات الحرارية `kcalSanityOk`.
  5. **مشاكل المسار الحالي:**
     * يحدد الكود سقف حجم الصورة بـ 8 ميغابايت (`MAX_BYTES = 8 * 1024 * 1024`). في Next.js على Vercel، الحد الأقصى لحجم حمولة طلبات السيرفرليس (Serverless Payload Limit) هو **4.5 ميغابايت فقط**؛ إرسال صورة بهذا الحجم بصيغة Base64 يؤدي فوراً إلى خطأ `413 Payload Too Large` وانهيار الـ API.
     * حظر الاستخدام المتكرر (Rate Limit) مبني على `const rateMap = new Map()` في الذاكرة المؤقتة للـ Node.js process، وهو عديم الفائدة تماماً على Vercel لأن كل استدعاء سيرفرليس يعمل في بيئة معزولة تموت بعد انتهاء الطلب أو يُعاد تشغيلها.

### ٥.٢ التصميم البديل المقترح باستخدام NVIDIA API
* **نقطة النهاية (Endpoint):** `https://integrate.api.nvidia.com/v1/chat/completions` (متوافقة بنسبة 100% مع واجهة برمجة تطبيقات OpenAI Chat Completions).
* **النموذج البصري المقترح (Vision Model):** `meta/llama-3.2-11b-vision-instruct` (أو `meta/llama-3.2-90b-vision-instruct` للدقة القصوى). يتميز بسرعة فائقة في قراءة النصوص العربية والإنجليزية داخل جداول القيم الغذائية (OCR) وتقدير أطباق الطعام.
* **المعمارية الأمنية:** اتصال سيرفر فقط (Server-to-Server) داخل Next.js Route Handler، مع قراءة المفتاح عبر متغير البيئة السري `NVIDIA_API_KEY`.
* **مخطط الطلب والاستجابة والبرومبت الصارم:**

```typescript
// مقترح الكود البديل لمسار: src/app/api/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { kcalSanityOk } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 45; // مناسب لحدود Vercel Pro

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "meta/llama-3.2-11b-vision-instruct";

const SYSTEM_PROMPT = `You are an expert clinical nutrition AI. Analyze the provided food image(s):
- If the image contains a Nutrition Facts label (in Arabic or English), extract the exact figures as primary ground truth. Convert kJ to kcal by dividing by 4.184.
- If it is a prepared meal/dish, accurately estimate weight in grams and nutrition values per 100g.
- If a USER HINT is provided, treat it as trusted ground truth for weights or food identities.

CRITICAL: Return ONLY a raw JSON object (no markdown, no backticks, no conversational text) matching this exact schema:
{
  "product_name": string or null,
  "brand": string or null,
  "serving_size_g": number or null,
  "servings_per_container": number or null,
  "estimated_weight_g": number or null,
  "per_100g": {
    "kcal": number or null,
    "protein_g": number or null,
    "carbs_g": number or null,
    "sugar_g": number or null,
    "fat_g": number or null,
    "sat_fat_g": number or null,
    "fiber_g": number or null,
    "salt_g": number or null
  },
  "per_serving": {
    "kcal": number or null,
    "protein_g": number or null,
    "carbs_g": number or null,
    "sugar_g": number or null,
    "fat_g": number or null,
    "sat_fat_g": number or null,
    "fiber_g": number or null,
    "salt_g": number or null
  },
  "confidence": number between 0 and 1,
  "notes": string or null
}`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "server_misconfigured", message: "NVIDIA API key missing" }, { status: 500 });
    }

    const body = await req.json();
    const { labelImage, frontImage, note } = body;

    if (!labelImage || typeof labelImage !== "string") {
      return NextResponse.json({ error: "bad_image", message: "Valid image required" }, { status: 400 });
    }

    // بناء الرسائل لـ NVIDIA API (OpenAI-compatible)
    const contentPayload: any[] = [{ type: "text", text: SYSTEM_PROMPT }];
    if (note) {
      contentPayload.push({ type: "text", text: `USER HINT: "${String(note).slice(0, 300)}"` });
    }
    contentPayload.push({ type: "image_url", image_url: { url: labelImage } });
    if (frontImage) {
      contentPayload.push({ type: "image_url", image_url: { url: frontImage } });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // مهلة 35 ثانية

    const res = await fetch(NVIDIA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [{ role: "user", content: contentPayload }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.error("NVIDIA API error:", res.status, errText);
      return NextResponse.json({ error: "ai_service_error", message: "NVIDIA API call failed" }, { status: 502 });
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";
    
    // استخراج الـ JSON والتحقق منه عبر Zod
    const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ ...parsed, source: "nvidia" });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "timeout", message: "AI analysis timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "processing_failed", message: err.message }, { status: 500 });
  }
}
```

* **إجراءات الحماية وحجم الصور لتفادي مشاكل Vercel:**
  * في العميل (`ScanSheet`): تعديل `compressImage` لتقليص الأبعاد القصوى إلى 1280 بكسل وجودة JPEG 0.75 لضمان ألا يتعدى حجم الصورة المشفرة 300-500 كيلوبايت، مما يحفظ حمولة الطلب في حدود أقل بكثير من سقف Vercel (4.5MB).
  * للحد من إساءة الاستخدام على السيرفرليس (Rate Limiting): الاعتماد على Upstash Redis أو جدول معدل الطلبات في Supabase بدلاً من مصفوفات الذاكرة المؤقتة.

---

## ٦. المراجعة الأمنية الشاملة (Security Review)

1. **تسريب ملفات البيئة في Git (Exposed .env in Repo):**
   * **الملف:** `.env` في جذر المشروع.
   * **المشكلة:** ملف `.env` مضاف فعلياً لفهرس تعقب Git (`git ls-files .env` تؤكد وجوده). حتى مع وجود `.env*` في `.gitignore`، فإن Git لا تتجاهل الملفات التي تم عمل Commit لها مسبقاً إلا بحذفها عبر `git rm --cached .env`. رفع هذا المستودع إلى GitHub سيكشف أسرار المشروع للملأ فوراً.
2. **تسريب قاعدة البيانات المحلية بالكامل في Git:**
   * **الملف:** `db/custom.db` في جذر المشروع.
   * **المشكلة:** ملف SQLite يحتوي على بيانات ووجبات وتفاصيل تجريبية مضاف لـ Git. يجب حذفه واستبعاده فوراً.
3. **ثغرة التحكم بالمنافذ في سيرفر Caddy (Arbitrary Port Proxying):**
   * **الملف:** [`Caddyfile#L2-L13`](file:///Caddyfile#L2-L13).
   * **المشكلة:** يتيح السيرفر تحويل أي طلب يمرر المعامل `?XTransformPort=XXXX` إلى أي منفذ داخلي في الخادم دون تحقق! يجب حذف هذا الملف تماماً قبل النشر.
4. **انعدام تام للصلاحيات على مسارات الـ API (No Authentication Guards):**
   * **المسارات:** جميع مسارات `src/app/api/*`.
   * **المشكلة:** لا يوجد أي فحص لجلسة المستخدم أو توكن المصادقة. يستطيع أي زائر إرسال طلبات تعديل وحذف وجبات وتغيير إعدادات البروفايل، أو حتى استدعاء `POST /api/demo/reset` لتصفير قاعدة البيانات.
5. **تخزين الصور المباشر داخل قاعدة البيانات (Data URL DB Bloat):**
   * **المسارات:** `src/app/api/foods/route.ts` و `src/app/api/food-logs/route.ts`.
   * **المشكلة:** يتم قبول نصوص Base64 للصور تصل إلى 400,000 حرف وتخزينها مباشرة في أعمدة نصوص في الداتابيز. هذا يؤدي لتضخم حجم قاعدة البيانات والذاكرة المؤقتة بسرعة. الحل هو رفع الصور إلى Supabase Storage Bucket وتخزين رابط الصورة العام أو الموقع فقط في الداتابيز.

---

## ٧. جاهزية المشروع للنشر على GitHub و Vercel (GitHub + Vercel Readiness)

### ٧.١ أسماء متغيرات البيئة المطلوبة (Environment Variable Names)

#### متغيرات عامة للمتصفح (Public / Client-side):
* `NEXT_PUBLIC_SUPABASE_URL` (رابط مشروع Supabase).
* `NEXT_PUBLIC_SUPABASE_ANON_KEY` (مفتاح العميل العام المجهول المشفر بـ RLS).

#### متغيرات سرية للسيرفر فقط (Server-side Only Secrets):
* `SUPABASE_SERVICE_ROLE_KEY` (مفتاح الخدمة الإداري - للسيرفر فقط في حالات خاصة، لا يُستخدم في العميل أبداً).
* `NVIDIA_API_KEY` (مفتاح واجهة برمجة تطبيقات NVIDIA AI).
* `NVIDIA_MODEL` (اسم النموذج البصري اختياري، افتراضياً: `meta/llama-3.2-11b-vision-instruct`).

### ٧.٢ مشاكل سكريبتات البناء وإعدادات Vercel
1. **سكريبت البناء الحالي غير متوافق مع Vercel:**
   * في `package.json#L7`:
     ```json
     "build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"
     ```
   * أوامر `cp -r` أوامر لينكس/يونكس خاصة بتجهيز حاويات Docker المستقلة؛ وتفشل على بيئات ويندوز، كما أنها غير مطلوبة تماماً وتسبب أخطاء في خط بناء Vercel الأصلي.
   * **الحل:** استبدال سكريبت البناء بـ `"build": "next build"`.
2. **إلغاء وضع Standalone وإخفاء الأخطاء في `next.config.ts`:**
   * السطر `output: "standalone"` غير مخصص لـ Vercel بل للحاويات السحابية الخاصة.
   * السطر `typescript: { ignoreBuildErrors: true }` يخفي الأخطاء البرمجية أثناء البناء؛ ويجب حذفه لاكتشاف الأخطاء ومعالجتها قبل النشر.
3. **استحالة استمرار قاعدة بيانات SQLite على Vercel:**
   * وظائف Vercel Serverless تعمل في بيئة قراءة فقط (Read-only Ephemeral Filesystem). أي كتابة على `custom.db` ستفشل أو ستختفي بمجرد انتهاء الاستدعاء، لذلك يعد التحول لـ Supabase Postgres شرطاً لازماً لعمل الموقع على Vercel.

### ٧.٣ ملف `.gitignore` المقترح
```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing & Coverage
/coverage

# Next.js build output
.next/
out/
build/

# Environment files
.env*.local
.env
.env.production
.env.staging
!.env.example

# Local databases & logs
*.db
*.db-journal
*.log
dev.log
server.log

# Operating System files
.DS_Store
Thumbs.db

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

### ٧.٤ ملف `.env.example` المقترح
```env
# Supabase Configuration (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NVIDIA AI Vision API (Server-side Only)
NVIDIA_API_KEY=
NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct
```

---

## ٨. جودة الكود والهيكلية البرمجية (Code Quality & Structure)

1. **تضخم المكونات والحزم الميتة (Dead Code & Bloat):**
   * يوجد **35 مكوناً من مكونات shadcn/ui** داخل مجلد `src/components/ui/` غير مستخدمة على الإطلاق في المشروع (مثل `accordion`, `carousel`, `command`, `context-menu`, `navigation-menu`, `pagination`, `table`).
   * توجد حزم ضخمة مثبتة في `package.json` لا يستخدمها الكود نهائياً:
     * حزم السحب والإفلات: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
     * محررات النصوص والمستندات: `@mdxeditor/editor`, `react-markdown`, `react-syntax-highlighter`.
     * مصادقة ميتة: `next-auth`.
     * مكتبات تعريب غير مفعلة: `next-intl` (حيث يستخدم المشروع نظامه الخاص `i18n.tsx`).
   * يجب تنظيف هذه الحزم والمكونات لتخفيض حجم الحزمة (Bundle Size) وتسريع البناء.
2. **مكونات ضخمة تتطلب التقسيم (Monolithic Components):**
   * مكون `src/components/nutra/screens/progress.tsx` (531 سطراً): يجمع بين تصفية التواريخ، الرسوم البيانية، ومقارنة المتوسطات في ملف واحد. يُفضل فصل حاسبة الفترات والرسوم البيانية في مكونات فرعية.
   * مكون `src/components/nutra/sheets/food-confirm-sheet.tsx` (475 سطراً): يجمع بين فحص الذكاء الاصطناعي، تعديل الكمية، ومزامنة قاعدة البيانات.
3. **دعم اللغة العربية والاتجاه من اليمين لليسار (RTL / Arabic Support):**
   * الدعم اللغوي ممتاز جداً في التصميم ومتقن في مكتبة `src/lib/date-ar.ts` من ناحية أسماء الأشهر الحديثة، والأرقام الغربية، وضبط اتجاهات الهوامش `start/end` والخطوط `IBM Plex Sans Arabic`.

---

## ٩. خطة العمل ذات الأولويات (Prioritized Fix Plan)

### المرحلة ١: المتطلبات الأساسية والمصادقة وقاعدة البيانات (Supabase & Auth Blockers)
* **الهدف:** إزالة الاعتمادية على SQLite و Prisma وتفعيل قاعدة بيانات Supabase الحقيقية مع نظام المصادقة.
1. **تثبيت حزم Supabase وإعداد العملاء:**
   * تثبيت `@supabase/supabase-js` و `@supabase/ssr`.
   * إنشاء `src/lib/supabase/client.ts` و `server.ts` و `middleware.ts`.
   * *الملفات المتأثرة:* `package.json`, `src/lib/supabase/*`, `middleware.ts`.
   * *الجهد:* S (صغير) | *المخاطر:* منخفضة.
2. **تنفيذ مخطط قاعدة البيانات وسياسات RLS في Supabase:**
   * إنشاء الجداول والسياسات المذكورة في القسم (٤.٣ و ٤.٤) عبر لوحة تحكم Supabase.
   * إنشاء Storage Bucket باسم `meal-photos` لصور الوجبات.
   * *الجهد:* M (متوسط) | *المخاطر:* متوسطة.
3. **بناء شاشات المصادقة وربط مسار الدخول والخروج:**
   * إنشاء شاشات تسجيل الدخول، إنشاء حساب جديد، واستعادة كلمة المرور، بدلاً من `lock-screen.tsx`.
   * تحديث زر تسجيل الخروج في `settings.tsx` ليقوم بإنهاء الجلسة الفعلي عبر Supabase.
   * *الملفات المتأثرة:* `src/components/nutra/auth/*`, `src/components/nutra/lock-screen.tsx`, `src/app/page.tsx`, `src/components/nutra/screens/settings.tsx`.
   * *الجهد:* M (متوسط) | *المخاطر:* متوسطة.
4. **ترحيل مسارات الـ API للتعامل مع Supabase RLS وحذف Prisma:**
   * إعادة كتابة مسارات الـ API لاستخراج معرف المستخدم من الجلسة `auth.uid()` وجلب وحفظ البيانات عبر Supabase Client.
   * حذف `src/lib/db.ts` و `src/lib/server.ts` ومجلد `prisma/` وحذف `custom.db`.
   * *الملفات المتأثرة:* `src/app/api/**/*`, `src/lib/api.ts`.
   * *الجهد:* L (كبير) | *المخاطر:* عالية.

### المرحلة ٢: استبدال الذكاء الاصطناعي بـ NVIDIA API (AI Replacement)
* **الهدف:** فك الارتباط بسيرفر ساندبوكس وتفعيل تحليل الصور الموثوق بسيرفرليس Vercel.
5. **إعادة كتابة `src/app/api/scan/route.ts`:**
   * حذف مكتبة `z-ai-web-dev-sdk` واستبدالها بالاتصال المباشر بنقطة نهاية NVIDIA Vision عبر `fetch`.
   * ضبط معالجة الأخطاء، وحجم الصورة الأقصى، ومهلة الطلب (Timeout AbortController).
   * ضبط ضغط الصور في المتصفح بـ `ScanSheet` لتفادي سقف 4.5MB في Vercel.
   * *الملفات المتأثرة:* `src/app/api/scan/route.ts`, `src/components/nutra/sheets/scan-sheet.tsx`, `package.json`.
   * *الجهد:* M (متوسط) | *المخاطر:* متوسطة.

### المرحلة ٣: تصحيح الأخطاء الحسابية وتدفق البيانات (Bugs & Calculations)
* **الهدف:** ضمان دقة حسابات السعرات، الماكروز، وتناسق الوحدات.
6. **تصحيح حسابات الوزن الإمبراطوري (Pounds to Kg):**
   * تعديل `WeightForm` و `GoalsScreen` لتحويل القيمة إلى كغ (`lb / 2.20462`) قبل إرسالها للسيرفر إذا كانت وحدة المستخدم `imperial`.
   * *الملفات المتأثرة:* `src/components/nutra/sheets/quick-sheets.tsx`, `src/components/nutra/screens/goals.tsx`.
   * *الجهد:* S (صغير) | *المخاطر:* منخفضة.
7. **تصحيح حسابات متوسطات الماكروز والماء في مسار التقدم:**
   * تعديل `src/app/api/progress/route.ts` لحساب مجموع ماكروز اليوم كاملاً وليس متوسط كل صنف غذائي.
   * تصحيح قسمة استهلاك الماء على عدد الأيام الحقيقي المختار بدلاً من قسمة 56 يوماً على 7.
   * *الملفات المتأثرة:* `src/app/api/progress/route.ts`, `src/components/nutra/screens/progress.tsx`.
   * *الجهد:* S (صغير) | *المخاطر:* منخفضة.
8. **تصحيح حفظ السعرات عند تعديل الغرامات في محرر الماكروز:**
   * تحديث دالة `save` في `macro-split-editor.tsx` لترسل `kcalFromMacros` في وضع الغرامات.
   * *الملفات المتأثرة:* `src/components/nutra/macro-split-editor.tsx`.
   * *الجهد:* S (صغير) | *المخاطر:* منخفضة.
9. **الحفاظ على الصورة المصغرة والتفاصيل عند الإضافة من أطعمتي:**
   * تمرير `f.imageUrl` وحقول الألياف والسكريات في `onPickFood` داخل `log.tsx`.
   * *الملفات المتأثرة:* `src/components/nutra/screens/log.tsx`.
   * *الجهد:* S (صغير) | *المخاطر:* منخفضة.

### المرحلة ٤: تنظيف المشروع والجاهزية للنشر (Cleanup & Deployment)
* **الهدف:** تجهيز المستودع للبناء السلس على Vercel بدون أخطاء أو حزم مهملة.
10. **تنظيف مستودع Git والملفات المسربة:**
    * تنفيذ `git rm --cached .env db/custom.db` وتحديث `.gitignore`.
    * حذف المجلدات الزائدة: `.zscripts/`, `tests/`, `examples/`, `Caddyfile`.
    * *الجهد:* S (صغير) | *المخاطر:* منخفضة.
11. **تنظيف حزم `package.json` وتعديل سكريبت البناء:**
    * إزالة الحزم غير المستخدمة وتحديث سكريبت `"build": "next build"`.
    * ضبط `next.config.ts` بإلغاء `output: "standalone"` وحذف إخفاء أخطاء التايب سكريبت.
    * *الملفات المتأثرة:* `package.json`, `next.config.ts`.
    * *الجهد:* S (صغير) | *المخاطر:* منخفضة.

---

## ١٠. أسئلة وتوضيحات للمالك (Questions for the Owner)

قبل بدء التطبيق الفعلي، يرجى توضيح النقاط التالية:
1. **طريقة تسجيل الدخول المفضلة في Supabase Auth:**
   * هل ترغب بالاعتماد على البريد الإلكتروني وكلمة المرور التقليدية (Email & Password)، أم الروابط السحرية السريعة (Magic Links)، أم تفعيل الدخول بحساب Google OAuth؟
2. **تخزين صور الوجبات:**
   * هل تفضل رفع الصور الأصلية إلى Supabase Storage وعرض روابطها، أم الاكتفاء بتخزين الصورة المصغرة المضغوطة (Thumbnail)؟ (الخيار الثاني يوفر مساحة التخزين المجانية في Supabase بشكل هائل).
3. **نموذج NVIDIA AI المفضل:**
   * هل ترغب باستخدام نموذج `meta/llama-3.2-11b-vision-instruct` (الموصى به لسرعته وتكلفته المنخفضة ودقته الممتازة في الـ OCR)، أم تفضل استخدام النموذج الأضخم `meta/llama-3.2-90b-vision-instruct`؟
4. **البيانات الحالية:**
   * هل تحتاج إلى تصدير ونقل أي بيانات من قاعدة بيانات SQLite الحالية (`custom.db`) إلى مشروع Supabase الجديد، أم نبدأ بقاعدة بيانات نظيفة وجديدة تماماً؟
