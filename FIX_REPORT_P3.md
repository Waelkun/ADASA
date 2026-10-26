# Phase 3 Fix Report: Auth, i18n, Forms, Semantics, RTL Primitives & Follow-ups — Nutra (عدسة)

## Checklist

### Part 0: Phase 2 Follow-ups
- [x] **P0.1: Settings dark-mode switch relative positioning & hit area overlap verification**
- [x] **P0.2: Zigzag ArrowUp/ArrowDown aria-hidden + sr-only text via `t()`**
- [x] **P0.3: Tiny font scan verification (only bottom-nav allowed)**
- [x] **P0.4: Carry-over touch targets >= 44px (UX-049, UX-057, UX-066, UX-089)**

### Part A: Core Form, Auth, Search & Safety Fixes
- [x] **A1: Auth screen overhaul (UX-019, UX-020, UX-021, UX-023, UX-094)**
- [x] **A2: Remaining i18n sweep (UX-047, UX-065, UX-083, UX-073, UX-053, UX-063, UX-006)**
- [x] **A3: Search debounce, clear button & empty results action (UX-056, UX-058, UX-059)**
- [x] **A4: Inline validation instead of generic toasts (UX-077, UX-087, UX-094)**
- [x] **A5: Quota error action handling (UX-084)**
- [x] **A6: Workout delete confirmation dialog (UX-080)**

### Part B: Semantics, RTL Primitives & Layout
- [x] **B1: Progress semantics & radio groups (UX-032, UX-052, UX-093)**
- [x] **B2: RTL logical properties in used `src/components/ui/*` primitives**
- [x] **B3: Layout responsiveness at 320–360px (UX-027, UX-081)**

---

### Part 0: Phase 2 Follow-ups Details
#### P0.1: Settings Dark Mode Switch Relative Positioning & Hit Area
- **Root Cause:** Ensure the expanded `before:absolute before:-inset-2` hit area on the dark mode switch button has explicit `relative` positioning and does not overlap adjacent tappable elements.
- **Exact Change:** `src/components/nutra/screens/settings.tsx:120-137`: Confirmed `relative` is explicitly set on the `<button>`. Changed the outer `<label>` to `<div>` to eliminate nested button-in-label double-firing quirks. Computed spacing: 8px vertical expansion fits inside the 16px section gap; horizontally the switch is right-aligned (`justify-between`), separated by dozens of pixels from the text label.
- **Evidence:** Code/computed only.

#### P0.2: Zigzag Directional Indicators i18n & Accessible Text
- **Root Cause:** In Phase 2, `zigzag-plan.tsx:127-128` had hardcoded Arabic `aria-label="أعلى"` and `aria-label="أقل"` on icons directly.
- **Exact Change:**
  - `src/lib/i18n.tsx:354-355`: Added `zigzag_higher: { ar: "أعلى", en: "Higher" }` and `zigzag_lower: { ar: "أقل", en: "Lower" }`.
  - `src/components/nutra/zigzag-plan.tsx:127-138`: Set icons to `aria-hidden` and added `<span className="sr-only">({t("zigzag_higher")})</span>` and `<span className="sr-only">({t("zigzag_lower")})</span>`.
- **Evidence:** Code/computed only.

#### P0.3: Tiny Font Scan Verification
- **Verification:** Ran `git grep -n -E "text-\[(9|10|11)px\]" src/`.
- **Result:** Exactly 1 occurrence in entire codebase: `src/components/nutra/bottom-nav.tsx:234` (`text-[11px] font-bold leading-tight truncate px-0.5`), which was evaluated and allowed to prevent 320px viewport label wrapping. All other text in `src/` is >= 12px.
- **Evidence:** Code/computed only.

