---
name: Adasa Design System
description: Modernized athletic design system for Adasa nutrition and fitness tracking application
colors:
  primary: "#047857"
  primary-dark: "#34d399"
  primary-foreground: "#ffffff"
  background-light: "#f3f6f4"
  background-dark: "#0a110e"
  card-light: "#ffffff"
  card-dark: "#121b16"
  muted-foreground-light: "#475a51"
  muted-foreground-dark: "#8ca39a"
  border-light: "#e2e8e4"
  border-dark: "#202e27"
  accent-light: "#e6f4ee"
  accent-dark: "#13382c"
  accent-foreground: "#047857"
  destructive: "#dc2626"
  protein: "#059669"
  carbs: "#d97706"
  fat: "#e11d48"
  water: "#0d9488"
typography:
  display:
    fontFamily: "IBM Plex Sans Arabic, Inter, sans-serif"
    fontSize: "2.25rem"
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
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "14px 24px"
  chip:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Adasa Design System

## 1. Overview
Adasa is an athletic, Arabic-first personal nutrition, fitness, and body composition tracking utility. The interface is engineered for high-frequency daily operation: quiet surfaces, subtle emerald tinting, responsive dual-column dashboard structures on tablet/desktop, smooth exponential deceleration curves, and instant data legibility.

## 2. Color Palette & WCAG Compliance
- **Brand Primary:**
  - Light mode: Deep Emerald `#047857` (contrast ratio **5.8:1** on white/light grounds, fully WCAG AA compliant).
  - Dark mode: Vibrant Mint `#34d399` (contrast ratio **9.2:1** on dark surfaces).
  - Foreground on Primary: Pure white `#ffffff` on `#047857` (**5.8:1** contrast).
- **Tinted Neutral Surfaces:**
  - Light mode: Ground `#f3f6f4` (sage/emerald tinted ground), Cards `#ffffff`, Borders `#e2e8e4`, Secondary `#eaf0ed`, Muted Text `#475a51` (5.1:1 contrast).
  - Dark mode: Ground `#0a110e`, Cards `#121b16`, Borders `#202e27`, Secondary `#19251f`, Muted Text `#8ca39a`.
- **Nutritional Semantics:**
  - Protein: `#059669` (Light) / `#34d399` (Dark).
  - Carbohydrates: `#d97706` (Light) / `#fbbf24` (Dark).
  - Fats: `#e11d48` (Light) / `#fb7185` (Dark).
  - Hydration: `#0d9488` (Light) / `#2dd4bf` (Dark).
  - Status Indicators: Positive `#059669`, Negative `#dc2626`.

## 3. Typography & Hierarchy
- **Arabic Typeface:** IBM Plex Sans Arabic (`--font-arabic`), weights 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).
- **Numeric Figures:** Inter (`--font-inter`) with `font-feature-settings: "tnum" 1` / `tabular-nums` applied across all numerical readouts.
- **Minimum Font Floor:**
  - Strict minimum of `12px` (`text-xs`) across all micro-copy, timestamps, and secondary labels.
  - Sub-12px styles (`text-[10px]`, `text-[11px]`) deprecated.
- **Hierarchy:**
  - Hero Numbers: `32px` – `48px`, bold tabular figures.
  - Section Titles: `14px` – `18px`, bold with contextual iconography.
  - Body & Interactive Rows: `14px`, medium.
  - Secondary Badges & Units: `12px` (`text-xs`), bold / semibold.

## 4. Responsive Layout & Composition
- **Mobile (< 768px):** Centered phone column `max-w-md` (448px) with floating dock navigation.
- **Tablet (768px – 1024px):** Expanded container `max-w-3xl` (768px) with 2-column dashboard grids for Today, Workouts, Goals, Progress, and Settings.
- **Desktop (>= 1024px):** Centered container `max-w-4xl` (896px) with 2-column balanced layouts, removing empty void margins while preserving comfortable reading widths.
- **Safe Area & Dock Clearance:** `--dock-clearance` (98px) padding on `<main>` and `--dock-sticky` (82px) on sticky submit buttons ensure zero collision with navigation floating elements.

## 5. Motion Tokens
- **Banned Curves:** Zero overshoot or rubber-band bounce curves (`cubic-bezier(0.34, 1.4+, ...)` banned).
- **Approved Curve:** Exponential deceleration `cubic-bezier(0.16, 1, 0.3, 1)` for all drawers, tabs, and micro-interactions.
- **Duration Scale:**
  - Micro-interactions (press, toggle, check): `150ms` – `200ms`.
  - Sheet / Drawer entry & exit: `280ms` – `320ms`.
  - Staggered entrances: `350ms` with `50ms` stagger intervals.
- **Accessibility:** Full `prefers-reduced-motion` compliance. All spatial transforms collapse to pure opacity cross-fades when requested.
