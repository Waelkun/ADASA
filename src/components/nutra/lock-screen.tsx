"use client";

import React, { useState, useId, useRef } from "react";
import {
  Lock,
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useAuth, getAuthErrorMessage } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "forgot";

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function LockScreen({ name = "" }: { name?: string }) {
  const { t, lang } = useI18n();
  const { signIn, signUp, signInWithGoogle, resetPassword, isConfigured } = useAuth();
  const unlockApp = useAppStore((s) => s.unlockApp);

  const nameId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordErrorId = useId();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(name || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const switchMode = (m: AuthMode) => {
    setErrorMsg(null);
    setFieldErrors({});
    setMode(m);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setFieldErrors({});
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      setErrorMsg(getAuthErrorMessage(error, lang));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const cleanEmail = email.trim();
    const newFieldErrors: { email?: string; password?: string } = {};

    if (!cleanEmail) {
      newFieldErrors.email = t("error_email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newFieldErrors.email = t("error_email_invalid");
    }

    if (mode !== "forgot") {
      if (!password || password.length < 6) {
        newFieldErrors.password = t("error_password_min");
      }
    }

    if (newFieldErrors.email || newFieldErrors.password) {
      setFieldErrors(newFieldErrors);
      if (newFieldErrors.email) {
        emailRef.current?.focus();
      } else if (newFieldErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      const { error } = await resetPassword(cleanEmail);
      setLoading(false);
      if (error) {
        setErrorMsg(getAuthErrorMessage(error, lang));
      } else {
        setForgotSuccess(true);
        toast.success(t("forgot_toast_sent"));
      }
      return;
    }

    if (mode === "signup") {
      setLoading(true);
      const { error, session } = await signUp(cleanEmail, password, displayName);
      setLoading(false);

      if (error) {
        setErrorMsg(getAuthErrorMessage(error, lang));
      } else if (!session) {
        setSignupSuccess(true);
      } else {
        unlockApp();
        toast.success(t("login_done"));
      }
      return;
    }

    if (mode === "login") {
      setLoading(true);
      const { error } = await signIn(cleanEmail, password);
      setLoading(false);

      if (error) {
        setErrorMsg(getAuthErrorMessage(error, lang));
      } else {
        unlockApp();
        toast.success(t("login_done"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        {/* Logo and Lock icon */}
        <div className="relative nutra-anim-in">
          <img
            src="/icons/icon-192.png"
            alt="عدسة"
            className="size-20 rounded-[28px] shadow-xl shadow-primary/20 object-cover"
          />
          <span className="absolute -bottom-1 -end-1 size-8 rounded-full bg-primary text-primary-foreground grid place-items-center border-4 border-background shadow-lg">
            <Lock className="size-3.5" strokeWidth={2.4} />
          </span>
        </div>

        {/* Title & subtitle */}
        <div className="flex flex-col gap-1.5 nutra-anim-in">
          <h1 className="text-2xl font-extrabold leading-snug">
            {mode === "login"
              ? t("login")
              : mode === "signup"
              ? t("create_account")
              : t("reset_password_title")}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {mode === "login"
              ? t("login_sub")
              : mode === "signup"
              ? t("signup_sub")
              : t("forgot_sub")}
          </p>
        </div>

        {/* Warning if env variables are missing */}
        {!isConfigured && (
          <div className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-start text-xs flex items-start gap-3 text-amber-700 dark:text-amber-400 nutra-anim-in">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>{t("env_warning_title")}</strong>
              <p className="mt-1">{t("env_warning_desc")}</p>
              <ul className="list-disc list-inside mt-1 font-mono text-xs opacity-90 leading-relaxed">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="mt-1 text-xs leading-relaxed">
                {t("env_warning_restart")} <code>npm run dev</code>.
              </p>
            </div>
          </div>
        )}

        {/* Success message for signup with email confirmation */}
        {signupSuccess && mode === "signup" ? (
          <div className="w-full nutra-card p-5 text-start flex flex-col gap-3.5 border-primary/30 bg-primary/5 nutra-anim-in">
            <div className="flex items-center gap-2.5 text-primary">
              <CheckCircle2 className="size-5 shrink-0" />
              <h2 className="font-bold text-sm">{t("signup_success_title")}</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("signup_success_desc")} (<strong>{email}</strong>).
            </p>
            <button
              type="button"
              onClick={() => {
                setSignupSuccess(false);
                switchMode("login");
              }}
              className="mt-1 h-11 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <LogIn className="size-4" />
              {t("go_to_login")}
            </button>
          </div>
        ) : forgotSuccess && mode === "forgot" ? (
          <div className="w-full nutra-card p-5 text-start flex flex-col gap-3.5 border-primary/30 bg-primary/5 nutra-anim-in">
            <div className="flex items-center gap-2.5 text-primary">
              <Mail className="size-5 shrink-0" />
              <h2 className="font-bold text-sm">{t("forgot_success_title")}</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("forgot_success_desc")}
            </p>
            <button
              type="button"
              onClick={() => {
                setForgotSuccess(false);
                switchMode("login");
              }}
              className="mt-1 h-11 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ArrowRight className="size-4" />
              {t("back_to_login")}
            </button>
          </div>
        ) : (
          /* Main Auth Form */
          <div className="w-full flex flex-col gap-3 text-start nutra-anim-in">
            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            {mode !== "forgot" && (
              <>
                <button
                  type="button"
                  disabled={loading || googleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 py-2.5 rounded-full bg-card hover:bg-secondary/80 border-2 border-border text-foreground font-bold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {googleLoading ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <GoogleIcon className="size-5" />
                  )}
                  <span>{mode === "signup" ? t("google_signup") : t("google_login")}</span>
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-border w-full" />
                  <span className="bg-background px-3 text-xs text-muted-foreground font-medium">
                    {t("or_email")}
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
              {mode === "signup" && (
                <div className="flex flex-col gap-1">
                  <label htmlFor={nameId} className="text-xs font-semibold text-muted-foreground ps-1">
                    {t("name_optional")}
                  </label>
                  <input
                    id={nameId}
                    ref={nameRef}
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("name_placeholder")}
                    dir="auto"
                    className="w-full h-12 px-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:bg-background text-base transition-colors"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor={emailId} className="text-xs font-semibold text-muted-foreground ps-1">
                  {t("email_label")}
                </label>
                <input
                  id={emailId}
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="name@example.com"
                  dir="ltr"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                  className={cn(
                    "w-full h-12 px-4 rounded-2xl bg-secondary/50 border text-base transition-colors text-start",
                    fieldErrors.email
                      ? "border-destructive focus:border-destructive"
                      : "border-border focus:border-primary focus:bg-background"
                  )}
                />
                {fieldErrors.email && (
                  <p id={emailErrorId} role="alert" className="text-xs text-destructive ps-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {mode !== "forgot" && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor={passwordId} className="text-xs font-semibold text-muted-foreground">
                      {t("password_label")}
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-primary font-semibold hover:underline min-h-[44px] inline-flex items-center"
                      >
                        {t("forgot_password_q")}
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id={passwordId}
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="••••••••"
                      dir="ltr"
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
                      className={cn(
                        "w-full h-12 ps-4 pe-12 rounded-2xl bg-secondary/50 border text-base transition-colors text-start",
                        fieldErrors.password
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary focus:bg-background"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={t(showPassword ? "hide_password" : "show_password")}
                      aria-pressed={showPassword}
                      className="absolute end-1 size-11 grid place-items-center text-muted-foreground hover:text-foreground transition-colors rounded-xl"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p id={passwordErrorId} role="alert" className="text-xs text-destructive ps-1">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-1 w-full h-12 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : mode === "login" ? (
                  <>
                    <LogIn className="size-4" strokeWidth={2.4} />
                    <span>{t("login")}</span>
                  </>
                ) : mode === "signup" ? (
                  <>
                    <UserPlus className="size-4" strokeWidth={2.4} />
                    <span>{t("signup_btn")}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" strokeWidth={2.4} />
                    <span>{t("send_reset_link")}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Toggle between Login, Signup, and Forgot */}
        <div className="flex flex-col gap-2 pt-1 text-xs text-muted-foreground">
          {mode === "login" ? (
            <p>
              {t("no_account_q")}{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-primary font-bold hover:underline min-h-[44px] inline-flex items-center px-1"
              >
                {t("create_account")}
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-primary font-bold hover:underline inline-flex items-center justify-center gap-1 min-h-[44px] px-2"
            >
              <ArrowRight className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
              {t("back_to_login")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