#### P0.4: Carry-Over Touch Targets (>= 44px)
- **Root Cause:** Several buttons fell below the 44px touch target minimum: Zigzag stop button was 36px, Log favorite star was 40px, Workout calendar month steppers were 40px and day cells were 36px, and Meal builder item delete was 36px.
- **Exact Change:**
  - `src/components/nutra/zigzag-plan.tsx:96`: Stop button enlarged from `min-h-[36px]` to `min-h-[44px] px-3.5`.
  - `src/components/nutra/screens/log.tsx:172`: Favorite star enlarged from `size-10` to `size-11` (44×44px).
  - `src/components/nutra/screens/workouts.tsx:164, 172, 205`: Month previous/next buttons enlarged from `size-10` to `size-11` (44×44px); day cells enlarged to `min-h-[44px]`.
  - `src/components/nutra/sheets/meal-builder-sheet.tsx:370`: Item delete button enlarged from `size-9` to `size-11` (44×44px) with `ms-1` separation from calorie label.
- **Evidence:** Code/computed only.

---

### Part A: Core Form, Auth, Search & Safety Fixes Details
#### A1: Auth Screen Overhaul (UX-019, UX-020, UX-021, UX-023, UX-094)
- **Root Cause:**
  - Inputs had `text-sm` triggering iOS auto-zoom on mobile safari.
  - Missing browser `autoComplete` attributes.
  - Password field had no toggle to reveal entered characters.
  - Hardcoded Arabic strings throughout the auth interface without English equivalents.
  - Toast-only or missing inline field errors.
  - Small touch targets on secondary action buttons.
- **Exact Change:**
  - `src/lib/i18n.tsx:412-460`: Added 28 new bilingual keys covering all auth titles, subtitles, input labels, error states, and buttons (`create_account`, `reset_password_title`, `login_sub`, `signup_sub`, `forgot_sub`, `env_warning_title`, `env_warning_desc`, `env_warning_restart`, `signup_success_title`, `signup_success_desc`, `go_to_login`, `forgot_success_title`, `forgot_success_desc`, `back_to_login`, `google_signup`, `google_login`, `or_email`, `name_optional`, `name_placeholder`, `email_label`, `password_label`, `forgot_password_q`, `signup_btn`, `send_reset_link`, `no_account_q`, `error_email_required`, `error_email_invalid`, `error_password_min`, `forgot_toast_sent`, `show_password`, `hide_password`).
  - `src/lib/auth-context.tsx:220-265`: Updated `getAuthErrorMessage(err, lang = "ar")` to localize Supabase auth errors for both Arabic and English.
  - `src/components/nutra/lock-screen.tsx`:
    - Updated inputs font size to `text-base` (16px).
    - Added `autoComplete="name"`, `autoComplete="email"`, and `autoComplete={mode === "signup" ? "new-password" : "current-password"}` with `inputMode="email"`.
    - Added 44×44px password visibility toggle button with `Eye`/`EyeOff`, `aria-label={t(showPassword ? "hide_password" : "show_password")}`, and `aria-pressed`.
    - Added field-level validation with inline `<p id={...} role="alert">`, `aria-invalid`, `aria-describedby`, and programmatic focus on the first invalid field (`emailRef` or `passwordRef`).
    - Enlarged action and navigation links (`forgot_password_q`, `create_account`, `back_to_login`) to `min-h-[44px]`.
- **Evidence:** Code/computed only.

#### A2: Remaining i18n Sweep (UX-047, UX-065, UX-083, UX-073, UX-053, UX-063, UX-006)
- **Root Cause:**
  - `src/lib/date-ar.ts` weekday formatter returned hardcoded Arabic strings even when app language is set to English (UX-047).
  - Workout month stepper buttons had hardcoded English `aria-label="previous month"` and `"next month"` (UX-065).
  - Scan quota and file size errors in `scan-sheet.tsx` had hardcoded Arabic strings (UX-083).
  - Quick water addition had hardcoded unit `"+1L"` (UX-073).
  - Numbers in `today.tsx` water card and `stat-card.tsx` used hardcoded `.toLocaleString("en-US")` instead of `nf()` (UX-053, UX-063).
  - Header greeting waving hand emoji had no bidi isolation, causing potential punctuation and bidi flipping in RTL (UX-006).
