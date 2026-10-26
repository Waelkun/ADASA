# Full UI/UX Audit Report — Nutra (عدسة)

**Date:** 2026-10-26  
**Auditor:** Antigravity AI Code Auditor  
**Audit Scope:** Full codebase audit covering 31 screens, sheets, modals, and states across categories A through J.  
**Mode:** AUDIT ONLY — Zero source files modified.  
**Execution Environment:** Next.js 16.1.1 (App Router), Tailwind CSS v4, React 19, Lucide React, Radix UI. Dev server active on `http://localhost:3000`. Visual verification conducted on unauthenticated surfaces via headless Chromium (widths 320, 360, 375, 390, 414, 768px in RTL, light and dark themes); authenticated screens audited via deep static code analysis, CSS layout math, and verified against user-provided reference screenshots.

---

## 1. Summary Table

### Findings by Severity
| Severity | Description | Count | % of Total |
|:---|:---|:---:|:---:|
| **Critical** | Blocks use, accessibility failure, or data loss/corruption | **9** | 9.4% |
| **High** | Visibly broken layout, clipping, bidi scrambling, or confusing behavior | **22** | 22.9% |
| **Medium** | Visual polish, contrast warnings, sizing inconsistency, sub-44px targets | **43** | 44.8% |
| **Low** | Minor cosmetic flaws, string refinements, icon consistency | **22** | 22.9% |
| **Total Findings** | **Exhaustive count across 31 surfaces** | **96** | **100%** |

### Findings by Category (A–J)
| Category | Category Name | Count | Key Concerns |
|:---:|:---|:---:|:---|
| **A** | **Accessibility (A11y)** | **18** | Missing focus rings, zero `role="progressbar"`, zoom disabling, missing radio/state semantics |
| **B** | **Touch & Interaction** | **16** | 38+ sub-44px targets, zero tactile feedback on header, missing confirmation on deletions |
| **C** | **Layout & Responsive** | **10** | Missing `min-w-0` overflow (S1), bottom dock clipping (S7), 320px element crowding |
| **D** | **Typography & Color** | **10** | 56+ sub-12px Arabic texts (S5), severe 2.1:1 light-mode contrast, dark card invisible borders (S10) |
| **E** | **Forms & Feedback** | **18** | Inverted Alert Dialogs, missing input placeholders (S3), generic error toasts, unvalidated bounds |
| **F** | **Navigation** | **2** | Inverted RTL chevrons in onboarding, settings tab loss |
| **G** | **Consistency** | **5** | Triple save buttons (S6), emojis as structural icons, button glow competition |
| **H** | **Data Display & Logic** | **7** | Percentages sum to 99.9% (S2), rounding contradictions, imperial lb/kg dirty-check bugs |
| **I** | **Text & i18n** | **8** | Bidi punctuation garbling (S4), hardcoded English aria-labels, un-isolated Latin units ("kg", "lb") |
| **J** | **Perceived Performance / CLS** | **2** | Un-debounced search input, layout shifts (CLS) on dynamic list loads |
| **Total** | | **96** | |

---

## 2. Findings Grouped by Screen

### Screen 1: App Shell, Header & Theme Switcher
- **UX-001** | Critical | A | App Shell | All viewports / All themes | `src/app/layout.tsx:45` | `maximumScale: 1, userScalable: false` disables pinch-to-zoom on mobile | Violates WCAG 1.4.4 Resize Text (Level AA). Low-vision users are prevented from enlarging text and controls on touch devices | Remove `maximumScale: 1` and `userScalable: false` from viewport export in `layout.tsx`.
- **UX-002** | Medium | A | Header | All viewports / All themes | `src/app/page.tsx:237-251` | Header icon buttons lack `focus-visible` outline or ring | Keyboard and switch-control users cannot perceive focus indicators when tabbing through the header | Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` to both header buttons.
- **UX-003** | Low | A | Header | All viewports / Dark theme | `src/app/page.tsx:238` | Theme toggle `aria-label` is static `t("dark_mode")` regardless of current state | Screen reader announces "الوضع الليلي" even when dark mode is already active and pressing toggles to light | Dynamically toggle aria-label between `t("light_mode")` and `t("dark_mode")` based on `theme === "dark"`.
- **UX-004** | Medium | F | Header | All viewports / All themes | `src/app/page.tsx:246` | Settings button toggles strictly between `settings` and `today` (`tab === "settings" ? "today" : "settings"`) | If user opens Settings from Goals, Progress, or Workouts, closing Settings dumps them onto Today, losing their navigation position | Use `lastNavTab` from store to restore previous tab instead of hardcoding fallback to `"today"`.
- **UX-005** | Low | B | Header | All viewports / All themes | `src/app/page.tsx:240,247` | Header icon buttons lack active press feedback (`active:scale-95`) | Inconsistent tactile feedback compared to bottom nav and cards across the app | Add `active:scale-95 transition-transform` to both header buttons.
- **UX-006** | Low | I | Header | Mobile viewports / All themes | `src/app/page.tsx:218-219` | Greeting string concatenates Arabic text, comma, and trailing emoji `👋` without directional isolation | Emojis at the boundary of RTL text strings can render misplaced or flip to the start of the line | Wrap emoji or name in `<bdi>` or directional isolate `\u2067`.

### Screen 2: Bottom Navigation Dock & FAB
- **UX-007** | High | C | Bottom Nav & FAB | Viewports <= 360px / All themes | `src/components/nutra/bottom-nav.tsx:184-247` | On narrow screens (320-360px), 64px FAB + 8px gap + 5-tab capsule crowds viewport width; tab width drops to 40.8px (<44px target) and FAB shadow/border visually collides with capsule curve (Defect S7) | Fails touch target size (WCAG 2.5.8) and creates visible element collision on small devices | Reduce FAB diameter to 52-56px or integrate the '+' into the tab bar structure with appropriate spacing; ensure each tab cell maintains at least 44px min-width.
- **UX-008** | High | C | Bottom Nav / Main Shell | All mobile viewports / All themes | `src/app/page.tsx:256`, `src/components/nutra/bottom-nav.tsx:182` | `pb-32` (128px) in `<main>` is insufficient when safe-area-inset-bottom is 34px (total nav height 112px+), causing bottom cards to clip behind the fixed nav dock upon scrolling (Defect S7) | Bottom interactive elements (such as save buttons, calculator cards) are obscured by the floating dock | Increase bottom padding to `pb-36` or dynamic `calc(7rem + env(safe-area-inset-bottom))` so content always scrolls completely clear of the floating dock.
- **UX-009** | Medium | D | Bottom Nav | All viewports / Dark theme | `src/components/nutra/bottom-nav.tsx:233` | Navigation labels use `text-[10px]` which is too small for Arabic legibility, especially for inactive tabs in dark mode (Defect S5) | Arabic typography requires sufficient size to distinguish dots and ligatures; 10px strains user readability | Increase nav label to `text-[11px]` or `text-xs` (12px) with increased line-height and letter-spacing.
- **UX-010** | Medium | A | Bottom Nav & FAB | All viewports / All themes | `src/components/nutra/bottom-nav.tsx:227,244` | Neither the tab buttons nor the '+' FAB have visible focus rings (`focus-visible:ring-2`) | Keyboard, switch-access, and assistive device users cannot see focus location in bottom navigation | Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-2` to all tab buttons and the FAB.
- **UX-011** | Low | G | Bottom Nav & FAB | All viewports / Light theme | `src/components/nutra/bottom-nav.tsx:198,244` | Visual hierarchy competition: FAB is solid emerald green with heavy glow, while active tab pill right next to it is also a highlighted green surface | Creates two competing primary focal points in the bottom dock, confusing user attention | Differentiate the FAB and active tab hierarchy (e.g. subtle border or elevated neutral treatment for one).

### Screen 3: Splash Screen & BootLoader
- **UX-012** | Medium | A | Splash Screen | All viewports / All themes | `src/components/nutra/splash.tsx:6,70` | Splash forces minimum 1600ms artificial delay even when user prefers reduced motion (`prefers-reduced-motion: reduce`) | Users with motion sensitivities or users seeking immediate access are blocked by an unnecessary timer with no animation | If `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, set `MIN_MS = 0` and finish immediately once `ready` is true.
- **UX-013** | Low | A | BootLoader | All viewports / All themes | `src/app/page.tsx:95-101` | `BootLoader` spinner lacks accessible label or `role="status"` | Screen readers do not announce that the application is currently loading data | Add `role="status"` and `<span className="sr-only">{t("loading")}</span>` to `BootLoader`.
- **UX-014** | Low | D | Splash Screen | Light theme | `src/components/nutra/splash.tsx:76`, `src/app/globals.css:246` | Splash background is hardcoded dark `#0b1210`, causing severe visual jarring/flashbang when transitioning into the light theme `#f4f6f8` | Harsh contrast transition strains user eyes upon app launch in light mode | Adapt splash background color to current theme tokens or respect system color scheme.

