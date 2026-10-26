# Phase 1 Fix Report: Layout, Logic & Safety — Nutra (عدسة)

## Checklist F1–F11
- [x] **F1: Macro and input overflow** (`UX-035`, `UX-040`, `UX-029`, `UX-034`, `UX-042`)
- [x] **F2: Bottom dock overlap** (`UX-008`, `UX-069`, `UX-007`)
- [x] **F3: Percentages sum to exactly 100** (`UX-036`)
- [x] **F4: Bidi formula line** (`UX-037`)
- [x] **F5: Save button clarity on Goals** (`UX-030`, `UX-041`, `UX-045`)
- [x] **F6: Inverted AlertDialog actions** (`UX-071`, `UX-090`)
- [x] **F7: Imperial and unit bugs** (`UX-031`, `UX-028`, `UX-044`, `UX-074`)
- [x] **F8: Pinch-zoom** (`UX-001`)
- [x] **F9: Back chevron direction** (`UX-025`)
- [x] **F10: Progress empty state** (`UX-064`)
- [x] **F11: Header settings button returns to previous tab** (`UX-004`)

---

### F1: Macro and input overflow (UX-035, UX-040, UX-029, UX-034, UX-042)
- **Root Cause:**
  1. CSS Flexbox children default to `min-width: auto`. `NumInput` rendered native `<input>` with no `min-w-0`, causing default intrinsic width (~170px) to force macro rows past card bounds on mobile viewports.
  2. Macro input fields had no unit indicator (`غ` or `%`).
  3. Target-weight field had no placeholder text, appearing blank when unset, with a sub-12px (10px) unit label.
  4. Weekly workout row used a fixed `w-32` (128px) input that crowded the Arabic title on 320–360px screens.
  5. Calorie calculator squeezed 5 Arabic activity options into an inline `Segmented` control (~50px per option), causing label truncation.
- **Exact Changes:**
  - `src/components/nutra/num-input.tsx:21, 90-94`: Added `placeholder?: string` prop and `min-w-0` to default `<input>` classes.
  - `src/components/nutra/macro-split-editor.tsx:162-192`: Added `min-w-0` to row and input wrapper; added embedded unit badge (`غ` or `%`, text-xs); constrained end readout.
  - `src/components/nutra/screens/goals.tsx:262-288`: Added `placeholder={imperial ? "170" : "75"}` to target weight; enlarged unit label to 12px `text-xs`; changed weekly workout input from fixed `w-32` to `w-20 sm:w-28 shrink-0` with `flex-1 min-w-0` on label.
  - `src/components/nutra/calorie-calculator.tsx:121-140`: Replaced 5-option inline `Segmented` with multi-row wrapping chips (`flex flex-wrap gap-2`) with `role="radiogroup"`.
- **Verification:** Verified via `npx tsc --noEmit`. Layout geometry verified for 320px–414px viewports; all items fit within card bounds with zero horizontal overflow.

### F2: Bottom dock overlap (UX-008, UX-069, UX-007)
- **Root Cause:**
  1. `<main>` used static `pb-32` (128px) and Settings save button used `sticky bottom-24` (96px). On devices with `safe-area-inset-bottom` (34px), the dock reached ~112px tall, causing the sticky button to overlap the capsule and bottom content to clip.
  2. The 64px FAB and 8px gap on 320px screens squeezed the 5 tabs in the capsule down to ~40.8px wide (<44px minimum touch target).
- **Exact Changes:**
  - `src/app/globals.css:56-60`: Declared shared CSS variables for dock geometry: `--dock-height: 56px;`, `--dock-bottom-offset: max(env(safe-area-inset-bottom, 0px), 14px);`, `--dock-clearance: calc(var(--dock-height) + var(--dock-bottom-offset) + 28px);`, `--dock-sticky: calc(var(--dock-height) + var(--dock-bottom-offset) + 12px);`.
  - `src/app/page.tsx:287`: Replaced `pb-32` on `<main>` with `pb-[var(--dock-clearance)]`.
  - `src/components/nutra/screens/settings.tsx:158`: Replaced `sticky bottom-24` with `sticky bottom-[var(--dock-sticky)]`.
  - `src/components/nutra/bottom-nav.tsx:183-247`: Scaled FAB to 56px (`size-14`), aligned capsule height to 56px (`h-14`), adjusted padding to `px-3 sm:px-4`, yielding 46.4px width per tab on 320px screens.
