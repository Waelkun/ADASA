# Nutra — Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Build "Nutra" — Arabic (RTL) mobile-first PWA web app for personal nutrition & fitness tracking, from the user's uploaded spec file (برومبت تطبيق تتبّع السعرات والصحة.md)

Work Log:
- Loaded fullstack-dev skill; initialized environment (Next.js 16 + TS + Tailwind 4 + shadcn/ui + Prisma/SQLite)
- Adapted spec stack to sandbox: Prisma/SQLite instead of Supabase, z-ai-web-dev-sdk VLM instead of Claude API, single demo profile (id=1) instead of auth
- prisma/schema.prisma: Profile, Food, FoodLog (+dayDate), WeightLog (unique date), WaterLog (+dayDate), Workout (JSON muscleGroups)
- scripts/seed.ts: 45d weight history, 8d water, 30d workouts (PPL), 15 Arabic foods, today's meals — idempotent
- scripts/make-icons.ts (sharp): PWA icons 192/512/maskable/apple
- scripts/make-demo-images.ts: demo product front + nutrition-facts label PNGs for scan demo
- Design system in globals.css: iOS-style light #F4F6F8, cards r=22, soft shadows, macro/water/semantic tokens, dark mode, safe-area, reduced-motion
- layout.tsx: IBM Plex Sans Arabic + Inter (next/font), html lang=ar dir=rtl, manifest, theme colors, sonner Toaster (top-center), ThemeProvider, I18nProvider
- src/lib/i18n.tsx: full ar/en dictionary (~230 keys), localStorage persist, dir switching, tabular Western digits, ar-SY-u-nu-latn date formatting
- src/lib/nutrition.ts: Mifflin-St Jeor, TDEE, suggested kcal/macros, kcal sanity check (±20%), kg/lb
- src/lib/store.ts (zustand): active tab, sheet kind, workout date
- src/lib/api.ts: TanStack Query hooks (today, profile, foods, food-logs, water, weight, workouts, progress, scan, demo-reset)
- API routes: /api/profile (GET/PUT), /api/today, /api/foods[/id], /api/food-logs[/id], /api/water[/id], /api/weight (upsert), /api/workouts[/id], /api/progress, /api/scan (VLM + Zod + sanity + rate-limit 20/h + 8MB cap + demo mode), /api/demo/reset
- Components: CalorieRing (animated SVG), MacroDonut + MacroBar, Segmented, StatCard/HeroNumber, BottomNav (4 tabs + center FAB, settings in header)
- Screens: Today (ring, macro bar/donut, water card +250/+500/+1L/undo, meals grouped w/ delete+undo-toast, streak), Log (search my foods, favorites, quick actions), Progress (weight area chart + 7d MA, range 1W/1M/3M/All, stats, weekly kcal bars, macro/water averages), Workouts (Sat-first month calendar, dots per muscle group, this-week vs target, streak, per-group counts), Settings (goals, body profile, TDEE calculator + apply, units metric/imperial, language, dark mode, demo reset)
- Sheets: QuickAdd, Scan (2 photo slots, client compression 1600px/JPEG0.8, error states, retry, demo button), FoodConfirm (editable name/brand/per-100g, grams|servings + chips 50g/100g/serving, meal selector, live totals, save-to-my-foods), Water, Weight (today/yesterday, upsert, note), Workout (presets PPL/Upper/Lower/Full, 8 muscle groups, duration, note, edit/delete)
- Fixed: lucide TriangleUp→TrendingUp (compile 500), FAB covered by tab bar (DOM order), back muscle label key (back_m), setState-in-effect lint (keyed remount pattern), delete undo toast, spelling fix (ونقرأ)

Stage Summary:
- App fully verified in browser (agent-browser, 390x844 mobile + 1280 desktop):
  ✓ Today renders ring 890/2100, macros P/C/F %, water 89%, streak, date in Levantine Arabic
  ✓ +500 water updates 2.5→3.0L (100%)
  ✓ Demo AI scan: 98% confidence, correct name/brand/serving 40g/430kcal/100g, live totals 172kcal, saved to My foods, added to log with "scan" badge
  ✓ Search + favorites work; picking food opens confirm sheet with correct live math (salmon 180g = 374kcal)
  ✓ Progress: weight chart + MA line + stats (-1.7kg total, 3.2 to goal), weekly kcal chart
  ✓ Workouts: calendar with trained-day dots, 3/4 week target, edit sheet with presets
  ✓ Settings: EN switch flips to LTR instantly, dark mode toggles, TDEE calculator, demo reset
  ✓ Weight upsert (81.2→81), delete with undo toast restores entry
  ✓ Manual entry math correct (cottage cheese 150g = 147kcal)
- lint: clean (0 errors/warnings); dev.log: clean, no runtime errors
- Deliverable: running web app at / (port 3000), PWA manifest + icons, Arabic RTL default with EN toggle

---
Task ID: 14
Agent: main (Z.ai)
Task: 6 modifications to Nutra (user request, additive-only): (1) day navigation on Today, (2) save+display meal/label thumbnails, (3) full product list + instant search in meal builder, (4) draft protection so nothing is lost on outside-tap/refresh, (5) edit grams of logged entries with proportional recalc, (6) AI scan returns estimated weight + per-100g with editable weight. Strict rules: additive changes only, no new libraries, no AI model change, nullable DB columns only, no code-wide review.

