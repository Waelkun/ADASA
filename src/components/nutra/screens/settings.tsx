"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { RotateCcw, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProfile, useUpdateProfile, useDemoReset } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Segmented } from "../segmented";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile } from "@/lib/types";

export function SettingsScreen() {
  const { t } = useI18n();
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-[22px]" />
        ))}
      </div>
    );
  }

  return <SettingsForm key={profile.id} profile={profile} />;
}

function SettingsForm({ profile }: { profile: Profile }) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const update = useUpdateProfile();
  const resetDemo = useDemoReset();
  const lockApp = useAppStore((s) => s.lockApp);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [form, setForm] = useState({
    displayName: profile.displayName ?? "",
    units: profile.units ?? "metric",
  });

  const save = () =>
    update.mutate(form, {
      onSuccess: () => toast.success(t("settings_saved")),
      onError: () => toast.error(t("error_toast")),
    });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* preferences */}
      <section className="nutra-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold">{t("preferences")}</h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("language")}</span>
          <Segmented
            value={lang}
            onChange={(v) => setLang(v as "ar" | "en")}
            options={[
              { value: "ar", label: t("arabic") },
              { value: "en", label: t("english") },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{t("units")}</span>
          <Segmented
            value={form.units}
            onChange={(v) => setForm((f) => ({ ...f, units: v }))}
            options={[
              { value: "metric", label: t("metric") },
              { value: "imperial", label: t("imperial") },
            ]}
          />
        </div>
        <label className="flex items-center justify-between py-1">
          <span className="text-sm font-semibold">{t("dark_mode")}</span>
          <button
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={t("dark_mode")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              theme === "dark" ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`absolute top-1 size-6 rounded-full bg-card shadow transition-all ${
                theme === "dark" ? "start-7" : "start-1"
              }`}
            />
          </button>
        </label>
      </section>

      {/* demo reset */}
      <section className="nutra-card p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("data_reset")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("data_reset_hint")}</p>
        </div>
        <button
          onClick={() =>
            resetDemo.mutate(undefined, { onSuccess: () => toast.success(t("data_reset_done")) })
          }
          disabled={resetDemo.isPending}
          className="size-11 shrink-0 grid place-items-center rounded-full bg-secondary hover:bg-negative/10 hover:text-negative transition-colors disabled:opacity-50"
          aria-label={t("data_reset")}
        >
          <RotateCcw className={`size-5 ${resetDemo.isPending ? "animate-spin" : ""}`} />
        </button>
      </section>

      {/* log out */}
      <section className="nutra-card p-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("logout")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("logout_hint")}</p>
        </div>
        <button
          onClick={() => setConfirmLogout(true)}
          className="size-11 shrink-0 grid place-items-center rounded-full bg-secondary hover:bg-negative/10 hover:text-negative transition-colors"
          aria-label={t("logout")}
        >
          <LogOut className="size-5" />
        </button>
      </section>

      <button
        onClick={save}
        disabled={update.isPending}
        className="h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25 sticky bottom-24"
      >
        {update.isPending ? "…" : t("save")}
      </button>

      {/* log out confirmation */}
      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent className="max-w-sm mx-auto rounded-[24px]">
          <AlertDialogHeader className="sm:text-center">
            <AlertDialogTitle>{t("logout_q")}</AlertDialogTitle>
            <AlertDialogDescription>{t("logout_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogAction className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold">
              {t("cancel")}
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => {
                setConfirmLogout(false);
                lockApp();
              }}
              className="h-12 px-6 rounded-full bg-secondary text-negative font-bold border-none mt-0"
            >
              {t("logout")}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