- **Verification:** Verified at 320, 360, and 390px widths. Content and sticky CTA scroll completely clear of the floating navigation capsule.

### F3: Percentages sum to exactly 100 (UX-036)
- **Root Cause:** Individual percentage rounding via single-decimal `Math.round(v * 10) / 10` produced 99.9% sums (e.g. 31.5% + 37.4% + 31.0%). Helper text called `nf()` with 0 decimals, displaying contradictory rounded integers (32%/37%/31%).
- **Exact Changes:**
  - `src/components/nutra/macro-split-editor.tsx:18-50`: Implemented `calcDisplayPcts` using Largest Remainder (Hamilton-Hare) method at 1-decimal precision. Zero total calories edge case returns 0 without NaN.
  - `src/components/nutra/macro-split-editor.tsx:90, 230, 270`: Shared `displayPcts` formatted via `nf(displayPcts[k], 1)` across both row badges and the summary formula line.
- **Verification:** Tested test cases via Node.js script:
  - (160, 190, 70) -> `{ p: 31.5, c: 37.5, f: 31.0 }`, sum = 100.0%
  - (1, 1, 1) -> `{ p: 23.5, c: 23.5, f: 53.0 }`, sum = 100.0%
  - (33, 33, 34) -> `{ p: 23.2, c: 23.1, f: 53.7 }`, sum = 100.0%
  - (0, 0, 0) -> `{ p: 0, c: 0, f: 0 }`, sum = 0.0% (no NaN)

### F4: Bidi formula line (UX-037)
- **Root Cause:** Mixing RTL Arabic text, neutral arithmetic operators (`×`, `+`), parentheses, colons, and digits without directional isolation caused the browser's Unicode Bidi Algorithm to scramble parenthesis placement and detach operators from their numbers.
- **Exact Changes:**
  - `src/lib/i18n.tsx:312`: Updated `kcal_formula` dictionary key with standard whitespace around `×` and `+` operators.
  - `src/components/nutra/macro-split-editor.tsx:268-278`: Wrapped the formula expression in `<bdi className="font-medium">({t("kcal_formula")})</bdi>` and wrapped each individual macro percentage in `<bdi className="tabular">`.
- **Verification:** Verified reading order and operator attachment in Arabic (RTL) and English (LTR).

### F5: Save button clarity on Goals (UX-030, UX-041, UX-045)
- **Root Cause:** Goals tab featured multiple competing buttons labeled "حفظ" with identical styling. Disabled states provided no explanation of why they were inactive, and "تثبيت السعرات" provided no explanation when disabled in grams mode.
- **Exact Changes:**
  - `src/lib/i18n.tsx:306-310`: Added localized strings `save_daily_goals`, `save_macro_split`, `no_changes_to_save`, `lock_only_in_percent_mode`.
  - `src/components/nutra/screens/goals.tsx:300-305`: Labeled daily goals save button `{t("save_daily_goals")}`; added helper message `{t("no_changes_to_save")}` when not dirty.
  - `src/components/nutra/macro-split-editor.tsx:245-285`: Labeled macro save button `{t("save_macro_split")}`; added helper message `{t("no_changes_to_save")}` when not dirty; added `type="button"`, `role="switch"`, `aria-checked={lock}`, and helper `({t("lock_only_in_percent_mode")})` when in grams mode.
  - `src/components/nutra/calorie-calculator.tsx:195-205`: Styled "اعتمد وحفظ" as a distinctive secondary bordered pill with `<Calculator className="size-3.5 text-primary" />`.
- **Verification:** Verified distinct visual hierarchy and clear disabled-state feedback across all three sections.

### F6: Inverted AlertDialog actions (UX-071, UX-090)
- **Root Cause:** In both `settings.tsx` and `meal-builder-sheet.tsx`, `AlertDialogCancel` was wired to destructive mutations (`signOut()`, `discard()`), while `AlertDialogAction` was wired to dismiss/cancel. Dismissing with Escape or overlay click inadvertently destroyed drafts or logged the user out.
- **Exact Changes:**
  - `src/components/nutra/screens/settings.tsx:170-185`: Assigned `AlertDialogCancel` with `autoFocus` to dismiss safely; assigned `AlertDialogAction` with `bg-destructive` to perform logout.
  - `src/components/nutra/sheets/meal-builder-sheet.tsx:418-430`: Assigned `AlertDialogCancel` with `autoFocus` to keep editing safely; assigned `AlertDialogAction` with `bg-destructive` to perform draft discard.
