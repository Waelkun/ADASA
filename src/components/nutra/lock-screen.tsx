"use client";

import React from "react";
import { Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/**
 * Logged-out gate — shown while the session is locked (تسجيل الخروج).
 * Nothing is deleted: all data stays on the device, signing back in
 * unlocks the app exactly where the user left it.
 */
export function LockScreen({ name = "" }: { name?: string }) {
  const { t } = useI18n();
  const unlockApp = useAppStore((s) => s.unlockApp);

  const signIn = () => {
    unlockApp();
    toast.success(t("login_done"));
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col items-center justify-center gap-7 px-6 py-10 text-center">
        {/* logo + lock badge */}
        <div className="relative nutra-anim-in">
          <img
            src="/logo.svg"
            alt="Nutra"
            className="size-24 rounded-[30px] shadow-xl shadow-primary/20"
          />
          <span className="absolute -bottom-1.5 -end-1.5 size-9 rounded-full bg-primary text-primary-foreground grid place-items-center border-4 border-background shadow-lg">
            <Lock className="size-4" strokeWidth={2.4} />
          </span>
        </div>

        <div className="flex flex-col gap-2.5 nutra-anim-in">
          <h1 className="text-2xl font-extrabold leading-snug">
            {t("welcome_back")}
            {name ? `، ${name}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {t("lock_sub")}
          </p>
        </div>

        <button
          onClick={signIn}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-lg shadow-primary/25 nutra-anim-in"
        >
          <LogIn className="size-5" strokeWidth={2.4} />
          {t("login")}
        </button>
      </div>
    </div>
  );
}
