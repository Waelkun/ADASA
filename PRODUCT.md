# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users: Arabic-speaking individuals, athletes, gym-goers, and health-conscious people tracking daily nutrition, caloric intake, macronutrient splits (protein, carbohydrates, fats), water consumption, body weight trends, and strength workouts.
Situation: Daily, on-the-go logging on mobile smartphones (often in kitchens, restaurants, or gyms), with occasional access on tablets and desktop browsers.

## Product Purpose

"عدسة" (Adasa / Nutra) is a personal nutrition and fitness tracking web application. It eliminates the friction of manual dietary tracking through fast logging, instant preset adjustments, and camera-based nutrition label and food scanning powered by Vision AI models. Success means the user can record meals and review nutritional balances in seconds with high confidence and minimal cognitive load.

## Positioning

Unlike generic international calorie trackers (MyFitnessPal, Lose It) that lack native Arabic typography, cultural dish context, and true RTL ergonomics, Adasa provides a purpose-built, high-craft Arabic RTL experience with integrated Vision AI scanning, flexible caloric cycling (Zigzag plan), and localized macro targets.

## Operating Context

- **Workflow:** Daily logging rhythm — morning weigh-in and water logging, meal-by-meal logging throughout the day (via search, quick add, meal builder, or camera scan), and evening workout and progress check.
- **Environment:** High-distraction mobile contexts (standing in kitchen, at a store reading food labels, or mid-workout). Requires immediate feedback, high touch targets, high legibility under varying ambient light, and distinct visual cues.
- **Surface Mode:** **Operate** — scanning speed, numeric precision, and native tactile ergonomics take precedence over decorative ornament.

## Capabilities and Constraints

- **Core Capabilities:**
  - Calorie and macro target calculation (Harris-Benedict, Mifflin-St Jeor) with custom percentage/gram splits.
  - Zigzag caloric cycling plan for metabolic flexibility.
  - Daily food logging categorized by meal (breakfast, lunch, dinner, snack) with favorite foods and custom meal builder.
  - Water intake logging with one-tap quick volume increments.
  - Body weight trend tracking with dual unit support (kg / lb) and target deltas.
  - Workout logging with muscle group targeting and weekly frequency metrics.
  - Multi-user cloud synchronization with Supabase PostgreSQL and Row-Level Security (RLS).
  - Vision AI barcode and nutrition label scanner.
- **Constraints (Ground Rules):**
  - Zero modification to business logic, API routes, data fetching contracts, or database schema.
  - Preservation of all existing auth flows, user settings, and calculation mathematics.
  - Full adherence to `prefers-reduced-motion`.
  - Non-destructive visual and motion upgrade only.

## Brand Commitments

- **Name:** عدسة (Adasa) / Nutra
- **Voice & Tone:** Encouraging, precise, disciplined, and respectfully conversational in modern standard Arabic.
- **Visual Identity Heritage:** iOS-style card architecture, floating glass navigation dock, emerald health green as primary identity color.

## Product Principles

1. **Information Density with Breathing Room:** Numbers and data points must be instantly legible (tabular figures, clear units) without cognitive clutter.
2. **Tactile & Responsive Touch Affordances:** Primary logging actions must feel immediate, responsive, and comfortable for one-handed thumb interaction.
3. **Respect Cultural & Typographic Norms:** Arabic type must never look like an afterthought; leading, tracking, hierarchy, and punctuation must strictly follow Arabic typographic craft.
4. **Resilient Under Real-World Lighting:** Dual-mode (airy light and deep OLED dark) with strictly compliant WCAG AA contrast for text and critical data.