- **Verification:** Escape and overlay dismiss close the dialog with zero side effects. Initial focus lands on the safe Cancel button so pressing Enter does not trigger destructive actions.

### F7: Imperial and unit bugs (UX-031, UX-028, UX-044, UX-074)
- **Root Cause:**
  1. `goals.tsx` compared `goalWeight === profile.goalWeightKg` without converting imperial pounds to kg, leaving the save button permanently dirty in imperial mode.
  2. `calorie-calculator.tsx:116` hardcoded `{t("kg")}` and never converted `weightKg` for imperial users.
  3. `onboarding.tsx:199` hardcoded `{t("kg")}` and did not convert pounds to kg on save.
  4. `quick-sheets.tsx:229` used hardcoded Latin string `"lb"` / `"kg"`.
- **Exact Changes:**
  - `src/components/nutra/screens/goals.tsx:123-140, 290-305`: Connected `saveGoals` with `lbToKg` conversion and updated dirty checking with a 0.05 tolerance against `currentDispGoal`.
  - `src/components/nutra/calorie-calculator.tsx:7, 45, 116`: Imported `kgToLb`, converted `dispWeight`, and displayed localized `{weightUnit}` (`t("lb")` / `t("kg")`).
  - `src/components/nutra/onboarding.tsx:8, 42-75, 195-207`: Handled imperial units for initial weight (`175 lb` vs `80 kg`), converted to kg on save, and displayed localized unit `{isImp ? t("lb") : t("kg")}`.
  - `src/components/nutra/sheets/quick-sheets.tsx:229`: Replaced hardcoded Latin `"lb"` / `"kg"` with localized `{imperial ? t("lb") : t("kg")}`.
- **Verification:** Imperial mode tested in Goals (save button disabled on clean state), Calculator (shows lb correctly), Onboarding (shows lb correctly), and Weight Sheet (shows Arabic كغ or باوند).

### F8: Pinch-zoom (UX-001)
- **Root Cause:** `src/app/layout.tsx` exported `maximumScale: 1` and `userScalable: false`, violating WCAG 1.4.4 by blocking pinch-to-zoom on mobile devices.
- **Exact Changes:**
  - `src/app/layout.tsx:41-47`: Removed `maximumScale: 1` and `userScalable: false` while keeping `viewportFit: "cover"` and responsive theme colors.
- **Verification:** Verified viewport configuration in `layout.tsx`.

### F9: Back chevron direction (UX-025)
- **Root Cause:** Onboarding back button used `ChevronLeft className="size-6 rtl:rotate-0 ltr:rotate-180"`, which pointed LEFT (`<`) in RTL (which is the forward direction).
- **Exact Changes:**
  - `src/components/nutra/onboarding.tsx:4, 240`: Replaced `ChevronLeft` with `ChevronRight className="size-6 rtl:rotate-0 ltr:rotate-180"` so back points right (`>`) in RTL and left (`<`) in LTR.
  - Grepped all other `Chevron` and `Arrow` instances in `today.tsx`, `workouts.tsx`, and `lock-screen.tsx`, confirming all other navigational arrows point in their correct chronological/navigational directions.
- **Verification:** Verified arrow orientation in RTL and LTR viewports.

### F10: Progress empty state (UX-064)
- **Root Cause:** `src/components/nutra/screens/progress.tsx:205-213` rendered an empty state card advising the user to log their weight with no interactive button or recovery path.
- **Exact Changes:**
  - `src/components/nutra/screens/progress.tsx:20, 31, 207-220`: Imported `useAppStore` and added primary "سجّل أول وزن للبدء" CTA button (`openSheet("weight")`) with `<Scale className="size-4" />`.
  - Confirmed other empty states (`today.tsx` empty meals has quick-add CTA; `workouts.tsx` allows day tapping; `log.tsx` has scan/manual CTAs).
- **Verification:** Verified empty state displays prominent CTA that opens the weight logging sheet.

### F11: Header settings button returns to previous tab (UX-004)
- **Root Cause:** Header Settings button had `onClick={() => setTab(tab === "settings" ? "today" : "settings")}`, dumping the user onto Today whenever they closed Settings.
- **Exact Changes:**
  - `src/app/page.tsx:126, 278`: Extracted `lastNavTab` from `useAppStore` and wired Settings toggle to `setTab(tab === "settings" ? lastNavTab : "settings")`.
- **Verification:** Verified that navigating to Settings from Goals, Progress, or Workouts returns to that specific tab upon closing.

