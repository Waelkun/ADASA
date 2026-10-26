"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "./supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (
    email: string,
    pass: string,
    displayName?: string
  ) => Promise<{ error: AuthError | Error | null; session: Session | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, session: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

let warnedMissingConfig = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!configured) {
      if (!warnedMissingConfig) {
        warnedMissingConfig = true;
        console.warn(
          "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set. Auth operates in unconfigured mode."
        );
      }
      return;
    }

    let mounted = true;
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch (err) {
      if (!warnedMissingConfig) {
        warnedMissingConfig = true;
        console.warn("Supabase client init warning:", err);
      }
      queueMicrotask(() => {
        if (mounted) setLoading(false);
      });
      return;
    }

    // 1. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (!warnedMissingConfig) {
          warnedMissingConfig = true;
          console.warn("Supabase getSession error:", err);
        }
        if (mounted) setLoading(false);
      });

    // 2. React to auth events (login, logout, refresh, OAuth)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const missingEnvError = () =>
    new Error(
      "لم يتم العثور على متغيرات الاتصال بـ Supabase. يرجى إنشاء ملف .env.local وضبط NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY ثم إعادة تشغيل السيرفر."
    );

  const signIn = async (email: string, pass: string) => {
    if (!isSupabaseConfigured()) {
      return { error: missingEnvError() };
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    if (!isSupabaseConfigured()) {
      return { error: missingEnvError(), session: null };
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: displayName?.trim() || "مستخدم عدسة",
          },
        },
      });
      return { error, session: data.session };
    } catch (err: any) {
      return { error: err, session: null };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { error: missingEnvError() };
    }
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      return;
    }
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("SignOut error:", e);
    }
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: missingEnvError() };
    }
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: origin,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Translates common Supabase auth errors into clean Arabic text */
export function getAuthErrorMessage(err: Error | AuthError | string | null, lang: "ar" | "en" = "ar"): string {
  if (!err) return "";
  const msg = typeof err === "string" ? err : err.message || "";
  const lower = msg.toLowerCase();
  const isEn = lang === "en";

  if (lower.includes("missing supabase environment variables") || lower.includes("متغيرات الاتصال")) {
    return isEn
      ? "Supabase environment variables not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the server."
      : "لم يتم العثور على متغيرات الاتصال بـ Supabase. يرجى التأكد من إضافة NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local ثم إعادة تشغيل السيرفر.";
  }
  if (lower.includes("unsupported provider") || lower.includes("provider is not enabled") || lower.includes("validation_failed")) {
    return isEn
      ? "Google Sign In is not yet enabled in the Supabase dashboard. Please enable it in Authentication -> Providers -> Google."
      : "تسجيل الدخول عبر Google غير مفعّل بعد في لوحة تحكم Supabase. يرجى تفعيله من Authentication -> Providers -> Google.";
  }
  if (lower.includes("invalid login credentials")) {
    return isEn ? "Invalid email or password." : "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (lower.includes("email not confirmed")) {
    return isEn
      ? "Please confirm your email using the link sent to your inbox first."
      : "يرجى تأكيد بريدك الإلكتروني عبر الرابط المرسل إليك أولاً.";
  }
  if (lower.includes("user already registered")) {
    return isEn ? "An account with this email already exists." : "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.";
  }
  if (lower.includes("password should be at least") || lower.includes("weak password")) {
    return isEn ? "Password must be at least 6 characters." : "كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return isEn
      ? "Too many attempts. Please wait a moment and try again."
      : "تجاوزت الحد المسموح من المحاولات، يرجى الانتظار قليلاً والمحاولة مجدداً.";
  }
  if (lower.includes("invalid email")) {
    return isEn ? "Invalid email address format." : "صيغة البريد الإلكتروني غير صحيحة.";
  }
  return isEn
    ? "An error occurred while processing your request. Please try again."
    : "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مجدداً.";
}
