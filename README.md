# Adasa (عدسة) — Vision AI Nutrition & Calorie Tracking Platform

<p align="center">
  <img src="docs/screenshots/adasa-app-icon.png" alt="Adasa Logo" width="110" style="border-radius: 26px;" />
</p>

<p align="center">
  <a href="https://adasa-qomra.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vision%20AI-Multimodal%20Scanner-76B900?style=for-the-badge" alt="Vision AI" />
</p>

<p align="center">
  An intelligent, Arabic-first nutrition and fitness tracking web platform. Unlike generic Western calorie counters, Adasa is purpose-built with native Arabic typography, cultural dish context, and true RTL ergonomics, combined with multimodal Vision AI for automatic barcode, nutrition label, and food plate recognition.
</p>

---

## 🌐 Live Application

- **Production URL:** [https://adasa-qomra.vercel.app/](https://adasa-qomra.vercel.app/)
- **Deployment Platform:** Vercel
- **Cloud Infrastructure:** Supabase (PostgreSQL 15+, Row Level Security, Supabase Auth)
- **AI Processing:** Multimodal Vision AI Model Endpoint

---

## 📸 Product Showcase & Screenshots

### 1. Daily Nutrition Dashboard & Mobile Experience
*Interactive calorie rings, macronutrient breakdown (protein, carbs, fats), meal categorization, and one-tap hydration:*

<p align="center">
  <img src="docs/screenshots/adasa-today-dashboard.png" alt="Adasa Today Dashboard (Desktop)" width="58%" />
  <img src="docs/screenshots/adasa-mobile-view.png" alt="Adasa Today Dashboard (Mobile View)" width="38%" />
</p>

### 2. Intelligent Caloric Cycling & Vision AI Scanning
*Metabolic Zigzag calorie planning and camera-assisted nutrition label recognition:*

<p align="center">
  <img src="docs/screenshots/adasa-goals-cycling.png" alt="Adasa Zigzag Caloric Cycling Goals" width="48%" />
  <img src="docs/screenshots/adasa-vision-ai-scan.png" alt="Adasa Multimodal Vision AI Scanner" width="48%" />
</p>

### 3. Strength Workouts & Cloud Portal
*Dedicated muscle group volume tracking alongside zero-friction Google OAuth sign-in:*

<p align="center">
  <img src="docs/screenshots/adasa-workouts.png" alt="Adasa Workout Tracker" width="48%" />
  <img src="docs/screenshots/adasa-login-en.png" alt="Adasa Cloud Portal" width="48%" />
</p>

---

## ✨ Key Features

- **📸 Multimodal Vision AI Scanner:** Snap a picture of any food plate or nutrition label. The vision model analyzes ingredients, serving size, and extracts accurate calorie, protein, carbohydrate, and fat counts directly into your diary.
- **⚡ Zigzag Caloric Cycling Plan:** Supports flexible metabolic cycling (alternating higher and lower caloric intake days throughout the week) to prevent metabolic slowdown during fat loss or muscle building phases.
- **🎯 Dynamic Macro Targets & Science-Backed Formulas:** Built-in Mifflin-St Jeor and Harris-Benedict algorithms calculate precise Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) with custom percentage/gram splits.
- **🥗 Categorized Daily Diary:** Log breakfast, lunch, dinner, and snacks with a custom meal builder, quick-add macros, and a favorite foods catalog.
- **💧 One-Tap Hydration Tracker:** Log water intake with rapid increments (250ml, 500ml, custom) alongside an active daily progress ring.
- **⚖️ Weight Trend Analysis:** Track scale weights with moving-average trendlines (kg or lb) to filter out daily water weight fluctuations.
- **🏋️ Strength Workout Logger:** Track training frequency, duration, and muscle groups targeted per session.
- **🔒 Enterprise-Grade Security & Isolation:** All health records, custom meals, and weight data are strictly protected by PostgreSQL **Row Level Security (RLS)** in Supabase.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    UserClient([Client Browser: Desktop & Mobile PWA]) -->|HTTPS / Next.js 15 App Router| Vercel[Vercel Serverless Platform]
    Vercel -->|Auth & Data Queries| SupabaseClient[Supabase Client SDK]
    SupabaseClient -->|PostgreSQL + Row Level Security| SupabaseDB[(Supabase PostgreSQL)]
    UserClient -->|Camera Capture / Label Photo| ApiScan[Next.js API Route: /api/scan]
    ApiScan -->|Preprocess & Validate| Sharp[Sharp Optimization Engine]
    Sharp -->|Multimodal Image Prompting| VisionAI[Multimodal Vision AI Model]
    VisionAI -->|Normalized Nutrition JSON| ApiScan
    ApiScan -->|Verified Food Record| UserClient
```

---

## 🛠️ Tech Stack Breakdown

| Layer | Technologies |
|---|---|
| **Framework & Engine** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling & Design System** | Tailwind CSS v4, Lucide React, Shadcn UI primitives |
| **Motion & Physics** | GSAP (`@gsap/react`), Framer Motion |
| **State & Data Fetching** | Zustand (local UI state), TanStack React Query v5 (server sync) |
| **Backend & Cloud Database** | Supabase (PostgreSQL 15+, Row Level Security policies) |
| **Authentication** | Supabase Auth (PKCE flow, Google OAuth, Magic Link & Email) |
| **Vision & Machine Learning** | Multimodal Vision API endpoint with rate limiting & token pooling |
| **Deployment & Edge CDN** | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Supabase Project URL & Anon Key
- Multimodal Vision API Key

### 1. Clone the repository
```bash
git clone https://github.com/Waelkun/ADASA.git
cd ADASA
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Fill in your project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Multimodal Vision AI Model Credentials
NVIDIA_API_KEY=your-vision-api-key
NVIDIA_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning

# Daily Scan Rate Limit per User
SCAN_DAILY_LIMIT=30
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Build for production
```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy

- All user metrics, dietary logs, and weight records are sandboxed per-user via Supabase **Row Level Security (RLS)**.
- Sensitive vision API keys are executed server-side via Next.js serverless route handlers (`/api/scan`) and never exposed to the client bundle.

---

## 📄 License

Maintained by [Waelkun](https://github.com/Waelkun). All rights reserved.