---

## Files Changed in Phase 1
1. `src/app/globals.css` (F2: shared dock variables)
2. `src/app/layout.tsx` (F8: pinch-zoom enabled)
3. `src/app/page.tsx` (F2: dock clearance padding, F11: return to previous tab)
4. `src/lib/i18n.tsx` (F4: spaced bidi formula, F5: localized save and helper strings)
5. `src/components/nutra/num-input.tsx` (F1: placeholder prop, min-w-0 on input)
6. `src/components/nutra/macro-split-editor.tsx` (F1: min-w-0 and units, F3: Largest Remainder 100% display, F4: bidi formula, F5: save button clarity & lock helper)
7. `src/components/nutra/bottom-nav.tsx` (F2: 56px FAB, 56px capsule, 46.4px tab width on 320px)
8. `src/components/nutra/calorie-calculator.tsx` (F1: wrapping chips for activity, F5: distinct adopt button, F7: imperial weight display)
9. `src/components/nutra/screens/goals.tsx` (F1: placeholder and unit size, weekly workout row, F5: save daily goals button, F7: imperial dirty check & conversion)
10. `src/components/nutra/screens/settings.tsx` (F2: sticky bottom above dock, F6: inverted alert dialog action/cancel)
11. `src/components/nutra/screens/progress.tsx` (F10: log weight CTA on empty state)
12. `src/components/nutra/sheets/meal-builder-sheet.tsx` (F6: inverted alert dialog action/cancel)
13. `src/components/nutra/sheets/quick-sheets.tsx` (F7: localized kg/lb units)
14. `src/components/nutra/onboarding.tsx` (F7: imperial onboarding weight, F9: back chevron direction in RTL)

---

## Out-of-Scope Items (Not Touched)
As requested, Phases 2 and 3 items remain untouched for future phases:
- Contrast ratio adjustments on light theme pastel workout tags and carbs amber text.
- Font size enlargements for sub-12px microcopy (9px–11px text in calendar and bottom nav).
- Accessible `role="progressbar"` additions to SVG donuts and progress indicators.
- Debouncing on Log screen search input.
- `src/components/ui/*` Radix primitive class replacements.

---

## Real Phone Manual Testing Guide
To verify these fixes on a physical mobile device:
1. **Goals Screen Macro Inputs (F1, F3, F4, F5):**
   - Navigate to **الأهداف**.
   - Check that the three macro rows (بروتين/كربوهيدرات/دهون) sit completely within the card bounds on narrow screens with no horizontal overflow.
   - Verify that inputs show a unit suffix (`غ` in grams mode, `%` in percent mode).
   - In grams mode, verify the displayed percentages sum to exactly **100.0%** (e.g. 31.5% + 37.5% + 31.0%).
   - Verify the formula line displays cleanly in Arabic: parentheses wrap the entire expression, operators (`×`, `+`) remain attached to their numbers.
   - Verify the two save buttons are labeled distinctly: "حفظ الأهداف اليومية" and "حفظ توزيعة الماكروز". Verify "لا توجد تعديلات للحفظ" appears when clean.
2. **Bottom Dock & Safe Area (F2):**
   - Scroll to the bottom of Goals, Settings, and Today screens on an iPhone with a Home Indicator.
   - Verify the last cards and the Settings sticky save button scroll completely clear of the floating navigation capsule.
3. **AlertDialog Safety (F6):**
   - Open Settings -> Tap Logout icon -> In the confirmation dialog, tap Cancel or outside -> Verify you remain logged in.
   - Open Meal Builder -> Add a food -> Tap back/close -> Tap Cancel/Keep editing -> Verify draft is preserved.
4. **Imperial Unit Handling (F7):**
   - Go to Settings -> Switch units to Imperial (lb).
   - Check Goals: "حفظ الأهداف اليومية" remains disabled until a real change is made.
   - Check Calculator: displays weight in `باوند` (lb).
   - Open Weight logging sheet: displays `باوند` (lb) with appropriate placeholder.
5. **Onboarding Back Arrow (F9):**
   - Start onboarding -> Advance to Step 2 -> Check the back button arrow: it must point to the **RIGHT** (`>`) in Arabic RTL.
6. **Settings Return Navigation (F11):**
   - Navigate to the **التمارين** (Workouts) tab -> Tap the Settings gear icon in the header -> Tap it again to close Settings -> Verify you are returned to **التمارين** (not Today).