### Screen 4: Global Connection Error / Retry Screen
- **UX-015** | Medium | A | Connection Error Screen | All viewports / All themes | `src/app/page.tsx:172-184` | Error container lacks `role="alert"` or `aria-live` attribute | Assistive technologies do not announce connection failure to visually impaired users | Add `role="alert"` and `aria-live="assertive"` to the card container.
- **UX-016** | Medium | B | Connection Error Screen | All viewports / All themes | `src/app/page.tsx:177-182` | Retry button lacks loading spinner and disabled state while `refetch()` is executing | User receives no feedback during network retry and can spam the button | Show `<Loader2 className="animate-spin size-4" />` and disable button while refetching.
- **UX-017** | Low | E | Connection Error Screen | All viewports / All themes | `src/app/page.tsx:177-184` | No fallback path or sign-out option on persistent connection error | If Supabase is down or credentials expire, user is completely stuck with no way to reset session | Provide a secondary "تسجيل الخروج" (log out) or "إعادة تعيين" button to clear stale state.

### Screen 5: Lock / Auth Screen (Login / Signup / Forgot)
- **UX-018** | High | A | Auth Screen | All viewports / All themes | `src/components/nutra/lock-screen.tsx:269-325` | Form inputs lack `id` and `<label>` tags lack `htmlFor` (labels are detached from inputs) | Screen readers cannot announce accessible field names when users focus on input fields | Add matching `id` to inputs and `htmlFor` to corresponding `<label>` tags.
- **UX-019** | High | C | Auth Screen | Mobile viewports (iOS Safari) | `src/components/nutra/lock-screen.tsx:278,294,324` | Input fields have `text-xs` (12px) font size | iOS Safari forces viewport zoom on any input with font size below 16px, breaking mobile page framing | Change input text size to `text-base` (16px) across all auth fields.
- **UX-020** | High | E | Auth Screen | All viewports / All themes | `src/components/nutra/lock-screen.tsx:287-325` | Inputs lack standard `autoComplete` attributes (`email`, `current-password`, `new-password`, `name`) | Browsers, iOS Keychain, and password managers cannot offer saved credentials or autofill | Add `autoComplete="email"`, `autoComplete="current-password"`, etc.
- **UX-021** | Medium | E | Auth Screen | Mobile viewports / All themes | `src/components/nutra/lock-screen.tsx:318-325` | Password input has no show/hide password visibility toggle | Users on mobile frequently make typing mistakes in masked password fields with no way to verify | Add an eye toggle button (`Eye` / `EyeOff`) with min 44x44px target to reveal password.
- **UX-022** | Medium | B | Auth Screen | All viewports / All themes | `src/components/nutra/lock-screen.tsx:305-315` | "نسيت كلمة المرور؟" and "العودة لتسجيل الدخول" buttons have touch heights around 16px (< 44px) | Tapping these links frequently triggers adjacent input fields or fails on mobile touchscreens | Add `min-h-[44px] py-2 px-3 inline-flex items-center` to satisfy touch target requirements.
- **UX-023** | High | I | Auth Screen | All viewports / All themes | `src/components/nutra/lock-screen.tsx:147-384` | Entire Auth/Lock screen uses hardcoded Arabic strings; zero integration with `useI18n()` dictionary | Switching the app language to English leaves the authentication screen completely in Arabic | Move all auth strings into `src/lib/i18n.tsx` and access via `t(...)`.
- **UX-024** | Low | A | Auth Screen | All viewports / All themes | `src/components/nutra/lock-screen.tsx:229-234` | Form error alert banner lacks `role="alert"` and `aria-live="assertive"` | Screen readers do not announce authentication error messages upon submission failure | Add `role="alert"` and `aria-live="assertive"` to the error container.

### Screen 6: Onboarding Flow (3 Steps)
- **UX-025** | High | F | Onboarding | All viewports / All themes | `src/components/nutra/onboarding.tsx:231` | Back button chevron rotation is reversed (`rtl:rotate-0 ltr:rotate-180`), pointing forward (`<`) instead of back (`>`) in RTL | Users are confused by a back button whose arrow points toward the next screen in Arabic | Use `ChevronRight` for RTL back button, or `rtl:rotate-180 ltr:rotate-0` on `ChevronLeft`.
- **UX-026** | Medium | A | Onboarding | All viewports / All themes | `src/components/nutra/onboarding.tsx:85-95` | Step indicator dots are `aria-hidden` with no programmatic step announcement (e.g., "الخطوة 1 من 3") | Screen reader users have no perception of the multi-step progress or total steps in the flow | Add a screen-reader-only element `<span className="sr-only">{t("step_of", { cur: step + 1, total: 3 })}</span>`.
- **UX-027** | Medium | C | Onboarding | Viewports <= 360px / All themes | `src/components/nutra/onboarding.tsx:183-200` | In Step 2, the 2-column grid allocates ~130px per input on 320-360px screens; 3-digit weight + absolute unit label (`كغ`) collides with input text | Numeric value overlaps with the unit suffix inside the cramped input container | Stack weight and age inputs vertically on narrow viewports or pad input `pe-8`.
- **UX-028** | Medium | H | Onboarding | All viewports / All themes | `src/components/nutra/onboarding.tsx:199` | Weight input unit in Step 2 is hardcoded to `{t("kg")}` even if `profile.units === "imperial"` | Imperial users are forced to enter pounds while the label displays kilograms, corrupting profile data | Dynamically display `{profile.units === "imperial" ? t("lb") : t("kg")}` and convert value accordingly.

### Screen 7: Goals Screen (الأهداف) — Target Overview & Daily Goals Editor
- **UX-029** | High | E | Goals Screen | All viewports / All themes | `src/components/nutra/screens/goals.tsx:265-276` | Target weight input (`وزن الهدف`) has no placeholder text when empty; shows only a miniature `text-[10px]` unit label `كغ` (Defect S3) | Users see an empty dark box that appears broken or uninitialized with no indication of what or how to input | Add `placeholder={imperial ? "170" : "75"}` to `NumInput` and pass through to input DOM.
- **UX-030** | High | G | Goals Screen | All viewports / All themes | `src/components/nutra/screens/goals.tsx:290-314`, `src/components/nutra/macro-split-editor.tsx:232-239` | Screen features two full-width primary CTA buttons both labeled "حفظ" with checkmarks and differing disabled states (Defect S6) | Creates confusion about what each button commits, violates single primary action per screen rule, and presents inconsistent active/disabled visual states | Unify into a single screen-level sticky save action, or visually differentiate the sections (e.g. section-level secondary actions or inline auto-save).
- **UX-031** | Critical | H | Goals Screen | Imperial units / All themes | `src/components/nutra/screens/goals.tsx:307` | Dirty check compares `goalWeight === profile.goalWeightKg` directly without converting imperial pounds to kg | In imperial mode, `goalWeight` (e.g. 170 lb) never equals `goalWeightKg` (e.g. 77 kg), leaving the Save button permanently enabled even when nothing changed | Compare against `currentDispGoal` (which already converts kg to lb for imperial) instead of raw `profile.goalWeightKg`.
- **UX-032** | Medium | A | Goals Screen | All viewports / All themes | `src/components/nutra/screens/goals.tsx:48-53` | Goal progress bars in `GoalRow` lack `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` | Screen readers cannot announce progress percentages or values for calorie, macro, water, and workout goals | Add `role="progressbar"`, `aria-valuenow={Math.round(pct * 100)}`, `aria-valuemin={0}`, `aria-valuemax={100}`.
- **UX-033** | Medium | D | Goals Screen | All viewports / Dark theme | `src/components/nutra/screens/goals.tsx:259,275`, `src/app/globals.css:164-167` | Card borders virtually invisible in dark mode (Defect S10); unit labels inside input fields (`لتر`, `كغ`) are tiny `text-[10px]` with poor legibility | Cards blend into background with insufficient visual edge separation; unit labels are hard to read | Increase card border contrast in dark mode (e.g. `--border: #2e4138`) and enlarge unit labels to `text-xs` (12px).
- **UX-034** | Medium | C | Goals Screen | Viewports <= 360px / All themes | `src/components/nutra/screens/goals.tsx:278-289` | "عدد التمارين أسبوعياً" row on 320-360px screens crowds label text into ~108px next to `w-32` (128px) input, causing awkward multi-line text wrapping | Long Arabic title text wraps awkwardly and misaligns row height | Reduce input width on small screens to `w-24` (96px) or allow flex shrinking.

