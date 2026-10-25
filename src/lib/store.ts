"use client";

import { create } from "zustand";
import type { MealType, TabId } from "./types";

/** Sheet kinds opened by the floating + button (and other screens) */
export type SheetKind =
  | null
  | "quick-add"
  | "scan"
  | "manual-food"
  | "meal-builder"
  | "water"
  | "weight"
  | "workout";

interface QuickAddState {
  tab: TabId;
  sheet: SheetKind;
  /** target date for workout sheet */
  workoutDate: string | null;
  /** day viewed on Today screen (null = today) */
  selectedDay: string | null;
  /** initial meal for the meal-builder sheet */
  sheetMeal: MealType | null;
  setTab: (t: TabId) => void;
  openSheet: (s: SheetKind, opts?: { workoutDate?: string; mealType?: MealType }) => void;
  closeSheet: () => void;
  setSelectedDay: (d: string | null) => void;
}

export const useAppStore = create<QuickAddState>((set) => ({
  tab: "today",
  sheet: null,
  workoutDate: null,
  selectedDay: null,
  sheetMeal: null,
  setTab: (tab) => set({ tab, sheet: null }),
  openSheet: (sheet, opts) =>
    set({ sheet, workoutDate: opts?.workoutDate ?? null, sheetMeal: opts?.mealType ?? null }),
  closeSheet: () => set({ sheet: null }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
}));
