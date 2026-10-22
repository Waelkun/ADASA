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