### Screen 8: Macro Split Editor (توزيعة الماكروز)
- **UX-035** | Critical | C | Macro Split Editor | Viewports <= 414px / All themes | `src/components/nutra/macro-split-editor.tsx:162-192`, `src/components/nutra/num-input.tsx:90-94` | Macro input rows overflow past the card's left padding and edge; `NumInput` lacks `min-w-0`, causing default input intrinsic min-width (~170px) + fixed elements (198px) to exceed container width and push percent labels completely outside the card (Defect S1) | Destroys card layout on all mobile viewports; inputs hang outside card and percentages render off-screen | Add `min-w-0` to `NumInput` and flex child classes, reduce label width from `w-24` to `w-20`, and constrain row layout.
- **UX-036** | High | H | Macro Split Editor | All viewports / All themes | `src/components/nutra/macro-split-editor.tsx:47-49,189,226`, `src/lib/i18n.tsx:458` | Percentages do not sum to 100% (31.5% + 37.4% + 31% = 99.9%), and helper text contradicts row values by rounding to 0 decimals (32% / 37% / 31%) via `nf()` default (Defect S2) | Inconsistent mathematical display erodes user trust and violates nutrition planning accuracy | Implement Largest Remainder Method (Hamilton-Hare) to guarantee percentages always sum to 100.0%, and ensure row readouts and helper text share identical precision.
- **UX-037** | High | I | Macro Split Editor | All viewports / RTL | `src/components/nutra/macro-split-editor.tsx:223-227`, `src/lib/i18n.tsx:308` | Formula line `(بروتين×4 + كربوهيدرات×4 + دهون×9): 2,030 سعرة` mixes Arabic, numbers, and math symbols without directional isolation, causing garbled bidi punctuation and flipped parentheses (Defect S4) | Reading order of math operators and parentheses is broken in RTL engines | Wrap mathematical formulas and mixed numeric phrases in `<bdi>` or `<span dir="ltr">` with Unicode isolates (`\u2066` / `\u2069`).
- **UX-038** | Medium | D | Macro Split Editor | All viewports / Dark theme | `src/components/nutra/macro-split-editor.tsx:153,188,223,228` | Helper text, secondary labels, and percentage chips use `text-[10px]` and `text-[11px]` (Defect S5) | Tiny font size severely impairs Arabic legibility, especially on low-contrast dark green backgrounds | Increase minimum text size to `text-xs` (12px) with line-height 1.5+.
- **UX-039** | Medium | B | Macro Split Editor | All viewports / All themes | `src/components/nutra/macro-split-editor.tsx:204`, `src/components/nutra/segmented.tsx:43` | Lock toggle button has `min-h-[40px]` and segmented control has `min-h-[36px]` (both below 44px touch target) (Defect S8) | Violates WCAG 2.5.5 / 2.5.8 Touch Target Size; users on mobile struggle to tap mode switches | Increase `min-h` to at least 44px on `Segmented` options and the lock switch button.
- **UX-040** | Medium | E | Macro Split Editor | All viewports / All themes | `src/components/nutra/macro-split-editor.tsx:167-176` | Macro inputs show bare numbers (160, 190, 70) with no "غ" or "g" unit suffix attached to the input field (Defect S9) | Ambiguity regarding whether inputs represent grams or calories or percentages | Embed a clear unit suffix (`غ` in grams mode, `%` in percent mode) inside or immediately adjacent to each input.
- **UX-041** | Low | E | Macro Split Editor | Grams mode / All themes | `src/components/nutra/macro-split-editor.tsx:202-206` | "تثبيت السعرات" switch is disabled (`opacity-40`) in grams mode with no explanatory tooltip or helper badge | Users do not understand why the lock control is disabled when viewing the default grams mode | Add subtle helper text or tooltip stating that calorie locking is active in percent mode (`وضع النسب`).

### Screen 9: Calorie Calculator (حاسبة السعرات المقترحة)
- **UX-042** | High | C | Calorie Calculator | Viewports <= 414px / All themes | `src/components/nutra/calorie-calculator.tsx:124-135` | 5 long Arabic activity options placed in a single inline `Segmented` control on mobile, causing severe text truncation and overlap | Activity labels like "نشاط معتدل" and "نشط جداً" become unreadable or clipped on viewports under 414px | Replace inline segmented control with a vertical radio list, dropdown, or 2-row chip selector.
- **UX-043** | Medium | B | Calorie Calculator | All viewports / All themes | `src/components/nutra/calorie-calculator.tsx:146` | Rate pill buttons have `h-10` (40px), which is below the 44px minimum touch target height | Difficult for users to accurately tap rate adjustment chips on mobile touchscreens | Increase rate button height to `h-11` (44px) with adequate vertical padding.
- **UX-044** | High | H | Calorie Calculator | Imperial units / All themes | `src/components/nutra/calorie-calculator.tsx:116` | Weight display is hardcoded to `{t("kg")}` without checking `profile.units === "imperial"` | Imperial users see kilograms instead of their chosen pounds unit, causing confusion regarding calculation inputs | Display `{imperial ? nf(kgToLb(weightKg), 1) : nf(weightKg, 1)} {imperial ? t("lb") : t("kg")}`.
- **UX-045** | Low | G | Calorie Calculator | All viewports / All themes | `src/components/nutra/calorie-calculator.tsx:179` | Introduces a third "حفظ" (save) action on the Goals tab ("اعتمد وحفظ") alongside the other two save buttons | Three separate save buttons on one tab create visual cluttered actions and confusing persistence mental models | Consolidate adoption action or display as a preview modal with a clear confirmation workflow.

### Screen 10: Zigzag Plan Card (خطة التمويه السعري)
- **UX-046** | Critical | D | Zigzag Plan Card | All viewports / All themes | `src/components/nutra/zigzag-plan.tsx:118` | Weekday column labels in the 7-day upcoming forecast use an extreme `text-[9px]` font size | Far below WCAG minimum legible size; Arabic script at 9px loses letter distinctions and becomes illegible | Increase font size to at least `text-[11px]` and stack abbreviated weekday labels.
- **UX-047** | High | I | Zigzag Plan Card | English language / All themes | `src/components/nutra/zigzag-plan.tsx:119` | 7-day forecast grid calls `weekdayAr(...)` unconditionally, forcing Arabic weekday abbreviations in English mode | In English mode, users see mixed Arabic weekday headers ("سبت", "أحد") amidst English text | Use `df(new Date(d.date), { weekday: "narrow" })` or localized weekday helper based on current language.
- **UX-048** | Medium | A | Zigzag Plan Card | All viewports / All themes | `src/components/nutra/zigzag-plan.tsx:124` | High-calorie vs low-calorie days in the 7-day grid rely solely on text color (yellow vs green) without symbols or icons | Violates WCAG 1.4.1 (Use of Color). Colorblind users cannot distinguish high-calorie from low-calorie days | Add an explicit symbol (e.g. `▲` / `▼` or `+` / `-`) alongside the numeric readout.
- **UX-049** | Medium | B | Zigzag Plan Card | All viewports / All themes | `src/components/nutra/zigzag-plan.tsx:96` | Stop plan button ("إيقاف") has `min-h-[36px]`, failing 44px touch target guidelines | Users on mobile struggle to tap the small stop chip | Increase button height to `min-h-[44px]` with standard padding.

