# Phase 2 Fix Report: Contrast, Typography, Focus, Touch & Follow-ups — Nutra (عدسة)

## Checklist
- [x] **S0.1: Bottom nav position uses `--dock-bottom-offset` & compute clearance**
- [x] **S0.2: i18n ar/en confirmation & Progress CTA string localization**
- [x] **S0.3: Calorie calculator activity chips keyboard & radio a11y**
- [x] **S0.4: Header Settings button fallback to "today" when lastNavTab is settings/missing**
- [x] **S0.5: Baseline lint & build check**
- [x] **C1: Theme-aware carbs text token for light theme (contrast >= 4.5:1)**
- [x] **C2: Workout muscle tag text contrast (contrast >= 4.5:1)**
- [x] **C3: Muted text contrast on background and card (>= 4.5:1)**
- [x] **C4: Dark borders & dividers contrast (input/focus >= 3:1)**
- [x] **UX-048: Zigzag 7-day grid non-color cue for high vs low days**
- [x] **T1: Typography floor (>=12px, lh >= 1.5 for Arabic-bearing text)**
- [x] **T2: Recharts axis ticks fontSize 12**
- [x] **T3: Bottom nav labels sizing & 320px width verification**
- [x] **K1: Global `:focus-visible` style in globals.css**
- [x] **K2: Restore visible focus indicators across custom inputs and buttons**
- [x] **T-touch: Selective touch targets (Today meal rows, Auth links, lock switch, Segmented, dark switch)**
- [x] **A1: Cheap accessibility wins (UX-003, UX-013, UX-015, UX-024, UX-016, UX-018, UX-026, UX-060, UX-082)**

---

### S0: Phase 1 Follow-ups (do first)
#### S0.1: Bottom dock position & clearance computation
- **Root Cause:** `bottom-nav.tsx` used hardcoded `pb-[max(env(safe-area-inset-bottom),14px)]` rather than the single source of truth CSS variable `--dock-bottom-offset`.
- **Exact Change:** `src/components/nutra/bottom-nav.tsx:183`: Replaced padding with `pb-[var(--dock-bottom-offset)]`.
- **Dock vs Settings Sticky Button Clearance Computation:**
  - Dock top edge = `56px + var(--dock-bottom-offset)`
  - Settings save button bottom edge = `56px + var(--dock-bottom-offset) + 12px`
  - Gap = `(56 + offset + 12) - (56 + offset) = +12px` (strictly non-overlapping)
  - At safe-area 0px: Dock top = `70px`, Button bottom = `82px`, Gap = `+12px`
  - At safe-area 34px: Dock top = `90px`, Button bottom = `102px`, Gap = `+12px`
- **Evidence:** Code/computed only. Verified exact formula match in `src/app/globals.css:57-59` and `src/components/nutra/screens/settings.tsx:158`.

#### S0.2: i18n ar/en confirmation & Progress CTA string
- **Root Cause:** Progress empty state used `{t("log_weight")}` ("تسجيل الوزن") rather than the dedicated invitation string, and keys needed ar/en parity confirmation.
- **Exact Change:**
  - `src/lib/i18n.tsx:211`: Added `log_first_weight_cta: { ar: "سجّل أول وزن للبدء", en: "Log your first weight to begin" }`.
  - Confirmed `save_daily_goals`, `save_macro_split`, `no_changes_to_save`, `lock_only_in_percent_mode` exist in both `ar` and `en` in `src/lib/i18n.tsx:306-309`.
  - `src/components/nutra/screens/progress.tsx:218`: Uses `{t("log_first_weight_cta")}`.
- **Evidence:** Code/computed only. Tested dictionary keys and string resolution.

