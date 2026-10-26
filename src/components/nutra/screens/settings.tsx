"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useProfile, useUpdateProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
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
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col gap-4">
          {/* user account */}
          {user && (
            <section className="nutra-card p-4 flex items-center gap-3">
              <div className="size-11 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm overflow-hidden shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  (user.email?.charAt(0) || "👤").toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">
                  {profile.displayName || user.user_metadata?.full_name || "مستخدم عدسة"}
                </p>
                <p className="text-xs text-muted-foreground truncate" dir="ltr">
                  {user.email}
                </p>
              </div>
              {user.app_metadata?.provider === "google" && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-foreground flex items-center gap-1.5 border border-border/50">
                  Google
                </span>
              )}
            </section>
          )}

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
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label={t("dark_mode")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center justify-between py-1 min-h-[44px] text-start cursor-pointer group"
            >
              <span className="text-sm font-semibold">{t("dark_mode")}</span>
              <span
                className={`relative inline-block h-8 w-14 rounded-full transition-colors pointer-events-none ${
                  theme === "dark" ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span
                  className={`absolute top-1 size-6 rounded-full bg-card shadow transition-all ${
                    theme === "dark" ? "start-7" : "start-1"
                  }`}
                />
              </span>
            </button>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          {/* log out */}
          <section className="nutra-card p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("logout")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("logout_hint")}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="size-11 shrink-0 grid place-items-center rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label={t("logout")}
            >
              <LogOut className="size-5" />
            </button>
          </section>
        </div>
      </div>

      <div className="sticky bottom-[var(--dock-sticky)] z-10 flex justify-center pt-2">
        <button
          onClick={save}
          disabled={update.isPending}
          className="w-full max-w-md h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-primary/25"
        >
          {update.isPending ? "…" : t("save")}
        </button>
      </div>

      {/* log out confirmation */}
      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent className="max-w-sm mx-auto rounded-[24px]">
          <AlertDialogHeader className="sm:text-center">
            <AlertDialogTitle>{t("logout_q")}</AlertDialogTitle>
            <AlertDialogDescription>{t("logout_desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel
              autoFocus
              className="h-12 px-6 rounded-full bg-secondary text-foreground font-bold border-none mt-0 hover:bg-secondary/80"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmLogout(false);
                await signOut();
                qc.clear();
                lockApp();
              }}
              className="h-12 px-6 rounded-full bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90"
            >
              {t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

