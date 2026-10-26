# Design Review & Audit Report — عدسة (Adasa)

**Date:** 2026-10-26  
**Target:** Full Web Application (`src/`, all routes, tabs, and sheet components)  
**Evaluator:** Impeccable 4.7.1 & Taste Skill (design-taste-frontend) v2  
**Baseline Captures:** 57 full-viewport screenshots stored at `.impeccable/baseline/` (375px mobile, 768px tablet, 1440px desktop)  
**Mode:** Operate (High-frequency daily nutrition & fitness tracking utility)

---

## Executive Summary

Adasa is an ambitious, feature-rich Arabic-first nutrition and fitness tracking application built on Next.js 16, React 19, and Tailwind CSS v4. While the underlying feature set (calorie calculation, Zigzag cycling, macro tracking, water logging, workouts, and AI scanning) is robust and completely operational, the user interface currently suffers from **severe desktop/tablet responsiveness collapse** (trapping the interface inside a 448px phone strip regardless of screen size), **failing WCAG AA contrast in light mode on primary action elements**, **banned rubber-band bounce easings**, and **typographic sizing deficiencies**.

Addressing these foundations in Phase 3 and applying tasteful art direction in Phase 4 will elevate the app from a cramped mobile prototype into a world-class, premium athletic utility.

---

## Automated Detector & Inspector Evidence

### 1. `impeccable detect src/` (Source AST Analysis)
* **Advisory Failures (Bounce Easings):**
  * `src/app/globals.css`: lines 274, 290, 353 — `cubic-bezier(0.34, 1.3, 0.64, 1)` and `cubic-bezier(0.34, 1.4, 0.64, 1)`.
  * `src/components/nutra/bottom-nav.tsx`: line 20 — `SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)"`.
  * *Verdict:* Overshoot / springy bounce easings feel dated and tacky on high-frequency utility surfaces. Objects must decelerate smoothly using exponential ease-out curves (`cubic-bezier(0.16, 1, 0.3, 1)`).

### 2. `impeccable detect http://localhost:3000` (Live Rendered DOM)
* **[low-contrast] Failure (2.3:1 vs 4.5:1 required):** Primary green text `#10b981` on `#f4f6f8` ground for key actions ("نسيت كلمة المرور؟", "إنشاء حساب جديد").
* **[low-contrast] Failure (2.5:1 vs 4.5:1 required):** Primary button text `#ffffff` on `#10b981` background.
* **[low-contrast] Advisory (3.3:1):** Placeholder `#818690` on `#f1f4f7` inputs.

### 3. `taste-skill inspect http://localhost:3000 --app`
* **FAIL — Contrast:** `#10b981` on `#f4f6f8` (2.3:1) and `#ffffff` on `#10b981` (2.5:1).
* **WARN — [hero-void] @1440px:** 29% of the primary desktop viewport is one massive empty void block (480×780px) caused by centering a mobile-only 448px column on a wide display.
* **WARN — [tiny-text]:** Over 80% of labels and metrics measured under 13px.

---

## Prioritized Issue Registry

### P0 — Broken / Unusable / Critical Accessibility Failures

| ID | Issue | Location | Evidence / Impact |
|---|---|---|---|
| **P0-1** | **Severe WCAG AA Contrast Failure on Primary Action & Links in Light Mode** | `src/app/globals.css`, `src/components/nutra/lock-screen.tsx`, `src/components/nutra/bottom-nav.tsx` | Button text `#ffffff` on `#10b981` gives **2.5:1** contrast; green links on light ground give **2.3:1**. Both fail the minimum legal WCAG AA threshold of 4.5:1. Essential buttons and links wash out in daylight. |
| **P0-2** | **Desktop (1440px) & Tablet (768px) Viewport Collapse into 448px Phone Column** | `src/app/page.tsx` (lines 285, 309, 326), `src/components/nutra/bottom-nav.tsx` (line 183) | Hardcoded `max-w-md` (448px) on `<header>`, `<main>`, and `<nav>` leaves **69% of a 1440px desktop screen completely blank**. On tablet (768px), charts, calorie rings, and logs are squeezed into a narrow strip while massive margins sit empty on both sides. |
| **P0-3** | **Arabic Calendar Typography & Header Misalignment** | `src/components/nutra/screens/workouts.tsx`, `src/lib/date-ar.ts` | Weekday column headers contain hardcoded Arabic commas (`سبت، أحد، اثنين، ...`) causing RTL punctuation inversion and column misalignment where dates slip under wrong weekday headings. |

---

### P1 — Clearly Hurts Quality & User Experience

