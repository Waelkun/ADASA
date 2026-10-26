"use client";

import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

/** React Bits — CountUp: lightweight number interpolation adhering strictly to prefers-reduced-motion */
export function CountUp({
  to,
  from = 0,
  duration = 800,
  decimals = 0,
  className = "",
}: CountUpProps) {
  const { nf } = useI18n();
  const [value, setValue] = useState(from);
  const prevToRef = useRef(from);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      prevToRef.current = to;
      return;
    }

    const startValue = prevToRef.current;
    const diff = to - startValue;
    if (diff === 0) return;

    let startTime: number | null = null;
    let animId: number;

    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + diff * easedProgress;

      setValue(decimals === 0 ? Math.round(current) : Number(current.toFixed(decimals)));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        prevToRef.current = to;
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [to, duration, decimals]);

  return <span className={className}>{nf(value, decimals)}</span>;
}