### Screen 11: Today Screen (اليوم) — Ring, Macros, Day Nav & Meals
- **UX-050** | High | B | Today Screen | All viewports / All themes | `src/components/nutra/screens/today.tsx:287-299,329-374` | Action buttons on meal rows (`Pencil`, `Trash2`, `Plus`, `BookmarkPlus`) have `size-9` (36×36px), violating minimum 44px touch target guidelines | High risk of miss-taps on mobile, especially since edit and delete icons sit immediately adjacent with 0px gap | Enlarge button hit areas to at least 44×44px (`min-w-[44px] min-h-[44px]`) and add at least 8px margin between edit and delete targets.
- **UX-051** | Medium | G | Today Screen | All viewports / All themes | `src/components/nutra/screens/today.tsx:19,176,280` | Meal types, weight badge, and empty state use native emojis (`🌅`, `🍽️`, `🌙`, `🥜`, `⚖️`) as primary UI icons | Inconsistent styling with Lucide stroke icons used throughout the rest of the application | Replace emojis with corresponding Lucide icons (`Coffee`, `Utensils`, `Moon`, `Apple`, `Scale`).
- **UX-052** | Medium | A | Today Screen | All viewports / All themes | `src/components/nutra/screens/today.tsx:197-212`, `src/components/nutra/macro-donut.tsx:109-124` | Water progress ring and `MacroBar` lack `role="progressbar"` and aria value attributes | Assistive technologies cannot convey progress or macro breakdown values to visually impaired users | Add `role="progressbar" aria-valuenow={...} aria-valuemin={0} aria-valuemax={100}` to progress SVG and bar containers.
- **UX-053** | Low | H | Today Screen | All viewports / All themes | `src/components/nutra/screens/today.tsx:190-191` | Water volume format hardcodes `.toLocaleString("en-US")` directly instead of using the app's `nf()` formatting helper | Bypasses localized formatting and numeric consistency rules established across the app | Use `nf(waterTotal / 1000, 2)` and `nf(waterGoal / 1000, 1)`.
- **UX-054** | Medium | E | Today Screen | All viewports / All themes | `src/components/nutra/screens/today.tsx:340-370` | Meal item deletion triggers immediately upon tapping trash icon without confirmation dialog (only an undo toast) | Accidental taps immediately remove user logged food entries, causing panic if toast expires or is missed | Provide a quick swipe-to-delete confirmation or confirmation prompt before mutation.

### Screen 12: Today Screen — Empty Meals State
- **UX-055** | Low | G | Today Screen (Empty State) | All viewports / All themes | `src/components/nutra/screens/today.tsx:263` | Empty state uses oversized native emoji `🍽️` as hero graphic | Platform-dependent emoji rendering looks inconsistent between iOS and Android | Replace with a dedicated SVG illustration or styled Lucide icon in a tinted circle.

### Screen 13: Log Screen (السجل) — Search, Favorites & Meal List
- **UX-056** | High | J | Log Screen | All viewports / All themes | `src/components/nutra/screens/log.tsx:19-21` | Search input `q` is not debounced before passing to `useFoods(q)`; triggers a network request on every keystroke | Spams API queries on mobile, causing race conditions, flickering results, and high battery/data usage | Debounce `q` with 250-300ms before sending to `useFoods`.
- **UX-057** | Medium | B | Log Screen | All viewports / All themes | `src/components/nutra/screens/log.tsx:172` | Star/Favorite toggle button on food rows has `size-10` (40×40px), failing 44px touch target guidelines | Difficult to accurately tap favorite star on mobile rows without accidentally triggering row selection | Enlarge hit area to `size-11` (44×44px).
- **UX-058** | Medium | E | Log Screen | Mobile viewports / All themes | `src/components/nutra/screens/log.tsx:57-66` | Search input lacks a clear button ("✕") when text is entered | User must manually backspace long queries character by character on touch keyboards | Add a clear button at `end-3` visible when `q.length > 0`.

### Screen 14: Log Screen — Empty Search & Favorites States
- **UX-059** | Low | E | Log Screen (Empty State) | All viewports / All themes | `src/components/nutra/screens/log.tsx:85-94` | Empty search results state provides no action to clear search or add a custom food item directly | User is left with a dead-end message with no quick recovery action | Add a button to clear search or directly trigger manual food entry ("إضافة طعام جديد").

### Screen 15: Progress Screen (التقدم) — Weight & Calorie Charts
- **UX-060** | Medium | A | Progress Screen | All viewports / All themes | `src/components/nutra/screens/progress.tsx:300-364,441-480` | Recharts charts (`AreaChart`, `BarChart`) lack accessible descriptions (`role="img"` with `aria-label`) | Screen readers cannot summarize chart trendlines, minimums, maximums, or averages for visually impaired users | Wrap charts in containers with descriptive `role="img" aria-label="رسم بياني لتطور الوزن خلال الشهر الماضي"`.
- **UX-061** | Medium | B | Progress Screen | All viewports / All themes | `src/components/nutra/screens/progress.tsx:280` | Custom period shortcut buttons ("آخر 3 أيام", "آخر 7 أيام", "آخر 14 يوم") have `h-10` (40px), below 44px target | Cramped height leads to missed taps on mobile screens | Increase height to `h-11` (44px) with `py-2`.
- **UX-062** | Low | D | Progress Screen | All viewports / Dark theme | `src/components/nutra/screens/progress.tsx:312,322,447` | Chart axis labels use `tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}` | 10px text combined with dark muted gray `#8ca39a` strains legibility on small phone screens | Increase tick font size to 11px or 12px.
- **UX-063** | Low | H | Progress Screen | All viewports / All themes | `src/components/nutra/stat-card.tsx:47` | Delta chip directly calls `.toLocaleString("en-US")` instead of localized formatter `nf()` | Inconsistent number formatting pipeline across component library | Replace with `nf(Math.abs(delta!), 1)`.

### Screen 16: Progress Screen — Insufficient / Empty Data State
- **UX-064** | High | E | Progress Screen (Empty State) | All viewports / All themes | `src/components/nutra/screens/progress.tsx:205-213` | Empty weight screen shows message "لا يوجد قياسات وزن بعد" but provides NO action button to log first weight | User encounters a dead end without a direct call to action to begin tracking | Add a primary button `<button onClick={() => openSheet("weight")}>{t("log_weight")}</button>`.

### Screen 17: Workouts Screen (التمارين) — Calendar, Stats & Streak
- **UX-065** | High | I | Workouts Screen | All viewports / All themes | `src/components/nutra/screens/workouts.tsx:147,155` | Month navigation buttons hardcode English aria labels (`aria-label="previous month"`, `aria-label="next month"`) | Screen readers announce English phrases in an Arabic UI, confusing Arabic-speaking assistive users | Replace with `aria-label={t("prev_month")}` and `aria-label={t("next_month")}`.
- **UX-066** | Medium | B | Workouts Screen | All viewports / All themes | `src/components/nutra/screens/workouts.tsx:149,157,190` | Month stepper buttons have `size-10` (40px) and calendar day cells have `min-h-[36px]`, failing the 44px touch target guideline | Users on mobile touchscreens risk mis-tapping adjacent day cells or month steppers | Enlarge month buttons to `size-11` (44px) and increase day cell padding/touch hit area.
- **UX-067** | Low | D | Workouts Screen | All viewports / Dark theme | `src/components/nutra/screens/workouts.tsx:165,239` | Weekday column labels and "never" trained labels use `text-[10px]` with muted gray | Low visual prominence and strained legibility on smaller mobile displays | Increase text size to `text-xs` (12px).

### Screen 18: Workouts Screen — Empty Month / No Workout State
- **UX-068** | Low | E | Workouts Screen (Empty State) | All viewports / All themes | `src/components/nutra/screens/workouts.tsx:107-142` | Months with zero logged workouts show all zeroes and "أبداً" (never) across every group with no motivational CTA to log a workout | Flat empty data presents a discouraging and passive interface for inactive periods | Add a prominent CTA banner or button ("سجّل تمرين اليوم") when current week/month has 0 workouts.

### Screen 19: Settings Screen (الإعدادات) — Body Profile & Preferences
- **UX-069** | High | C | Settings Screen | All mobile viewports / All themes | `src/components/nutra/screens/settings.tsx:158` | Save button has `sticky bottom-24` (96px); on mobile devices with safe-area home indicators (dock height 112px+), the button overlaps or hides behind the floating nav dock | User cannot tap the primary save action without awkward scrolling | Increase sticky offset to `bottom-28` or `calc(5rem + env(safe-area-inset-bottom))`.
- **UX-070** | Medium | B | Settings Screen | All viewports / All themes | `src/components/nutra/screens/settings.tsx:127` | Dark mode switch button has `h-8` (32px height), failing the 44px minimum touch target height | Difficult to tap toggle switch reliably on mobile screens | Ensure the parent `<label>` has `min-h-[44px]` with expanded touch area.

### Screen 20: Settings Screen — Alert Dialogs (Reset Demo, Logout)
- **UX-071** | Critical | E | Settings Screen (Dialog) | All viewports / All themes | `src/components/nutra/screens/settings.tsx:170-185` | Radix `AlertDialogAction` and `AlertDialogCancel` primitives are inverted: `AlertDialogAction` renders "إلغاء" while `AlertDialogCancel` executes the destructive logout action | Inverts assistive technology confirmation semantics; pressing Escape or dismiss can trigger unintended logouts, and keyboard Enter executes cancel instead of confirm | Map `AlertDialogAction` to the logout execution and `AlertDialogCancel` to cancellation.