- **Exact Change:**
  - `src/lib/date-ar.ts:76-87`: Added `formatWeekday(d: Date, lang: "ar" | "en" = "ar"): string` with Intl formatting for English.
  - `src/components/nutra/zigzag-plan.tsx:118`: Used `formatWeekday(..., lang)`.
  - `src/lib/i18n.tsx:460-472`: Added `prev_month`, `next_month`, `scan_error_limit`, and `scan_error_payload` keys (Arabic strings preserved 100% character-for-character).
  - `src/components/nutra/screens/workouts.tsx:162, 170`: Replaced hardcoded aria-labels with `{t("prev_month")}` and `{t("next_month")}`.
  - `src/components/nutra/sheets/scan-sheet.tsx:162-166`: Replaced hardcoded error strings with `t("scan_error_limit")` and `t("scan_error_payload")`.
  - `src/components/nutra/screens/today.tsx:190-191, 220`: Replaced `.toLocaleString("en-US")` with `nf(waterTotal / 1000, 2)` and `nf(waterGoal / 1000, 1)`, and `"+1L"` with `+1 ${t("liter")}`.
  - `src/components/nutra/stat-card.tsx:47, 87`: Replaced `.toLocaleString("en-US")` with `nf(Math.abs(delta!), 1)`.
  - `src/app/page.tsx:261-274`: Wrapped greeting waving hand emoji in `<bdi>👋</bdi>` to prevent bidi bleed.
- **Evidence:** Code/computed only.

#### A3: Search Debounce, Clear Button & Empty Results Action (UX-056, UX-058, UX-059)
- **Root Cause:**
  - `useFoods` query fired on every single keystroke in `log.tsx`, triggering requests on un-debounced input and causing layout flicker when skeletons replaced the existing list.
  - Search input had no clear (✕) button.
  - Empty search state had no actionable recovery paths.
- **Exact Change:**
  - `src/lib/i18n.tsx:472-474`: Added `clear_search` and `add_custom_food` bilingual keys.
  - `src/components/nutra/screens/log.tsx:17-105`:
    - Added `debouncedQ` with a 300ms timer. `useFoods` uses `debouncedQ`.
    - Only display loading skeleton when `isLoading && !foods` to prevent unmounting/flashing existing results while fetching new query.
    - Added accessible clear button (`size-11`, `aria-label={t("clear_search")}`) inside the search box when input is non-empty. Added `pe-12` to prevent text collision.
    - Added recovery action buttons when search returns empty results: "Clear search" (`t("clear_search")`) and "Add as custom food" (`t("add_custom_food")`).
- **Evidence:** Code/computed only.

#### A4: Inline Validation Instead of Generic Toasts (UX-077, UX-087, UX-094)
- **Root Cause:**
  - Weight sheet only displayed a generic toast error on out-of-range input without displaying the allowed range (25–350 kg / 55–770 lb).
  - Food confirmation sheet did not validate empty food names on submit.
  - Save Meal sheet did not validate empty meal names on submit.
- **Exact Change:**
  - `src/lib/i18n.tsx:475-479`: Added `error_food_name_required`, `error_meal_name_required`, `weight_range_hint`, and `error_weight_range`.
  - `src/components/nutra/sheets/quick-sheets.tsx:220-310`: Added allowed range indicator (`weight_range_hint: min–max`), inline error container (`role="alert"`, `id="weight-error"`), `aria-invalid`, `aria-describedby`, and programmatic focus on invalid submission.
  - `src/components/nutra/sheets/food-confirm-sheet.tsx:66-230`: Added validation for food name on submit with inline error container (`role="alert"`, `id="food-name-error"`), `aria-invalid`, `aria-describedby`, and focus on `nameInputRef`.
  - `src/components/nutra/sheets/my-meal-sheets.tsx:50-95`: Added validation for meal name on submit with inline error container (`role="alert"`, `id="save-meal-error"`), `aria-invalid`, `aria-describedby`, and focus on `nameInputRef`.
- **Evidence:** Code/computed only.