| ID | Issue | Location | Evidence / Impact |
|---|---|---|---|
| **P1-1** | **Banned Rubber-Band Bounce Easings in Dock & Animations** | `src/app/globals.css` (lines 274, 290, 353), `src/components/nutra/bottom-nav.tsx` (line 20) | Tab switching and splash elements bounce with `cubic-bezier(0.34, 1.56, 0.64, 1)`. Feels toy-like and rubbery. Must be replaced with silky exponential deceleration tokens (`cubic-bezier(0.16, 1, 0.3, 1)`). |
| **P1-2** | **Radial Gauge Overload on Today Screen** | `src/components/nutra/screens/today.tsx`, `calorie-ring.tsx`, `macro-donut.tsx` | Two competing circular donut charts (`CalorieRing` and `MacroDonut`) stacked vertically in the same mobile view. Causes cognitive fatigue and redundant circular geometry. The macro split needs a clean, linear proportion bar or tabular grid. |
| **P1-3** | **Sub-12px Font Sizing Across Secondary Data Points** | `src/components/nutra/stat-card.tsx`, `screens/today.tsx`, `screens/log.tsx`, `screens/progress.tsx` | Extensive use of `text-[10px]` and `text-[11px]` for units, timestamps, and macros. Degrades legibility, especially for gym users viewing screens at arm's length. Minimum text size should be 12px/13px. |
| **P1-4** | **Un-tinted, Sterile Neutral Surfaces** | `src/app/globals.css` (`--background`, `--secondary`, `--muted`, `--border`) | Light theme uses flat `#f4f6f8` gray; dark theme uses muddy `#1c2721` with high-contrast `#2e4138` borders. Lacks deliberate emerald/slate tinted undertones that convey depth and cohesion. |
| **P1-5** | **Sub-44px Touch Targets on Workout Calendar & Pagination** | `src/components/nutra/screens/workouts.tsx` (lines 140–180), header controls | Calendar day buttons are `size-8` (32×32px) and `size-9` (36×36px) without touch slop padding. Causes frequent missed taps and frustration when selecting workout dates on mobile. |
| **P1-6** | **Fixed Bottom Dock Clearance & Button Collisions** | `src/components/nutra/screens/settings.tsx`, `screens/log.tsx` | Sticky actions (e.g. "حفظ الإعدادات" button) hug or overlap the bottom navigation dock on shorter screens due to rigid clearance calculations. |

---

### P2 — Polish & Delight

| ID | Issue | Location | Evidence / Impact |
|---|---|---|---|
| **P2-1** | **Static Numbers on Value Changes** | `src/components/nutra/screens/today.tsx`, `screens/goals.tsx`, `sheet-water.tsx` | Calorie totals and water counts snap instantly without smooth tabular pop-in or odometer transition feedback. |
| **P2-2** | **Empty State Blandness** | `src/components/nutra/screens/today.tsx` (zero logs), `screens/log.tsx` (search not found) | Empty states display generic muted text ("لا توجد وجبات مسجلة") without encouraging iconography, sample recommendations, or one-tap logging shortcuts. |
| **P2-3** | **Header Scrim & Scroll Depth** | `src/app/page.tsx` (header) | Header stays flat with `backdrop-blur-xl` but has no subtle border or elevation separator when cards scroll under it. |
| **P2-4** | **Button & Card Press Micro-interactions** | `src/components/nutra/bottom-nav.tsx`, `quick-sheets.tsx` | Preset buttons (`+250`, `+500`) and quick-add tiles lack physical press feedback (scale down to 0.97 with snappy release). |
| **P2-5** | **Reduced-Motion Blanket Reset** | `src/app/globals.css` (lines 377–385) | The existing reduced-motion media query forces `animation-duration: 0.01ms !important` across all elements globally. While functional, it is blunt. Needs intentional non-spatial opacity fades for accessible continuity. |

---

## Action Plan by Phase

* **Phase 3 (Fix the Foundations — Impeccable):**
  1. `/impeccable colorize`: Re-palette light mode primary to WCAG AA-compliant deep emerald (`#047857` / `#059669` for text, high-contrast text on buttons); tint neutrals with subtle green/slate undertones.
  2. `/impeccable layout` & `/impeccable adapt`: Adapt layout for tablet (768px: 2-column dashboard) and desktop (1440px: centered card canvas with sidebar/floating dock balance), eliminating the hero void.
  3. `/impeccable typeset`: Normalize font sizes (eliminate `<12px` text; tabular numerals on all metrics).
  4. `/impeccable clarify` & `/impeccable onboard`: Enhance empty states with actionable shortcuts; clean up calendar typography.
  5. `/impeccable harden`: Fix calendar touch target sizes (minimum 44×44px hit slop) and dock clearance.

* **Phase 4 (Art Direction — Taste Skill):**
  1. Establish a distinctive athletic/health voice: quiet panels, high data alignment, color reserved strictly for nutritional semantics.
  2. Harmonize Today screen by simplifying the redundant MacroDonut into a sleek, linear proportional macro bar.

* **Phase 5 (Motion):**
  1. `transitions.dev`: Micro-interactions for buttons, modals, dropdowns, water presets, and number pop-ins.
  2. `GSAP`: Page-load entrance sequences with `useGSAP`, staggered card reveals, and smooth ring progression.
  3. `React Bits`: Targeted hero counter / text accent (maximum 1-2 lightweight effects).
  4. `/impeccable animate`: Comprehensive motion audit ensuring zero bounce, shared duration tokens (<350ms), and full `prefers-reduced-motion` compliance.

* **Phase 6 (Verification):**
  1. Full re-run of Playwright baseline across 375px, 768px, and 1440px.
  2. Verify 0 detector anti-patterns and 0 taste-skill inspect fails.
  3. Final shipping polish.