Work Log:
- prisma/schema.prisma: added nullable columns Food.imageUrl, FoodLog.{kcal100,protein100,carbs100,fat100,imageUrl}; `prisma db push` + regenerate (data intact: 17 foods/6 logs). Dev server had to be restarted (double-fork orphan: `( setsid bash -c ... & )`) because the running process kept the stale Prisma client → PrismaClientValidationError on imageUrl.
- Item 1 (day nav): store.selectedDay + setSelectedDay; useToday(date?)/useWater(date?) params; useAddWater reads store day; today.tsx date stepper (prev/date/next, next disabled on today, tap date = back to today, df() western digits, RTL-correct chevrons); workout button passes viewed date; delete-undo now restores l.dayDate (fixes UTC-slice day-slip risk). food-confirm-sheet saves with dayDate = viewed day + local loggedAt (viewed day + current clock, no tz slip).
- Item 2 (thumbnails): new ProductThumb component (fixed size, lazy, default UtensilsCrossed icon fallback incl. onError); ScanSheet makeThumbnail() 256px JPEG q0.7 from frontImg (fallback labelImg; demo fetches /demo/front.png) passed with scan result → PendingFood.imageUrl; saved into FoodLog + Food via POST bodies (validated data:image/, <400k chars); displayed in Today rows, Log rows, confirm sheet.
- Items 3+4 (meal builder): new MealBuilderSheet — full catalogue instantly (useFoods sort=usage: most-used first then newest, /api/foods?sort=usage via groupBy counts + JS sort, take 300), client-side instant filter (no per-keystroke fetch, clearing restores full list), internally scrollable list (max-h + nutra-scroll), per-item thumb/name/kcal; draft {meal,items} in state + sessionStorage (nutra-meal-draft-v1), survives refresh (toast "رجّعنا لك مسودة وجبتك"); SheetShell dismissible=false when items>0 (no overlay/swipe close); explicit إلغاء button → AlertDialog "تتجاهل الوجبة؟" (متابعة/تجاهل); draft cleared only on save/discard; save = Promise.all addLog per item (viewed-day aware, per-100g + image preserved). Entry points: first item "بناء وجبة" in QuickAddSheet + per-meal "+" button in Today meal group headers (openSheet opts mealType).
- Item 5 (edit grams): PATCH /api/food-logs/[id] (grams/kcal/macros + nullable per-100g); useUpdateFoodLog (invalidates today+progress); new EditGramsSheet — per100OfLog() uses stored per-100g or derives kcal÷grams×100 (guard grams>0; null → edit button hidden, nothing breaks); number input 16px+/48px height, 44px+ chips/buttons, live kcal/macros (kcal int, macros 1 decimal); per-100g values persisted on save so future edits stay consistent. Works on past days (edit acts on the entry itself).
- Item 6 (AI per-100g + weight): scan prompt extended for prepared meals (per-100g estimates + estimated_weight_g, serving_size_g null) + USER HINT trusted text part (note ≤300 chars); Zod estimated_weight_g nullable; ScanSheet optional "وصف أو وزن تقريبي" field sent as note; ScanResult.estimated_weight_g; scanToPending carries estimatedWeightG; FoodConfirmSheet prefill grams = estimatedWeightG > servingSizeG > 100, quantity label shows "الوزن التقديري" + hint, live totals already recompute per-100g×grams/100; per-100g saved with every add (confirm sheet + builder).
- Fixed 3 pre-existing src tsc errors in files touched anyway: bottom-nav TabId import path, scan-sheet scan.variables?.variables double-access retry bug, scan route content typing (SDK model field cast, runtime unchanged).
- Verification (agent-browser, mobile 390x844): day nav + past-day add (entry landed on Oct 24 with correct kcal math); thumbnail end-to-end (demo scan → data URL in DB → Today/Log rows, old entries show default icon, layout consistent); builder (list shows immediately 22 rows, instant search دجاج→1 row / شوربة→0, clear→19 back, overlay tap + real mouse tap outside = sheet stays, cancel→confirm dialog, متابعة keeps, reload→draft restored+toast, grams edit in draft, save→3 entries with per-100g+image, sessionStorage cleared); edit grams (40→60g = 258 kcal proportional, ring totals updated 1,153; legacy salmon Oct 22 no per-100g → derived 208/100g, 180→90g = 187 kcal, derived values persisted); scan with hint "الوزن 60 غرام" → grams prefilled 60 + estimated-weight label, 60→30g → 129 kcal live.
- Cleanup: scripts/cleanup-task14.ts removed all test entries/foods, restored salmon to seed values (180g/374kcal, per-100g from seed 208/20/0/13). Pre-existing duplicate "جبنة قريش" (from Task-1 session) left untouched.

Stage Summary:
- tsc src/ = 0 errors (incl. 3 pre-existing fixed); eslint exit 0; page 200; no console errors.
- All 6 items live and tested; all old data (Oct 22 seed entries without per-100g/images) displays and works unchanged.
- Dev server: had to restart once to load regenerated Prisma client (running detached on port 3000, survives across commands).
- Key files: new product-thumb.tsx, meal-builder-sheet.tsx, edit-grams-sheet.tsx, scripts/cleanup-task14.ts; edited store/api/types/i18n, today/log screens, sheet-shell, quick-sheets, scan/food-confirm sheets, page.tsx, api routes (foods, food-logs, food-logs/[id], scan), prisma schema.