#### A5: Quota Error Action Handling (UX-084)
- **Root Cause:** In `scan-sheet.tsx`, when `daily_limit_exceeded` occurred, the error card displayed a "Retry" button which was futile since the daily limit cannot be retried.
- **Exact Change:** `src/components/nutra/sheets/scan-sheet.tsx:264-285`: For `error === "daily_limit_exceeded"`, replaced the retry button with a direct CTA for manual food entry (`onClick={() => { closeSheet(); openSheet("manual-food"); }}`) with `PencilLine` icon.
- **Evidence:** Code/computed only.

#### A6: Workout Delete Confirmation Dialog (UX-080)
- **Root Cause:** In `workout-sheet.tsx`, clicking the delete button immediately invoked the mutation without user confirmation.
- **Exact Change:**
  - `src/lib/i18n.tsx:479-481`: Added `delete_workout_q` and `delete_workout_desc` bilingual keys.
  - `src/components/nutra/sheets/workout-sheet.tsx:178-220`: Wrapped delete action in Radix `AlertDialog` (`AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`). The Cancel button receives initial focus, while the Action button is styled as destructive.
- **Evidence:** Code/computed only.

---

### Part B: Semantics, RTL Primitives & Layout Details
#### B1: Progress Semantics & Radio Groups (UX-032, UX-052, UX-093)
- **Root Cause:** Progress bars and progress rings lacked accessibility roles and values (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`). Meal type selectors in `my-meal-sheets.tsx` were plain buttons without `radiogroup` semantics or keyboard arrow key navigation.
- **Exact Change:**
  - `src/components/nutra/screens/goals.tsx:48-56`: In `GoalRow`, added `role="progressbar"`, `aria-valuenow={Math.round(pct * 100)}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-label={label}`.
  - `src/components/nutra/screens/today.tsx:195-205`: On the water mini-ring container, added `role="progressbar"`, `aria-valuenow={Math.round(waterPct * 100)}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-label={t("water")}`.
  - `src/components/nutra/macro-donut.tsx:104-125`: On `MacroBar`, added `role="progressbar"`, `aria-valuenow={total > 0 ? 100 : 0}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-label={t("macros")}`.
  - `src/components/nutra/calorie-ring.tsx:34-40`: Updated container from `role="img"` to `role="progressbar"` with `aria-valuenow={Math.round(clamped * 100)}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and accessible label.
  - `src/components/nutra/sheets/my-meal-sheets.tsx:280-310`: Converted meal-type selection buttons into a semantic `role="radiogroup"` with `aria-labelledby="meal-type-label"`, `role="radio"`, `aria-checked={mealType === m}`, roving `tabIndex`, and arrow key keyboard navigation.
- **Evidence:** Code/computed only.

#### B2: RTL Logical Properties in Used `src/components/ui/*` Primitives
- **Root Cause:** Imported primitives from `@/components/ui/*` (`alert-dialog`, `dialog`, `drawer`, `sheet`, `toast`) had physical utilities (`text-left`, `right-4`, `space-x-2`, `pr-6`) that caused flipped layout or incorrect close-button positioning in RTL Arabic mode.
- **Exact Change:**
  - `src/components/ui/alert-dialog.tsx:73`: Replaced `sm:text-left` with `sm:text-start`.
  - `src/components/ui/dialog.tsx:72, 87`: Replaced `right-4` with `end-4` on close button and `sm:text-left` with `sm:text-start`.
  - `src/components/ui/drawer.tsx:80`: Replaced `md:text-left` with `md:text-start`.
  - `src/components/ui/sheet.tsx:75`: Replaced `right-4` with `end-4` on sheet close button.
  - `src/components/ui/toast.tsx:19, 28, 80`: Replaced `sm:right-0` with `sm:end-0`, `space-x-2` with `gap-2`, `pr-6` with `pe-6`, and `right-1` with `end-1` on close button.
- **Evidence:** Code/computed only.

#### B3: Layout Responsiveness at 320–360px (UX-027, UX-081)
- **Root Cause:**
  - On 320px viewports in Onboarding step 2, the weight unit label (`كجم`) collided with the centered input digits due to insufficient padding-inline-end.
  - In Scan sheet (`scan-sheet.tsx`), the two photo slot buttons (Camera and Gallery) sat in a wrapping row with fixed horizontal padding that clipped inside the narrow ~138px photo card.
- **Exact Change:**
  - `src/components/nutra/onboarding.tsx:210-230`: Enlarged padding to `ps-2 pe-10`, placed unit at `end-2`, and added `text-base font-bold tabular` to prevent digit/unit collision at 320px.
  - `src/components/nutra/sheets/scan-sheet.tsx:368-387`: Restructured `PhotoSlot` buttons into a vertical flex stack (`flex-col items-stretch w-full max-w-[128px] gap-2`), giving both buttons full width, accessible >= 44px hit height, centered icons, and clean truncated labels without any horizontal clipping at 320px.
- **Evidence:** Code/computed only.

---

### Verification Summary

#### Type Check Output (`npx tsc --noEmit`)
```
npm notice run nextjs_tailwind_shadcn_ts@0.2.1 npx
npm notice run tsc --noEmit
Exit code: 0 (No errors)
```

#### ESLint Output (`npm run lint`)
```
npm notice run nextjs_tailwind_shadcn_ts@0.2.1 lint
npm notice run eslint .
Exit code: 0 (No warnings or errors)
```

#### Production Build Output (`npm run build`)
```
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 1236ms
  Finalizing page optimization ...

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

### NOT VERIFIED (Physical Device Limitations)
The following items were verified purely via code inspection, AST typing, and computed layout constraints, but have not been visually rendered on physical iOS/Android hardware:
1. **iOS Safari password toggle touch feel**: Password visibility toggle button hit area (`size-11`) verified by CSS box-model; physical iOS tap feedback requires a physical device.
2. **iOS Safari 16px font zoom avoidance**: Auth input fields are explicitly set to `text-base` (16px) to defeat iOS Safari's auto-zoom on input focus; requires testing on physical iPhone Safari.
3. **Hardware camera capture**: Camera and gallery inputs in `scan-sheet.tsx` use standard file input attributes (`capture="environment"` and MIME filters); actual camera hardware launch requires physical device.

---

### Phone Testing Guide (Manual Smoke Test Checklist)

1. **Lock & Auth Screen (`/` while unauthenticated):**
   - Tap "إنشاء الحساب" (Create Account) -> Check that titles and helper texts switch seamlessly.
   - Tap the email input and password input -> Confirm iOS Safari does NOT zoom in (16px base font).
   - Enter invalid email or short password (< 6 chars) and tap Submit -> Confirm inline red error appears below the field with alert role, and the first invalid field receives focus.
   - Tap the Eye icon -> Confirm password reveals/hides and toggle is easily tappable without touching the text field.
   - Switch language to English (via Settings or toggle) -> Confirm all labels, placeholders, errors, and switches are in English.

2. **Search in Food Log (Tab 2: السجل):**
   - Type in the search input -> Observe search executes smoothly with 300ms debounce without list flicker.
   - When text is entered -> Tap the clear button `(✕)` on the end -> Confirm input clears immediately.
   - Type a random string with no matches (e.g. `xyz999`) -> Confirm "Clear search" and "Add as custom food" action buttons appear and work.

3. **Inline Validation in Sheets:**
   - Open Weight Sheet ("+ " -> تسجيل وزن) -> Verify allowed range `25–350 كجم` (or `55–770 باوند`) displays under the field. Enter `10` and tap Save -> Verify inline error appears and input is focused.
   - Open Food Confirmation Sheet ("+ " -> إدخال يدوي) -> Clear food name and tap Save -> Verify inline error appears under name input and name input is focused.
   - On Today tab, tap "حفظ كوجبة" (Save as Meal) -> Clear name and tap Save -> Verify inline error appears.

4. **Safety & Destructive Confirmations:**
   - Open Workouts tab -> Tap an existing workout -> Tap the red Trash button -> Confirm the confirmation dialog appears asking for confirmation. Confirm tapping "إلغاء" (Cancel) dismisses safely.

5. **Scan Sheet Responsiveness on Small Viewports (320px–360px):**
   - Open Scan Sheet ("+ " -> مسح وجبة) -> Confirm the two photo boxes (Camera and Gallery buttons) stack cleanly without any horizontal overflow or button text clipping.