### Screen 21: Quick Add Sheet (الإضافة السريعة)
- **UX-072** | Low | B | Quick Add Sheet | All viewports / All themes | `src/components/nutra/sheets/quick-sheets.tsx:90` | "أطعمتي →" navigation link has `min-h-[40px]`, falling short of 44px minimum touch target height | Target is small on mobile touch displays | Increase height to `min-h-[44px]` with `py-2`.

### Screen 22: Water Sheet (تسجيل الماء)
- **UX-073** | Low | I | Water Sheet | Arabic language / All themes | `src/components/nutra/sheets/quick-sheets.tsx:133` | 1-liter preset button displays `+1L` with Latin "L" instead of Arabic `{t("liter")}` (`لتر`) | Inconsistent language mixing in Arabic mode | Display `+1 ${t("liter")}` or `+1000 مل`.

### Screen 23: Weight Sheet (تسجيل الوزن)
- **UX-074** | High | I | Weight Sheet | Arabic language / All themes | `src/components/nutra/sheets/quick-sheets.tsx:229,297,301` | Weight unit is hardcoded to Latin string `"kg"` / `"lb"` (`const displayed = imperial ? "lb" : "kg"`) instead of using `{t("kg")}` / `{t("lb")}` | In Arabic RTL interface, the prominent hero weight unit is shown in English letters ("kg") instead of Arabic ("كغ") | Use `const displayed = imperial ? t("lb") : t("kg")`.
- **UX-075** | Medium | A | Weight Sheet | All viewports / All themes | `src/components/nutra/sheets/quick-sheets.tsx:295` | Giant hero number input has `focus:outline-none` with zero visible focus state or ring | Keyboard and assistive navigation users cannot see when the weight input is active | Add `focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl`.
- **UX-076** | Medium | B | Weight Sheet | All viewports / All themes | `src/components/nutra/sheets/quick-sheets.tsx:267,276` | Date toggle chips ("اليوم" / "أمس") have `h-10` (40px height), failing 44px touch target guidelines | Difficult to accurately toggle between today and yesterday on mobile touchscreens | Enlarge chip height to `h-11` (44px).
- **UX-077** | Medium | E | Weight Sheet | All viewports / All themes | `src/components/nutra/sheets/quick-sheets.tsx:241` | When weight input is out of bounds (<25 or >350 kg), form shows a generic error toast without explaining allowed range | Users are confused as to why save failed when entering an unexpected value | Show specific error message stating allowed weight range (`25–350 كغ`).

### Screen 24: Workout Sheet (تسجيل التمرين)
- **UX-078** | Critical | D | Workout Sheet | All viewports / All themes | `src/components/nutra/sheets/workout-sheet.tsx:130-132`, `src/components/nutra/screens/workouts.tsx:12-21` | Active muscle group buttons use white text (`text-white`) on bright pastel backgrounds: Arms (`#f59e0b`, contrast 1.9:1), Chest (`#f97066`, 2.4:1), Cardio (`#06b6d4`, 2.3:1), Shoulders (`#ec4899`, 3.1:1) | Severe failure of WCAG 1.4.3 Contrast (Minimum 4.5:1); white text on amber/cyan/pink is nearly unreadable | Use dark text (`#0b1210`) on light/bright pastel tags (arms, cardio, chest) or use darker saturated background tones with white text.
- **UX-079** | Medium | B | Workout Sheet | All viewports / All themes | `src/components/nutra/sheets/workout-sheet.tsx:111` | Preset workout chips (⚡ بوش، ⚡ بول، ⚡ أرجل...) have `h-9` (36px), failing 44px touch target guidelines | Users on mobile easily miss or double-tap adjacent preset chips | Increase chip height to `min-h-[44px]` with `py-2 px-4`.
- **UX-080** | Medium | E | Workout Sheet | All viewports / All themes | `src/components/nutra/sheets/workout-sheet.tsx:167-174` | Tapping the trash icon deletes existing workout immediately without confirmation modal | Destructive action can be accidentally triggered on touchscreens with no undo mechanism | Wrap deletion in an `AlertDialog` confirmation prompt ("هل تريد حذف هذا التمرين؟").

### Screen 25: Scan Sheet (مسح الملصق / الوجبة بالكاميرا)
- **UX-081** | Medium | C | Scan Sheet | Viewports <= 360px / All themes | `src/components/nutra/sheets/scan-sheet.tsx:353-372` | Camera and Gallery action buttons wrap tightly inside 130px photo slot boxes on narrow screens (<360px), causing vertical crowding within the aspect ratio box | Buttons can crowd or slightly clip against the dashed slot borders | Stack buttons vertically inside slot or provide a single tap target that opens a camera/gallery action sheet.
- **UX-082** | Low | A | Scan Sheet | All viewports / All themes | `src/components/nutra/sheets/scan-sheet.tsx:338` | Required field indicator uses English `aria-label="required"` on a red dot | Screen readers announce English "required" in Arabic mode, and sighted users only see a red dot with no text | Add visible text `(إلزامي)` and localized `aria-label={t("required")}`.

### Screen 26: Scan Sheet — Error, Quota & Fallback States
- **UX-083** | High | I | Scan Sheet (Error State) | All viewports / All themes | `src/components/nutra/sheets/scan-sheet.tsx:163,165` | Quota limit and payload size error messages are hardcoded Arabic strings outside `useI18n()` | If app is switched to English, quota error messages remain entirely in Arabic | Move `daily_limit_exceeded` and `payload_too_large` strings into `src/lib/i18n.tsx`.
- **UX-084** | Medium | E | Scan Sheet (Error State) | All viewports / All themes | `src/components/nutra/sheets/scan-sheet.tsx:273-278` | Quota exceeded error ("daily_limit_exceeded") offers a "Retry" button that will continuously fail | User is prompted to re-attempt an action that is guaranteed to fail for the remainder of the day | Hide retry button on quota exhaustion and present a direct "إدخال يدوي" (Manual entry) fallback CTA.

### Screen 27: Food Confirm Sheet (تأكيد الطعام الممسوح / اليدوي)
- **UX-085** | Critical | D | Food Confirm Sheet | Light theme | `src/components/nutra/sheets/food-confirm-sheet.tsx:387-414` | In live totals box (`bg-primary/8`), Carbohydrate label uses yellow/amber text (`var(--carbs)`: `#f59e0b`), yielding an unreadable 2.1:1 contrast ratio against the light green surface | Severe WCAG 1.4.3 Contrast failure; text disappears against the tinted card background | Darken carbs text color in light theme (e.g. `#b45309`) or place labels on high-contrast badge pills.
- **UX-086** | Medium | B | Food Confirm Sheet | All viewports / All themes | `src/components/nutra/sheets/food-confirm-sheet.tsx:236,470` | Quick gram chips (`50غ`, `100غ`, `حصة`) have `h-9` (36px) and per-100g toggle has `min-h-[36px]`, failing 44px touch target guidelines | Users on mobile frequently miss-tap small quantity chips | Increase chip and toggle height to `min-h-[44px]`.
- **UX-087** | Medium | E | Food Confirm Sheet | All viewports / All themes | `src/components/nutra/sheets/food-confirm-sheet.tsx:110-112` | Submitting without a food name triggers a generic error toast ("حدث خطأ ما") with no inline validation feedback | User is not informed that the name field is required or what needs fixing | Add inline error message below name field and focus the input when empty.

### Screen 28: Meal Builder Sheet (بناء وجبة متكاملة)
- **UX-088** | High | C | Meal Builder Sheet | All viewports / All themes | `src/components/nutra/sheets/meal-builder-sheet.tsx:286,330` | Two independently scrollable containers (`max-h-[38vh]` and `max-h-[26vh]`) nested within a swipeable Vaul bottom sheet | Causes gesture conflicts and scroll-chaining traps on mobile touchscreens where scrolling one list intercepts or drags the drawer | Unify into a single continuous scrolling sheet container.
- **UX-089** | Medium | B | Meal Builder Sheet | All viewports / All themes | `src/components/nutra/sheets/meal-builder-sheet.tsx:271,278,370` | Shortcut buttons ("امسح منتجاً", "إدخال يدوي") have `h-10` (40px) and item delete buttons have `size-9` (36px), failing 44px touch targets | Users risk mis-tapping delete icons or failing to trigger top shortcut actions | Enlarge shortcuts to `h-11` (44px) and delete buttons to `size-11` (44px).

