"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SPLASH_KEY = "nutra-splash-v1";
const MIN_MS = 1600;
const MAX_MS = 6000;

type Phase = "iris" | "click" | "flash" | "morph" | "hold" | "out";

const subscribeNoop = () => () => {};
/** true only on a cold start (refresh within the tab session skips the splash) */
export function useColdStart() {
  return useSyncExternalStore(
    subscribeNoop,
    () => {
      try {
        return !sessionStorage.getItem(SPLASH_KEY);
      } catch {
        return true;
      }
    },
    () => true
  );
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
    <div aria-hidden className="nutra-splash" style={{ opacity: phase === "out" ? 0 : 1 }}>
      <div className="nutra-splash-stage" data-p={phase}>
        <div className="nutra-aperture">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="blade" style={{ "--i": i } as React.CSSProperties} />
          ))}
          <span className="nutra-flash" />
          <img src="/logo.svg" alt="" className="nutra-splash-logo" />
        </div>
        <p className="nutra-splash-name">Nutra</p>
      </div>
    </div>
  );
}
