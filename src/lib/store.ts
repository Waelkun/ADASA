"use client";

import { create } from "zustand";
import type { TabId } from "./types";

/** Sheet kinds opened by the floating + button (and other screens) */
export type SheetKind =
  | null
  | "quick-add"
  | "scan"
  | "manual-food"
  | "water"
  | "weight"
  | "workout";

interface QuickAddState {
  tab: TabId;
  sheet: SheetKind;
  /** target date for workout sheet */
  workoutDate: string | null;
  setTab: (t: TabId) => void;
  openSheet: (s: SheetKind, opts?: { workoutDate?: string }) => void;
  closeSheet: () => void;
}

export const useAppStore = create<QuickAddState>((set) => ({
  tab: "today",
  sheet: null,
  workoutDate: null,
  setTab: (tab) => set({ tab, sheet: null }),
  openSheet: (sheet, opts) =>
    set({ sheet, workoutDate: opts?.workoutDate ?? null }),
  closeSheet: () => set({ sheet: null }),
}));