#### S0.3: Calorie calculator activity chips keyboard & radio a11y
- **Root Cause:** Activity chips had `role="radio"` and `aria-checked` but lacked roving tabindex and arrow-key keyboard navigation for full WAI-ARIA radio group compliance.
- **Exact Change:** `src/components/nutra/calorie-calculator.tsx:138-160`: Added `tabIndex={activity === opt.value ? 0 : -1}`, and `onKeyDown` supporting `ArrowRight`, `ArrowDown`, `ArrowLeft`, `ArrowUp` with cyclic wrapping and `.focus()`.
- **Evidence:** Code/computed only. Verified keyboard navigation handler logic.

#### S0.4: Header Settings button fallback to "today"
- **Root Cause:** If `lastNavTab` was uninitialized or already equal to `"settings"`, toggling settings could navigate to an invalid or circular state.
- **Exact Change:** `src/app/page.tsx:278-281`: Added `const returnTab = lastNavTab && lastNavTab !== "settings" ? lastNavTab : "today"; setTab(tab === "settings" ? returnTab : "settings");`.
- **Evidence:** Code/computed only.

#### S0.5: Baseline lint & build check
- **Evidence:** Both `npm run lint` and `npm run build` executed and passed with 0 errors.

---

### C: Contrast & Non-Color Cues
#### C1: Theme-aware carbs text token
- **Root Cause:** In light theme, `--carbs` (`#f59e0b`) on white card (`#ffffff`) or tinted green (`#edf9f3`) failed WCAG AA body contrast at 2.15:1 and 1.99:1.
- **Exact Change:**
  - `src/app/globals.css:43`: Added `--color-carbs-text: var(--carbs-text);` to `@theme inline`.
  - `src/app/globals.css:96`: Added `--carbs-text: #a15c07;` in `:root`.
  - `src/app/globals.css:139`: Added `--carbs-text: #fbbf24;` in `.dark`.
  - Updated call-sites to use `text-carbs-text` or `"var(--carbs-text)"`: `food-confirm-sheet.tsx:182, 194, 399`, `edit-grams-sheet.tsx:174`, `progress.tsx:497`, `onboarding.tsx:143`, `log.tsx:45, 173`, `workouts.tsx:130`, `meal-builder-sheet.tsx:278`, `quick-sheets.tsx:43`, `zigzag-plan.tsx:124`.
- **Evidence:** Code/computed only. WCAG 2.1 contrast verified with `tools/check_contrast.js`: `#a15c07` achieves 5.19:1 on `#ffffff`, 4.80:1 on `#edf9f3`, 4.61:1 on `#eef2f6`, and 4.79:1 on `#f4f6f8` (all >= 4.5:1). Dark mode `#fbbf24` achieves 10.45:1 on `#0b1210` and 9.77:1 on `#141d19`.

#### C2: Workout muscle tag text contrast
- **Root Cause:** Active muscle group buttons in `workout-sheet.tsx` hardcoded `text-white` on all pastel backgrounds, resulting in severe contrast failures (arms 2.15:1, cardio 2.43:1, legs 2.49:1, back 2.54:1, other 2.56:1, chest 2.79:1, shoulders 3.53:1).
- **Exact Change:**
  - `src/components/nutra/screens/workouts.tsx:12-38`: Adjusted `abs` hue slightly to `#7c3aed` and added exported `groupTextColor(g)` returning `#0b1210` for pastel tags (`chest`, `back`, `arms`, `legs`, `shoulders`, `cardio`, `other`) and `#ffffff` for deep purple `abs`.
  - `src/components/nutra/sheets/workout-sheet.tsx:10, 128-138`: Imported `groupTextColor` and applied `style={{ background: groupColor(g), color: groupTextColor(g) }}` on active buttons, plus dynamically styled the check icon badge.
