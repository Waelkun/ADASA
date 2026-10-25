"use client";

import React, { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useWorkouts, useAddWorkout, useUpdateWorkout, useDeleteWorkout, localDayStr } from "@/lib/api";
import { MUSCLE_GROUPS, type MuscleGroup, type Workout } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { groupColor, groupLabelKey } from "../screens/workouts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESETS: { key: string; groups: MuscleGroup[] }[] = [
  { key: "preset_push", groups: ["chest", "shoulders", "arms"] },
  { key: "preset_pull", groups: ["back", "arms"] },
  { key: "preset_legs", groups: ["legs"] },
  { key: "preset_upper", groups: ["chest", "back", "shoulders", "arms"] },
  { key: "preset_lower", groups: ["legs", "abs"] },
  { key: "preset_full", groups: ["chest", "back", "legs", "abs", "shoulders"] },
];

export function WorkoutSheet() {
  const { t } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const workoutDate = useAppStore((s) => s.workoutDate);

  const date = workoutDate ?? localDayStr();
  const monthKey = date.slice(0, 7);
  const { data } = useWorkouts(monthKey);
  const existing = data?.workouts.find((w) => w.date === date) ?? null;

  return (
    <SheetShell
      open={sheet === "workout"}
      onOpenChange={(o) => !o && closeSheet()}
      title={t("add_or_edit_day")}
    >
      {sheet === "workout" && (
        <WorkoutForm key={`${date}|${existing?.id ?? "new"}`} date={date} existing={existing} />
      )}
    </SheetShell>
  );
}

function WorkoutForm({ date, existing }: { date: string; existing: Workout | null }) {
  const { t, df } = useI18n();
  const closeSheet = useAppStore((s) => s.closeSheet);

  const [groups, setGroups] = useState<string[]>(existing?.muscleGroups ?? []);
  const [duration, setDuration] = useState(existing?.durationMin ? String(existing.durationMin) : "");
  const [note, setNote] = useState(existing?.note ?? "");

  const toggle = (g: MuscleGroup) =>
    setGroups((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  const addW = useAddWorkout();
  const updateW = useUpdateWorkout();
  const deleteW = useDeleteWorkout();

  const save = () => {
    if (!groups.length) {
      toast.error(t("error_toast"));
      return;
    }
    const body = {
      date,
      muscleGroups: groups,
      durationMin: duration ? Number(duration) : undefined,
      note: note.trim() || undefined,
    };
    if (existing) {
      updateW.mutate(
        { id: existing.id, ...body },
        {
          onSuccess: () => {
            toast.success(t("workout_saved"));
            closeSheet();
          },
          onError: () => toast.error(t("error_toast")),
        }
      );
    } else {
      addW.mutate(body, {
        onSuccess: () => {
          toast.success(t("workout_saved"));
          closeSheet();
        },
        onError: () => toast.error(t("error_toast")),
      });
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-center text-xs text-muted-foreground -mt-2 mb-4">
        {df(new Date(date + "T00:00:00"), {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      {/* presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setGroups(p.groups)}
            className="nutra-chip h-9 px-3.5 bg-accent text-accent-foreground hover:brightness-95 transition-all text-[12px]"
          >
            ⚡ {t(p.key as "preset_push")}
          </button>
        ))}
      </div>

      {/* muscle groups */}
      <p className="text-xs font-semibold text-muted-foreground mb-2">{t("muscle_groups")}</p>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {MUSCLE_GROUPS.map((g) => {
          const active = groups.includes(g);
          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              aria-pressed={active}
              className={cn(
                "relative h-16 rounded-[18px] text-xs font-bold flex items-center justify-center transition-all active:scale-95 border-2",
                active ? "text-white border-transparent" : "bg-secondary text-muted-foreground border-transparent"
              )}
              style={active ? { background: groupColor(g) } : undefined}
            >
              {active && (
                <span className="absolute top-1.5 end-1.5 size-4 rounded-full bg-white/25 grid place-items-center">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
              )}
              {t(groupLabelKey(g) as "chest")}
            </button>
          );
        })}
      </div>

      {/* duration + note */}
      <div className="flex gap-2 mb-3">
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          inputMode="numeric"
          placeholder={t("duration_min")}
          aria-label={t("duration_min")}
          className="flex-1 h-12 rounded-full bg-secondary px-5 text-base font-semibold tabular focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("workout_note")}
        aria-label={t("workout_note")}
        className="w-full h-12 rounded-full bg-secondary px-5 text-base font-medium mb-5 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <div className="flex gap-2">
        {existing && (
          <button
            onClick={() =>
              deleteW.mutate(existing.id, {
                onSuccess: () => {
                  toast.success(t("deleted_toast"));
                  closeSheet();
                },
              })
            }
            aria-label={t("delete")}
            className="size-14 rounded-full bg-negative/10 text-negative grid place-items-center active:scale-95 transition-transform shrink-0"
          >
            <Trash2 className="size-5" />
          </button>
        )}
        <button
          onClick={save}
          disabled={addW.isPending || updateW.isPending}
          className="flex-1 h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}
