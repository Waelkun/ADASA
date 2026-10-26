---
name: Adasa Design System
description: Incumbent design system for Adasa nutrition and fitness tracking application
colors:
  primary: "#10b981"
  primary-foreground: "#ffffff"
  background-light: "#f4f6f8"
  background-dark: "#0b1210"
  card-light: "#ffffff"
  card-dark: "#141d19"
  muted-foreground-light: "#5f6a7d"
  muted-foreground-dark: "#8ca39a"
  border-light: "#e7ecf1"
  border-dark: "#2e4138"
  accent-light: "#e9f9f1"
  accent-dark: "#123529"
  accent-foreground: "#047857"
  destructive: "#f04438"
  protein: "#22c55e"
  carbs: "#f59e0b"
  fat: "#f97066"
  water: "#14b8a6"
typography:
  display:
    fontFamily: "IBM Plex Sans Arabic, Inter, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans Arabic, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans Arabic, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "IBM Plex Sans Arabic, Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  xl: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "{colors.card-light}"
    rounded: "{rounded.xl}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  chip:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Adasa Design System

## 1. Overview
Adasa is a mobile-first personal nutrition, fitness, and body composition tracking application. The design aesthetic is modeled after modern iOS utility applications: rounded surfaces, glassy floating dock navigation, tactile pill-shaped action buttons, and segmented circular rings for immediate macronutrient comprehension.

## 2. Colors
- **Brand Primary:** Emerald `#10b981` (light mode lacks sufficient WCAG contrast on `#f4f6f8` ground).
- **Surfaces:**
  - Light mode: Ground `#f4f6f8`, Cards `#ffffff`, Borders `#e7ecf1`.
  - Dark mode: Ground `#0b1210`, Cards `#141d19`, Borders `#2e4138`.
- **Nutritional Semantic Palette:**
  - Protein: `#22c55e` (Light) / `#34d399` (Dark).
  - Carbohydrates: `#f59e0b` (Light) / `#fbbf24` (Dark).
  - Fats: `#f97066` (Light) / `#fb8a84` (Dark).
  - Water / Hydration: `#14b8a6` (Light) / `#2dd4bf` (Dark).
  - Calorie Deficit / Surplus: Positive `#12b76a`, Negative `#f04438`.

## 3. Typography
- **Primary Arabic Typeface:** IBM Plex Sans Arabic (`--font-arabic`), loaded across weights 400, 500, 600, 700.
- **Secondary Latin Typeface:** Inter (`--font-inter`) for numeric tabular fallback.
- **Hierarchy:**
  - Hero Ring Numbers: `32px` / `36px`, bold tabular figures.
  - Section Titles: `16px` – `18px`, bold.
  - Body & Card Data: `13px` – `14px`, medium.
  - Captions & Hints: `11px` – `12px` (several instances drop to 10px/11px violating legibility guidelines).

## 4. Layout
- **Viewport Constraints:** Explicitly constrained to mobile width `max-w-md` (448px) centered with `mx-auto` across all breakpoints, resulting in severe void issues on tablet (768px) and desktop (1440px).
- **Rhythm & Safe Areas:** Top safe-area offset `pt-safe` and dock bottom clearance `--dock-clearance` (calculated as `var(--dock-height) + var(--dock-bottom-offset) + 28px`).
- **Direction:** RTL layout (`dir="rtl"`) with natural right-to-left optical hierarchy.

## 5. Elevation & Depth
- **Cards (`nutra-card`):** Soft dual-layer ambient shadow (`0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.05)` in light mode; `0 1px 2px rgba(0,0,0,0.3), 0 6px 20px rgba(0,0,0,0.25)` in dark mode).
- **Navigation Dock:** Backdrop filter blur (`backdrop-blur-[20px] backdrop-saturate-[1.8]`) with card alpha background.

## 6. Shapes
- **Corner Radii:** Prominent rounded architecture:
  - Cards: `22px` (`rounded-[22px]`).
  - Modal Drawer Sheets: `28px` top radius (`rounded-t-[28px]`).
  - Action Buttons & Chips: Full capsule radius (`rounded-full` / `9999px`).
  - Input Fields: `14px` (`rounded-xl` / `rounded-2xl`).

## 7. Components
- **Header:** Sticky top translucent bar with greeting, date controls, theme toggle, and settings button.
- **Calorie Ring:** SVG radial gauge displaying remaining calories, target, and dynamic progression stroke.
- **Macro Donut:** Concentric / multi-segment ring displaying protein, carbs, and fat distribution.
- **Stat Cards:** 2-column or 3-column micro cards displaying weight, hydration, streaks, and workout targets.
- **Bottom Navigation Dock:** Floating glass pill with 5 core tabs (Today, Log, Goals, Progress, Workouts) plus offset circular quick-add action trigger.
- **Modal Sheets:** Vaul drawer bottom sheets for quick water, weight, workout, food confirmation, and meal creation.

## 8. Do's and Don'ts
- **DO:**
  - Keep numbers tabular (`font-variant-numeric: tabular-nums`).
  - Maintain clear color coding for macronutrients (protein green, carbs amber, fat salmon/coral, water cyan).
  - Support seamless dark/light theme switching with tinted neutrals.
- **DON'T:**
  - Do NOT use un-tinted pure black (`#000000`) or harsh un-tinted grays.
  - Do NOT allow primary button or link text to fail WCAG AA contrast (must meet 4.5:1).
  - Do NOT leave tablet and desktop viewports as an empty void around a 448px phone strip.
  - Do NOT use bouncy, rubber-banding cubic-beziers (`cubic-bezier(0.34, 1.4, ...)`).