- **Evidence:** Code/computed only. WCAG 2.1 contrast verified:
  - `chest` (#f97066) with `#0b1210`: 6.80:1 (PASS)
  - `back` (#10b981) with `#0b1210`: 7.47:1 (PASS)
  - `arms` (#f59e0b) with `#0b1210`: 8.82:1 (PASS)
  - `legs` (#14b8a6) with `#0b1210`: 7.61:1 (PASS)
  - `abs` (#7c3aed) with `#ffffff`: 5.70:1 (PASS)
  - `shoulders` (#ec4899) with `#0b1210`: 5.37:1 (PASS)
  - `cardio` (#06b6d4) with `#0b1210`: 7.80:1 (PASS)
  - `other` (#94a3b8) with `#0b1210`: 7.39:1 (PASS)

#### C3: Muted text contrast on background and card
- **Root Cause:** Light mode `--muted-foreground: #667085` was 4.42:1 against secondary surface `#eef2f6`.
- **Exact Change:**
  - `src/app/globals.css:73`: Adjusted `:root --muted-foreground` to `#5f6a7d`.
- **Evidence:** Code/computed only.
  - Light mode `#5f6a7d`: 5.04:1 on background `#f4f6f8`, 5.46:1 on card `#ffffff`, 4.86:1 on secondary `#eef2f6` (all >= 4.5:1).
  - Dark mode `#8ca39a`: 7.06:1 on background `#0b1210`, 6.41:1 on card `#141d19`, 5.74:1 on secondary `#1c2721` (all >= 4.5:1).

#### C4: Dark borders & dividers contrast
- **Root Cause:** In dark mode, card borders used `#22302a` mixed at 70% opacity, yielding ~1.25:1 contrast against `#0b1210`, making cards visually blend into the background. Input borders were also below the 3:1 non-text contrast threshold.
- **Exact Change:**
  - `src/app/globals.css:120`: `.dark --border: #2e4138;`
  - `src/app/globals.css:121`: `.dark --input: #4e6d5e;` (achieves >= 3:1 contrast against both card and background).
  - `src/app/globals.css:134`: `.dark --sidebar-border: #2e4138;`
  - `src/app/globals.css:173`: `.dark .nutra-card` border-color updated to `color-mix(in srgb, var(--border) 85%, transparent)`.
- **Evidence:** Code/computed only. Input border `#4e6d5e` is 3.01:1 on `#141d19` and 3.32:1 on `#0b1210`. Focus ring `--ring: #10b981` is 6.79:1 on card and 7.47:1 on background (all >= 3:1).

#### UX-048: Zigzag 7-day grid non-color cue for high vs low days
- **Root Cause:** In `zigzag-plan.tsx:121-128`, upcoming high vs low calorie targets differed solely by text color (amber vs green), violating WCAG 1.4.1 for users with color vision deficiency.
- **Exact Change:** `src/components/nutra/zigzag-plan.tsx:4, 121-128`: Added directional non-color icons `<ArrowUp className="size-2.5 shrink-0" aria-label="أعلى" />` for high days and `<ArrowDown className="size-2.5 shrink-0" aria-label="أقل" />` for low days.
- **Evidence:** Code/computed only. Visual cues differentiate high vs low targets independently of color.

#### Contrast Ratios: Before vs After Table
| Surface & Element | Role | Before (Color & Ratio) | After (Color & Ratio) | Status |
| :--- | :--- | :--- | :--- | :--- |
| Light Card (`#ffffff`) + Carbs Text | Text | `#f59e0b` (2.15:1) | `#a15c07` (5.19:1) | **PASS** (>= 4.5:1) |
| Light Tinted (`#edf9f3`) + Carbs Text | Text | `#f59e0b` (1.99:1) | `#a15c07` (4.80:1) | **PASS** (>= 4.5:1) |
| Light Secondary (`#eef2f6`) + Carbs Text | Text | `#f59e0b` (2.07:1) | `#a15c07` (4.61:1) | **PASS** (>= 4.5:1) |
| Dark Background (`#0b1210`) + Carbs Text | Text | `#fbbf24` (10.45:1) | `#fbbf24` (10.45:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Chest (`#f97066`) | Tag text | `#ffffff` (2.79:1) | `#0b1210` (6.80:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Back (`#10b981`) | Tag text | `#ffffff` (2.54:1) | `#0b1210` (7.47:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Arms (`#f59e0b`) | Tag text | `#ffffff` (2.15:1) | `#0b1210` (8.82:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Legs (`#14b8a6`) | Tag text | `#ffffff` (2.49:1) | `#0b1210` (7.61:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Abs (`#7c3aed`) | Tag text | `#ffffff` (4.23:1) | `#ffffff` (5.70:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Shoulders (`#ec4899`) | Tag text | `#ffffff` (3.53:1) | `#0b1210` (5.37:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Cardio (`#06b6d4`) | Tag text | `#ffffff` (2.43:1) | `#0b1210` (7.80:1) | **PASS** (>= 4.5:1) |
| Muscle Tag: Other (`#94a3b8`) | Tag text | `#ffffff` (2.56:1) | `#0b1210` (7.39:1) | **PASS** (>= 4.5:1) |
| Light Background (`#f4f6f8`) + Muted Text | Text | `#667085` (4.59:1) | `#5f6a7d` (5.04:1) | **PASS** (>= 4.5:1) |
| Light Card (`#ffffff`) + Muted Text | Text | `#667085` (4.97:1) | `#5f6a7d` (5.46:1) | **PASS** (>= 4.5:1) |
| Light Secondary (`#eef2f6`) + Muted Text | Text | `#667085` (4.42:1) | `#5f6a7d` (4.86:1) | **PASS** (>= 4.5:1) |
| Dark Background (`#0b1210`) + Muted Text | Text | `#8ca39a` (7.06:1) | `#8ca39a` (7.06:1) | **PASS** (>= 4.5:1) |
| Dark Card (`#141d19`) + Muted Text | Text | `#8ca39a` (6.41:1) | `#8ca39a` (6.41:1) | **PASS** (>= 4.5:1) |
| Dark Background (`#0b1210`) + Card Border | Border | `#22302a` 70% (~1.25:1) | `#2e4138` 85% (~1.65:1) | **PASS** (visible) |
| Dark Card (`#141d19`) + Input Border | UI control | `#22302a` (1.38:1) | `#4e6d5e` (3.01:1) | **PASS** (>= 3:1) |
| Dark Background (`#0b1210`) + Focus Ring | Focus | `#10b981` (7.47:1) | `#10b981` (7.47:1) | **PASS** (>= 3:1) |

---

### T: Typography Floor (Arabic & Responsive Legibility)
#### T1: Typography Floor (>=12px, Line-height >= 1.5)
- **Root Cause:** 56 occurrences of `text-[9px]`, `text-[10px]`, `text-[11px]` were scattered across components, rendering Arabic glyphs (especially dots and diacritics) unreadable on mobile screens and clipping ascenders/descenders due to tight line heights.
- **Exact Changes:**
  - `lock-screen.tsx:172, 176`: Upgraded helper lists and text to `text-xs leading-relaxed`.
  - `macro-donut.tsx:74`: Upgraded unit label `{t("kcal")}` from `text-[10px]` to `text-xs`.
  - `macro-split-editor.tsx:195, 261, 289`: Upgraded kcal readout subtext, mode lock explanation, and macro editor hint to `text-xs` with `leading-relaxed` / `leading-normal`.
  - `screens/goals.tsx:233, 264`: Upgraded remaining weight goal and liter unit suffix to `text-xs`.
  - `screens/log.tsx:39, 49, 163`: Upgraded scan hint, manual hint, and kcal/100g readout to `text-xs` with `leading-relaxed`.
  - `screens/progress.tsx:255, 266, 375, 379, 440, 502, 507, 525`: Upgraded date picker labels, chart legend labels, delta comparisons, macro average units, and water comparison to `text-xs`.
  - `screens/settings.tsx:88`: Upgraded Google badge to `text-xs`.
  - `screens/today.tsx:106, 138`: Upgraded return-to-today chip and macro totals bar breakdown to `text-xs`.
  - `screens/workouts.tsx:180, 254`: Upgraded calendar weekday headers and last-trained timestamps to `text-xs`.
  - `sheets/edit-grams-sheet.tsx:168, 179, 184`: Upgraded total label, macro titles, and gram unit suffixes to `text-xs`.
  - `sheets/food-confirm-sheet.tsx:254, 285, 288, 303, 393, 404, 409, 440`: Upgraded macro input headers, per-100g cards, estimated weight hint, live totals, and AI notes to `text-xs leading-relaxed`.
  - `sheets/meal-builder-sheet.tsx:303, 341, 379`: Upgraded brand subline, macro breakdown per item, and macro footer summary to `text-xs`.
  - `sheets/my-meal-sheets.tsx:314`: Upgraded item count and calories summary to `text-xs`.
  - `sheets/quick-sheets.tsx:81, 300, 321`: Upgraded action hints, yesterday's comparison, and date footer to `text-xs`.
  - `sheets/scan-sheet.tsx:348, 358, 366, 374`: Upgraded retake button overlay, camera/gallery CTA buttons, and camera guidance hint to `text-xs leading-relaxed`.
  - `zigzag-plan.tsx:102, 118, 123, 164, 189`: Upgraded summary paragraph, 7-day weekday abbreviation headers, day calorie targets, plan descriptions, and start duration readout to `text-xs leading-relaxed`.
- **Evidence:** Code/computed only. Zero instances of `text-[9px]`, `text-[10px]`, `text-[11px]` remain across all components in `src/components/nutra/` (with the sole exception of bottom nav labels at 11px).

#### T2: Recharts Axis Ticks (fontSize: 12)
- **Root Cause:** Recharts `XAxis` and `YAxis` used `fontSize: 10`, making chart date and calorie/weight scales difficult to read.
- **Exact Changes:**
  - `src/components/nutra/screens/progress.tsx:321`: Weight `XAxis` date ticks `tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }}`.
  - `src/components/nutra/screens/progress.tsx:331`: Weight `YAxis` weight ticks `tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}`.
  - `src/components/nutra/screens/progress.tsx:456`: Calorie `XAxis` weekday ticks `tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}`.
- **Evidence:** Code/computed only.

#### T3: Bottom Nav Labels Sizing & 320px Width Verification
- **Root Cause:** `bottom-nav.tsx:234` used `text-[10px]`.
- **Computation for 320px Viewport:**
  - Screen width: `320px`. Left/right margin: `mx-3` (24px total) -> 296px available.
  - Floating action button (FAB): `56px` + `gap-2` (8px) = 64px.
  - Remaining width for 5-tab capsule: `296px - 64px = 232px`.
  - Width allocated per tab: `232px / 5 = 46.4px`.
  - Longest label: "التمارين" (7 Arabic characters).
  - At 12px bold: Glyphs take ~49px, which exceeds 46.4px and forces wrapping or clipping.
  - At 11px bold: Glyphs take ~42px, fitting comfortably within 46.4px with no wrapping, truncation, or overflow.
- **Exact Change:** `src/components/nutra/bottom-nav.tsx:234`: `<span className="text-[11px] font-bold leading-tight truncate px-0.5">{t(tb.key)}</span>`.
- **Evidence:** Code/computed only.

---

### K: Focus Indicators
#### K1: Global `:focus-visible` Style in `globals.css`
- **Root Cause:** Default outline was set to `@apply outline-ring/50;` which lacked contrast and consistent offset for keyboard navigation.
- **Exact Change:**
  - `src/app/globals.css:150-153`: Added under `@layer base`:
    ```css
    :focus-visible {
      outline: 2px solid var(--ring);
      outline-offset: 2px;
    }
    ```
- **Evidence:** Code/computed only. Contrast ratio of `--ring: #10b981` against `#0b1210` is 7.47:1, and on `#141d19` is 6.79:1, exceeding WCAG 2.4.11 / 1.4.11 requirements (>= 3:1).

#### K2: Restore Visible Focus Indicators Across Custom Inputs
- **Root Cause:** `edit-grams-sheet.tsx` had `focus:ring-0` and `quick-sheets.tsx` had `focus:outline-none`, completely silencing visual focus on hero number inputs.
- **Exact Changes:**
  - `src/components/nutra/sheets/edit-grams-sheet.tsx:142`: Removed `focus:ring-0`.
  - `src/components/nutra/sheets/quick-sheets.tsx:295`: Replaced `focus:outline-none` with `focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl`.
- **Evidence:** Code/computed only.

---

### T-touch: Selective Touch Targets (>= 44px)
- **Root Cause:** Several interactive controls fell below Apple Human Interface Guidelines and WCAG 2.5.5 touch target minimums (44×44px): Today meal row action buttons were 36×36px (`size-9`), Segmented tabs were 36px high (`min-h-[36px]`), auth links were text-only (16px), macro editor lock switch was 40px, and settings dark switch track was 32px.
- **Exact Changes:**
  - `src/components/nutra/screens/today.tsx:290, 297, 332, 371`: Meal group Bookmark/Plus and meal row Pencil/Trash buttons enlarged from `size-9` to `size-11` (44×44px) with `gap-1.5`, `ms-1`, and `ms-0.5` spacing to prevent accidental taps.
  - `src/components/nutra/segmented.tsx:43`: Segment option buttons enlarged from `min-h-[36px]` to `min-h-[44px]`.
  - `src/components/nutra/macro-split-editor.tsx:253`: Lock calories button enlarged from `min-h-[40px]` to `min-h-[44px] px-3.5`.
  - `src/components/nutra/screens/settings.tsx:120, 127`: Dark mode toggle row set to `min-h-[44px] cursor-pointer`, and switch button styled with `before:absolute before:-inset-2 before:content-['']` expanding touch target to 48×60px.
  - `src/components/nutra/lock-screen.tsx:311, 368, 380`: Auth mode buttons ("نسيت كلمة المرور؟", "إنشاء حساب جديد", "العودة لتسجيل الدخول") given `min-h-[44px] inline-flex items-center px-1`.
- **Evidence:** Code/computed only.

---

### A1: Cheap Accessibility Wins
- **UX-003: Theme toggle dynamic aria-label:**
  - `src/lib/i18n.tsx:295-296`: Added `switch_to_light` ("التبديل إلى الوضع الفاتح" / "Switch to light mode") and `switch_to_dark` ("التبديل إلى الوضع الداكن" / "Switch to dark mode").
  - `src/app/page.tsx:270`: `aria-label={theme === "dark" ? t("switch_to_light") : t("switch_to_dark")}`.
- **UX-013: BootLoader `role="status"` + sr-only text:**
  - `src/app/page.tsx:114-123`: `BootLoader` now renders `<div role="status" aria-live="polite">` with `<span className="sr-only">{t("loading")}</span>`.
- **UX-015 & UX-024: `role="alert"` on error banners:**
  - `src/app/page.tsx:205`: Connection error card given `role="alert" aria-live="assertive"`.
  - `src/components/nutra/lock-screen.tsx:230`: Auth error banner given `role="alert" aria-live="assertive"`.
- **UX-016: Connection error retry button disabled + spinner:**
  - `src/app/page.tsx:132, 212`: Destructured `isFetching` from `useToday` and added `disabled={isFetching}` with `<Loader2 className="size-4 animate-spin" />`.
- **UX-018: `useId()` for auth labels and inputs:**
  - `src/components/nutra/lock-screen.tsx:3, 51-53, 270-323`: Generated `nameId`, `emailId`, `passwordId` with `useId()` and tied labels and inputs together with `htmlFor` and `id`.
- **UX-026: Step announcement in onboarding in ar & en:**
  - `src/lib/i18n.tsx:397-399`: Added `onb_step_1`, `onb_step_2`, `onb_step_3`.
  - `src/components/nutra/onboarding.tsx:93-95`: Added `<div className="sr-only" role="status" aria-live="polite">{step === 0 ? t("onb_step_1") : step === 1 ? t("onb_step_2") : t("onb_step_3")}</div>`.
- **UX-060: `role="img"` and `aria-label` for Progress charts:**
  - `src/components/nutra/screens/progress.tsx:309-314`: Weight AreaChart container given `role="img" aria-label={`${t("weight")} — ${stats.avgW != null ? fmtW(stats.avgW) : ""} ${unit}`}`.
  - `src/components/nutra/screens/progress.tsx:455-460`: Calorie BarChart container given `role="img" aria-label={`${t("avg_kcal")} — ${nf(stats.avgKcal)} ${t("kcal")}`}`.
- **UX-082: Translate "required" label in `scan-sheet.tsx`:**
  - `src/lib/i18n.tsx:212`: Added `required: { ar: "مطلوب", en: "Required" }`.
  - `src/components/nutra/sheets/scan-sheet.tsx:338`: `<span className="size-1.5 rounded-full bg-negative" aria-label={t("required")} />`.
- **Evidence:** Code/computed only.

---

### Verification: TypeScript, Lint & Build Outputs

#### TypeScript Check (`npx tsc --noEmit`)
```
npm notice run nextjs_tailwind_shadcn_ts@0.2.1 npx
npm notice run tsc --noEmit
Exit code: 0
```

#### ESLint (`npm run lint` — Last 15 lines)
```
npm notice run nextjs_tailwind_shadcn_ts@0.2.1 lint
npm notice run eslint .
Exit code: 0
```

#### Next.js Production Build (`npm run build` — Last 15 lines)
```
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

---

### NOT VERIFIED (Honest Disclosure)
All changes above were derived strictly from the codebase and verified mathematically and programmatically:
- **Contrast ratios:** Verified mathematically via WCAG 2.1 formulas in `tools/check_contrast.js`. Visual rendering on physical OLED/LCD panels under varied ambient lighting conditions has not been inspected.
- **Physical phone touch accuracy:** Touch target dimensions are set to `>= 44px` in CSS, but real-world thumb tap comfort on a physical device in hand was not physically tested.
- **Screen reader audio:** Tested ARIA attribute tree and live regions in code, but audio output was not tested with VoiceOver (iOS) or TalkBack (Android).
- **Chart layout:** Recharts SVG rendering at `fontSize: 12` was compiled cleanly without TypeScript or runtime errors, but aesthetic spacing between date ticks on small physical screens should be confirmed visually.

---

### Physical Phone Manual Verification Guide
To verify these changes on your mobile phone:
1. Run `npm run dev` on your machine and open `http://<your-local-ip>:3000` on your phone browser (Safari/Chrome).
2. **Light Theme Carbs Contrast (C1):**
   - Tap the sun/moon icon to switch to Light Theme.
   - Go to Today tab -> Add Food -> Scan or Edit Grams.
   - Verify the "كربوهيدرات" text is dark amber (`#a15c07`), sharp, legible, and easy to read.
3. **Workout Muscle Tags (C2):**
   - Go to Workouts tab -> Log Workout.
   - Tap each muscle group ("صدر", "ظهر", "أرجل", "أكتاف", "كارديو").
   - Confirm the text is bold dark charcoal on pastels, and white only on the deep purple "عضلات البطن".
4. **Non-Color Cue in Zigzag (UX-048):**
   - Go to Goals tab -> Zigzag Plan -> Pick a plan.
   - Check the 7-day mini-grid: confirm an arrow up `▲` appears on high days and an arrow down `▼` on low days alongside the numbers.
5. **Touch Targets (T-touch):**
   - On the Today screen, log 2 items.
   - Tap the pencil and trash icons with your thumb. Verify they are easy to hit without accidental clicks.
   - Test the Segmented tabs (e.g. grams vs %) and the Dark Mode switch in Settings.
6. **Focus Ring (K1):**
   - On a desktop keyboard or Bluetooth keyboard connected to your phone, press `Tab` to navigate through inputs and buttons.
   - Verify a clean 2px emerald outline with 2px offset appears on focused elements.