### Screen 29: Meal Builder — Discard Confirmation Dialog
- **UX-090** | Critical | E | Meal Builder (Dialog) | All viewports / All themes | `src/components/nutra/sheets/meal-builder-sheet.tsx:419-430` | Inverted Radix Alert Dialog primitives: `AlertDialogCancel` executes `discard()` (wiping the meal draft), while `AlertDialogAction` executes `keep_editing` | Pressing the Escape key or dismissing the dialog automatically triggers `AlertDialogCancel`, accidentally destroying the user's drafted meal | Assign `AlertDialogAction` to `discard` with destructive styling, and assign `AlertDialogCancel` to dismiss/cancel without discarding.

### Screen 30: Edit Grams Sheet (تعديل كمية الغرامات)
- **UX-091** | Critical | D | Edit Grams Sheet | Light theme | `src/components/nutra/sheets/edit-grams-sheet.tsx:162-188` | Live totals card uses yellow/amber text (`var(--carbs)`: `#f59e0b`) on a light green tinted background (`bg-primary/8`), yielding a failing 2.1:1 contrast ratio | Violates WCAG 1.4.3 Contrast (Minimum); carbohydrate numbers are unreadable in light theme | Use high-contrast text color (`#92400e` or `#101828`) for the carbohydrate label in light mode.
- **UX-092** | Medium | A | Edit Grams Sheet | All viewports / All themes | `src/components/nutra/sheets/edit-grams-sheet.tsx:142` | Hero grams `NumInput` explicitly disables the focus ring using `focus:ring-0` with no replacement focus indicator | Fails WCAG 2.4.7 (Focus Visible); keyboard and assistive users cannot tell when the grams field is active | Replace `focus:ring-0` with a subtle visible focus ring `focus-visible:ring-2 focus-visible:ring-primary/40`.

### Screen 31: Save Meal Sheet & Add Saved Meal Sheet (وجباتي)
- **UX-093** | Medium | A | Save Meal Sheet & Add Saved Meal Sheet | All viewports / All themes | `src/components/nutra/sheets/my-meal-sheets.tsx:223-234,258-272` | Day toggle buttons ("اليوم", "أمس") and meal type selector buttons ("إفطار", "غداء", "عشاء", "سناك") lack `role="radiogroup"` / `role="radio"` and `aria-checked` or `aria-pressed` states | Screen reader users receive no programmatic indication of which day or meal group is currently selected | Group buttons in a container with `role="radiogroup"` and assign `role="radio"` with `aria-checked={isSelected}` to each option.
- **UX-094** | Medium | E | Save Meal Sheet | All viewports / All themes | `src/components/nutra/sheets/my-meal-sheets.tsx:58-61` | Submitting an empty meal name triggers a generic error toast (`t("error_toast")`: "حدث خطأ ما") instead of field-level validation | User is not informed that the meal name is required or what input is missing | Add inline validation error text below the input ("يرجى إدخال اسم الوجبة") and focus the input field.
- **UX-095** | Low | H | Save Meal Sheet | All viewports / All themes | `src/components/nutra/sheets/my-meal-sheets.tsx:93` | Items in the meal preview list display bare numbers (`{nf(l.kcal)}`) with no unit suffix, while the summary paragraph directly below displays `{nf(kcal)} {t("kcal")}` | Visual inconsistency between item-level calorie counts and total calorie counts on the same screen | Append `{t("kcal")}` or "سعرة" to each item's calorie readout.
- **UX-096** | Low | J | My Meals Bar | All viewports / All themes | `src/components/nutra/sheets/my-meal-sheets.tsx:294` | `MyMealsBar` returns `null` while `isLoading` is true, causing a sudden layout shift (CLS) when saved meals pop in above the search list on the Log screen | Layout jump shifts the search input and food list down after initial render | Render 3 skeleton chip placeholders during `isLoading` to stabilize layout geometry.
---

## 3. Global & Systemic Issues (Cross-Screen Patterns)

The following 10 systemic defects cut across multiple screens, components, and design system primitives:

### 3.1. Sub-44px Touch Targets on Mobile Touchscreens (WCAG 2.5.5 / 2.5.8)
Across the application, **38 interactive controls** (buttons, steppers, segmented items, chips, and links) have physical heights between 32px and 40px, failing the standard 44×44px touch target guideline. On handheld touchscreens, this leads to frequent missed taps and accidental activations of adjacent controls.
- **Affected Files & Lines:**
  - `src/components/nutra/bottom-nav.tsx:233` — Inactive tab cells narrow to ~40.8px on 320px viewports
  - `src/components/nutra/lock-screen.tsx:305,315` — "نسيت كلمة المرور؟" and "العودة لتسجيل الدخول" have ~16px touch height
  - `src/components/nutra/segmented.tsx:43` — Segmented control options set to `min-h-[36px]`
  - `src/components/nutra/macro-split-editor.tsx:204` — Lock switch button set to `min-h-[40px]` (Defect S8)
  - `src/components/nutra/calorie-calculator.tsx:146` — Rate preset pills set to `h-10` (40px)
  - `src/components/nutra/zigzag-plan.tsx:96` — Plan stop button set to `min-h-[36px]`
  - `src/components/nutra/screens/today.tsx:287-299,329-374` — Meal row action icons (`Pencil`, `Trash2`, `Plus`) set to `size-9` (36×36px) with 0px gap
  - `src/components/nutra/screens/log.tsx:172` — Star favorite button set to `size-10` (40×40px)
  - `src/components/nutra/screens/progress.tsx:280` — Period range pills set to `h-10` (40px)
  - `src/components/nutra/screens/workouts.tsx:149,157,190` — Month stepper buttons `size-10` (40px); calendar day cells `min-h-[36px]`
  - `src/components/nutra/screens/settings.tsx:127` — Dark mode switch trigger `h-8` (32px)
  - `src/components/nutra/sheets/quick-sheets.tsx:90,267,276` — Nav link `min-h-[40px]`; today/yesterday chips `h-10` (40px)
  - `src/components/nutra/sheets/workout-sheet.tsx:111` — Workout preset chips `h-9` (36px)
  - `src/components/nutra/sheets/food-confirm-sheet.tsx:236,470` — Gram preset chips `h-9` (36px); 100g toggle `min-h-[36px]`
  - `src/components/nutra/sheets/meal-builder-sheet.tsx:271,278,370` — Camera/manual buttons `h-10` (40px); item delete icons `size-9` (36px)

### 3.2. Sub-12px Font Sizes for Arabic Typography (Defect S5)
There are **56 occurrences** of `text-[9px]`, `text-[10px]`, and `text-[11px]` across components. Unlike Latin characters, Arabic letterforms rely on delicate diacritical dots (e.g. distinguishing ب, ت, ث, ن, ي) and complex ligatures. At font sizes below 12px, these distinctions erode, causing severe eyestrain—especially in dark mode where muted gray text sits on dark surfaces.
- **Affected Files & Lines:**
  - `src/components/nutra/zigzag-plan.tsx:118` — Extreme `text-[9px]` on 7-day forecast headers
  - `src/components/nutra/bottom-nav.tsx:233` — `text-[10px]` on bottom navigation tab labels
  - `src/components/nutra/macro-split-editor.tsx:153,188,223,228` — `text-[10px]` and `text-[11px]` on percent chips, formula text, and helper microcopy
  - `src/components/nutra/screens/goals.tsx:259,275` — `text-[10px]` on unit suffixes (`لتر`, `كغ`) inside inputs
  - `src/components/nutra/screens/workouts.tsx:165,239` — `text-[10px]` on calendar column headers and "never" trained badges
  - `src/components/nutra/screens/progress.tsx:312,322,447` — `tick={{ fontSize: 10 }}` on chart axis timestamps and values
  - `src/components/nutra/sheets/food-confirm-sheet.tsx:288` — `text-[10px]` on macro calculation breakdown labels
  - `src/components/nutra/sheets/my-meal-sheets.tsx:314` — `text-[11px]` on saved meal card item summary lines

