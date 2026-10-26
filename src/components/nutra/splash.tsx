"use client";

import React, { useEffect, useRef, useState } from "react";

const SPLASH_KEY = "nutra-splash-v1";
const MIN_MS = 1600;
const MAX_MS = 6000;

type Phase = "iris" | "click" | "flash" | "morph" | "hold" | "out";

/** true only on a cold start (refresh within the tab session skips the splash) */
export function useColdStart() {
  const [cold, setCold] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        setCold(!sessionStorage.getItem(SPLASH_KEY));
      } catch {
        setCold(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return cold;
}

/**
 * Cold-start splash — camera lens:
 * aperture blades swing in → shutter click → light flash → morph into the app icon.
 * Dismissed after ≥1.6s AND profile readiness (hard cap 6s).
 * Background/accents match the manifest (background_color/theme_color).
 */
export function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("iris");
  const t0 = useRef(0);
  const finished = useRef(false);
  // captured once — the parent callback only flips a boolean setter
  const doneRef = useRef(onDone);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    // mark this tab session as “splash seen” only at the END — writing it at
    // mount would poison the useSyncExternalStore cold-start check above
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* storage blocked — a refresh will just replay the splash */
    }
    setPhase("out");
    window.setTimeout(() => doneRef.current(), 220);
  }

  // phase timeline + hard safety cap (pure timers)
  useEffect(() => {
    t0.current = performance.now();
    const ids = [
      window.setTimeout(() => setPhase("click"), 700),
      window.setTimeout(() => setPhase("flash"), 840),
      window.setTimeout(() => setPhase("morph"), 1020),
      window.setTimeout(() => setPhase("hold"), 1500),
      window.setTimeout(() => finish(), MAX_MS),
    ];
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, []);

  // dismiss once the profile is ready — never sooner than MIN_MS
  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, MIN_MS - (performance.now() - t0.current));
    const id = window.setTimeout(() => finish(), wait);
    return () => window.clearTimeout(id);
  }, [ready]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-50 bg-[#0a110e] flex items-center justify-center p-6 transition-opacity duration-300"
      style={{ opacity: phase === "out" ? 0 : 1 }}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
        <div className="relative size-52 sm:size-60 md:size-64 rounded-[36px] overflow-hidden shadow-2xl shadow-black/60 border border-emerald-500/20 bg-[#0e1713]">
          <video
            src="/loading-animation.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
        <span className="h-1 w-12 rounded-full bg-emerald-500/50 animate-pulse mt-1" />
      </div>
    </div>
  );
}