### 3.3. Missing `min-w-0` on Flex Containers Containing Inputs (Defect S1 Root Cause)
Under the CSS Flexbox specification, flex items have a default `min-width: auto`. When a child container renders a native `<input>`, the browser's default intrinsic input width (~170px) prevents the flex container from shrinking. When combined with adjacent fixed-width labels, buttons, or badges, the total width exceeds the mobile card container (typically 288–343px), causing inputs and percentage labels to blow past the card's inline edge (left edge in RTL).
- **Affected Files & Lines:**
  - `src/components/nutra/num-input.tsx:90-94` — Native `<input>` rendered inside container lacking `min-w-0`
  - `src/components/nutra/macro-split-editor.tsx:162-192` — Macro rows push percent chips completely outside the card
  - `src/components/nutra/screens/goals.tsx:278-289` — Weekly workout target input row overflows on <=360px screens
  - `src/components/nutra/calorie-calculator.tsx:124-135` — Activity level selector segmented row overflows mobile screens
  - `src/components/nutra/sheets/scan-sheet.tsx:353-372` — Photo slot buttons crowd and wrap inside fixed-ratio flex containers

### 3.4. Complete Absence of Accessible Progress Semantics (`role="progressbar"`)
A global grep revealed **0 instances of `role="progressbar"`** across the entire application. Progress indicators (circular SVG donut rings, linear horizontal macro bars, water intake rings, weekly workout goal bars, and the splash screen loader) are rendered purely visually using SVGs and `div` style widths, leaving screen readers completely unaware of current progress values.
- **Affected Files & Lines:**
  - `src/components/nutra/macro-donut.tsx:109-124` — Calorie budget donut ring and Protein/Carbs/Fat breakdown bars
  - `src/components/nutra/screens/goals.tsx:48-53` — Goal progress bars in `GoalRow`
  - `src/components/nutra/screens/today.tsx:197-212` — Daily water intake progress ring
  - `src/components/nutra/splash.tsx:78-83` — Splash screen boot loading bar

### 3.5. Inverted Radix Alert Dialog Actions (Critical Data Loss & UX Risk)
In multiple dialog implementations, Radix UI primitive semantics are inverted: `AlertDialogCancel` is wired to execute destructive mutations (e.g. destroying drafted meals or logging out), while `AlertDialogAction` (the default confirmation action) is wired to cancel or keep editing. Consequently, pressing the Escape key, clicking outside, or triggering dismiss will inadvertently destroy the user's data or terminate their session.
- **Affected Files & Lines:**
  - `src/components/nutra/sheets/meal-builder-sheet.tsx:419-430` — `AlertDialogCancel` executes `discard()` (wipes meal draft); `AlertDialogAction` executes `keep_editing`
  - `src/components/nutra/screens/settings.tsx:170-185` — `AlertDialogCancel` executes `signOut()`; `AlertDialogAction` renders "إلغاء"

### 3.6. Physical LTR Utility Classes in Generated UI Primitives
There are **39 occurrences** of physical directional classes (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `sm:text-left`) inside `src/components/ui/` primitives that fail to mirror in RTL mode. In an Arabic interface, `text-left` aligns text to the physical left (inline-end), causing headings and descriptions to align backwards.
- **Affected Files & Lines:**
  - `src/components/ui/dialog.tsx:87` — `sm:text-left` (should be `sm:text-start`)
  - `src/components/ui/alert-dialog.tsx:73` — `sm:text-left` (should be `sm:text-start`)
  - `src/components/ui/drawer.tsx:80` — `md:text-left` (should be `md:text-start`)
  - `src/components/ui/table.tsx:73` — `text-left` (should be `text-start`)
  - `src/components/ui/select.tsx:110` — `pr-8 pl-2` (inverts checkmark icon and text padding in RTL)
  - `src/components/ui/toast.tsx:28` — `pr-6` instead of `pe-6`, `space-x-2` instead of `gap-2`
  - `src/components/ui/command.tsx:166` — `ml-auto` (should be `ms-auto`)
  - `src/components/ui/dropdown-menu.tsx:77,95,131,158,187,220` — Physical padding and auto-margins
  - `src/components/ui/context-menu.tsx:69,75,129,147,172,199,228` — Physical padding and auto-margins
  - `src/components/ui/menubar.tsx:106,124,149,176,205,238` — Physical padding and auto-margins

### 3.7. Severe Color Contrast Failures in Light Theme on Macro & Workout Elements
While dark mode is the primary theme, light mode suffers from severe color contrast failures (as low as **1.9:1**, far below the WCAG AA minimum of 4.5:1). Yellow/amber carbohydrate tokens and pastel muscle group tags render light or white text directly over low-contrast pastel surfaces.
- **Affected Files & Lines:**
  - `src/components/nutra/sheets/food-confirm-sheet.tsx:387-414` — Carbohydrate value (`var(--carbs)`: `#f59e0b`) on `bg-primary/8` yields **2.1:1** contrast
  - `src/components/nutra/sheets/edit-grams-sheet.tsx:162-188` — Carbohydrate value (`var(--carbs)`: `#f59e0b`) on `bg-primary/8` yields **2.1:1** contrast
  - `src/components/nutra/sheets/workout-sheet.tsx:130-132` — White text (`text-white`) on bright pastel tags yields **1.9:1** (arms `#f59e0b`), **2.3:1** (cardio `#06b6d4`), and **2.4:1** (chest `#f97066`)
  - `src/components/nutra/screens/workouts.tsx:12-21` — Muscle group colors defined as un-themed raw hex values

### 3.8. Missing Safe-Area & Fixed Bottom Dock Padding (Defect S7 Root Cause)
The `<main>` content container has a static padding of `pb-32` (128px). However, on modern smartphones with iOS Home Indicators or virtual navigation bars, `safe-area-inset-bottom` is 34px, raising the fixed floating bottom navigation capsule to ~112px tall with a 24px bottom offset (total height ~136px). As a result, the bottom-most cards (such as the suggested calorie calculator card on Goals, or the last food entries on Today) are clipped behind the dock when scrolled to the very bottom.
- **Affected Files & Lines:**
  - `src/app/page.tsx:256` — Main container uses static `pb-32`
  - `src/components/nutra/bottom-nav.tsx:182` — Fixed bottom navigation bar has `bottom-4` + `env(safe-area-inset-bottom)`
  - `src/components/nutra/screens/settings.tsx:158` — Sticky Save button uses `sticky bottom-24` (96px), sliding behind the 112px dock

### 3.9. Un-isolated Bi-directional Text & Mixed Latin/Arabic Strings (Defect S4 Root Cause)
When Arabic phrases mix with Latin numbers, operators (`+`, `×`, `:`), and parentheses, RTL layout engines struggle with "neutral" characters, flipping parentheses to the wrong side and misplacing arithmetic operators. Furthermore, English units ("kg", "lb", "L") are frequently hardcoded inside Arabic strings without directional isolation.
- **Affected Files & Lines:**
  - `src/components/nutra/macro-split-editor.tsx:223-227` — Formula line `(بروتين×4 + كربوهيدرات×4 + دهون×9): 2,030 سعرة` renders with garbled parenthesis and misplaced digits
  - `src/lib/i18n.tsx:308` — Macro formula dictionary string lacks Unicode isolate tags (`\u2066` / `\u2069`) or `<bdi>`
  - `src/components/nutra/sheets/quick-sheets.tsx:133,229,297,301` — Hardcoded `+1L` and Latin `"kg"` / `"lb"` units in Arabic views
  - `src/app/page.tsx:218-219` — Trailing greeting emoji `👋` at the boundary of RTL text without `<bdi>`
  - `src/components/nutra/screens/workouts.tsx:147,155` — English `aria-label="previous month"` inside Arabic interface

### 3.10. Hardcoded Arabic Strings Bypassing the i18n Dictionary
Multiple screens and sheets contain raw Arabic string literals rather than referencing keys in `src/lib/i18n.tsx`. When a user toggles the application language to English (`en`), these views remain entirely in Arabic.
- **Affected Files & Lines:**
  - `src/components/nutra/lock-screen.tsx:147-384` — The entire authentication flow (login, signup, password reset, demo mode) is hardcoded Arabic
  - `src/components/nutra/zigzag-plan.tsx:119` — Hardcoded Arabic weekday abbreviations (`weekdayAr`) rendered unconditionally in English mode
  - `src/components/nutra/sheets/scan-sheet.tsx:163,165` — AI quota and image payload size error messages hardcoded in Arabic

---

## 4. Things That Are Correct (Do Not Waste Time Changing)

The following architectural, mathematical, and design aspects were verified as robust, well-engineered, and correct:

1. **Exact Calorie & Macronutrient Mathematics:**
   - The fundamental relationship `(Protein × 4) + (Carbohydrates × 4) + (Fat × 9) = Total Calories` is mathematically verified and exact across all models. For example, `160g × 4 + 190g × 4 + 70g × 9 = 640 + 760 + 630 = 2,030 kcal`. The core calorie formula is not broken.
2. **Mifflin-St Jeor BMR & TDEE Calculations:**
   - The calorie calculator in `src/lib/types.ts` correctly applies the scientific Mifflin-St Jeor formula for both biological sexes:
     - Male: `10 × weightKg + 6.25 × heightCm - 5 × age + 5`
     - Female: `10 × weightKg + 6.25 × heightCm - 5 × age - 161`
   - Activity multipliers (1.2 sedentary, 1.375 light, 1.55 moderate, 1.725 very active, 1.9 extra active) adhere strictly to established clinical nutrition standards.
3. **16px Font Size on Mobile Form Inputs:**
   - Standard form inputs across the majority of bottom sheets specify `text-base` (16px). This correctly prevents iOS Mobile Safari from triggering automatic page zoom on field focus.
4. **Draft Protection & Persistence in Meal Builder:**
   - `MealBuilderSheet` uses a dedicated Zustand store with local storage synchronization (`useMealDraftStore`). If the user accidentally closes the browser tab or refreshes during a meal build, their drafted food items and gram counts are preserved.
5. **RTL Saturday-First Calendar Progression:**
   - The workout calendar correctly respects Middle Eastern cultural convention by beginning the weekly grid on Saturday (السبت) and cleanly handles Gregorian month transitions in RTL layout.
6. **Graceful Sonner Undo Mechanisms:**
   - Food logging, meal group additions, and water quick-adds provide 6000ms Sonner toast notifications with a one-tap "تراجع" (Undo) action, allowing quick rollback of accidental logging actions.
7. **Semantic Radix Bottom Sheet Integration (Vaul):**
   - Modal bottom sheets utilize Vaul drawers with accessible overlay backdrops, swipe-down gestures, and proper body scroll locking.
8. **TanStack React Query Cache Synchronization:**
   - Optimistic mutations and automated cache invalidation queries in `src/lib/api.ts` ensure smooth state updates without full-page reloads.

---

## 5. Not Verified (Testing Constraints & Rationale)

The following areas could not be verified under live runtime execution and explain the testing methodology used:

1. **Live Authenticated Dynamic Screenshots via Headless Chromium:**
   - *Constraint:* The local development server (`http://localhost:3000`) is configured against a live production Supabase instance (`supabase.co`) requiring valid user credentials. Creating unauthorized test accounts or modifying remote production tables was strictly prohibited under the audit mandate.
   - *Verification Method Used:* Unauthenticated views (Splash, BootLoader, Connection Error, and Lock/Auth Screen) were visually rendered and inspected across viewports 320, 360, 375, 390, 414, and 768px in RTL and light/dark modes using headless Chrome CDP. Authenticated screens (Today, Log, Goals, Progress, Workouts, Settings, and all 11 sheets) were audited via static code analysis, CSS layout math, flexbox/grid boundary calculation, and verified against the user's high-resolution production device screenshot.
2. **Live Native Camera Feed (`getUserMedia`) in AI Scan Sheet:**
   - *Constraint:* Physical camera hardware capture, dynamic barcode autofocus, and real-time video stream frame rates cannot be tested in a headless Windows execution environment.
   - *Verification Method Used:* Audited video container layout constraints, fallback file-upload input handlers, and error state UI branches.
3. **Physical 120Hz Touch Latency & Haptic Feedback:**
   - *Constraint:* Native touch scroll friction, inertia bouncing, and tactile haptic response on physical OLED hardware (e.g. iPhone ProMotion / Samsung 120Hz) cannot be verified in browser automation.

---

## 6. Top 10 Fixes in Recommended Order

The top 10 highest-impact fixes prioritized by user safety, visual polish, and engineering effort:

| Priority | Fix Title | Affected Files | Effort | Why It Matters First |
|:---:|:---|:---|:---:|:---|
| **1** | **Fix Inverted Alert Dialogs (Prevent Data Loss & Accidental Logout)** | `src/components/nutra/sheets/meal-builder-sheet.tsx`, `src/components/nutra/screens/settings.tsx` | **S** (~15 min) | **Critical UX & Safety:** Pressing Escape or dismiss currently wipes the user's drafted meal or logs them out because `AlertDialogCancel` and `AlertDialogAction` are inverted. |
| **2** | **Fix Macro Input Flex Overflow (`min-w-0`) (Defect S1)** | `src/components/nutra/num-input.tsx`, `src/components/nutra/macro-split-editor.tsx` | **S** (~30 min) | **Primary Visual Bug:** Eliminates the broken card layout on Goals where inputs overflow the left edge and push percentage labels off-screen. |
| **3** | **Fix Bottom Nav & Content Safe-Area Overlap (Defect S7)** | `src/app/page.tsx`, `src/components/nutra/bottom-nav.tsx`, `src/components/nutra/screens/settings.tsx` | **S** (~20 min) | **Universal Usability:** Increases main padding to `pb-36` or dynamic `calc(7rem + env(safe-area-inset-bottom))` so bottom cards and save buttons are never obscured. |
| **4** | **Fix Severe Light & Dark Theme Color Contrast Failures (Defects S5, S10, UX-078, UX-085, UX-091)** | `src/app/globals.css`, `src/components/nutra/sheets/food-confirm-sheet.tsx`, `src/components/nutra/sheets/edit-grams-sheet.tsx`, `src/components/nutra/sheets/workout-sheet.tsx`, `src/components/nutra/screens/workouts.tsx` | **M** (~1 hr) | **Accessibility:** Eliminates unreadable 1.9:1–2.4:1 contrast on white-on-pastel workout tags, 2.1:1 carbs text on light cards, and restores dark mode card border separation. |
| **5** | **Fix Percentage Rounding Algorithm (Hamilton-Hare / Largest Remainder) (Defect S2)** | `src/components/nutra/macro-split-editor.tsx`, `src/lib/i18n.tsx` | **S** (~30 min) | **Mathematical Integrity:** Ensures macro percentages always sum to exactly 100.0% (instead of 99.9%) and eliminates contradictory rounding between row chips and helper text. |
| **6** | **Fix Bi-directional Text Formatting & Bidi Isolates (Defect S4)** | `src/components/nutra/macro-split-editor.tsx`, `src/lib/i18n.tsx`, `src/app/page.tsx` | **S** (~30 min) | **Arabic Typography:** Wraps mathematical formulas and mixed numeric strings in `<bdi>` and unicode directional isolates (`\u2066` / `\u2069`), fixing scrambled punctuation and flipped parentheses. |
| **7** | **Fix Imperial Units Dirty-Check & Unit Display Bugs (UX-028, UX-031, UX-044, UX-074)** | `src/components/nutra/screens/goals.tsx`, `src/components/nutra/calorie-calculator.tsx`, `src/components/nutra/sheets/quick-sheets.tsx`, `src/components/nutra/onboarding.tsx` | **S** (~45 min) | **Logic Correctness:** Fixes bug where Goals Save button is permanently enabled in imperial mode, and eliminates hardcoded "kg" / "lb" Latin text in Arabic mode. |
| **8** | **Enlarge Interactive Touch Targets to 44×44px (WCAG 2.5.5 / 2.5.8)** | 15 component files (`bottom-nav.tsx`, `segmented.tsx`, `macro-split-editor.tsx`, `calorie-calculator.tsx`, `screens/today.tsx`, `screens/workouts.tsx`, etc.) | **M** (~2 hr) | **Touch Ergonomics:** Eliminates 38+ sub-44px buttons, steppers, and chips across all mobile screens to prevent missed taps. |
| **9** | **Eliminate Sub-12px Font Sizes for Arabic Typography (Defect S5)** | `src/components/nutra/zigzag-plan.tsx`, `src/components/nutra/bottom-nav.tsx`, `src/components/nutra/macro-split-editor.tsx`, `src/components/nutra/screens/workouts.tsx`, etc. | **M** (~1.5 hr) | **Legibility:** Replaces 56 instances of 9px–11px text with legible 12px+ typography, preserving Arabic diacritic dots and ligatures. |
| **10** | **Add Accessible Progress Semantics (`role="progressbar"`)** | `src/components/nutra/macro-donut.tsx`, `src/components/nutra/screens/goals.tsx`, `src/components/nutra/screens/today.tsx`, `src/components/nutra/splash.tsx` | **M** (~2 hr) | **Accessibility:** Adds standard `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` so screen readers can announce nutrition and workout progress. |


