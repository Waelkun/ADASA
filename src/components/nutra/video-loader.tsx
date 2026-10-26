"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface VideoLoaderProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

/** Branded video loader for Adasa featuring the custom 3D aperture animation */
export function VideoLoader({
  message = "جاري التحميل...",
  className,
  fullScreen = true,
}: VideoLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
      <div className="relative size-44 sm:size-52 md:size-60 rounded-[32px] overflow-hidden shadow-2xl shadow-black/50 border border-emerald-500/20 bg-[#0e1713]">
        <video
          src="/loading-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col items-center gap-2 mt-1">
        <span className="text-sm font-bold text-foreground/90 tracking-wide">
          {message}
        </span>
        <span className="h-1 w-12 rounded-full bg-primary/40 animate-pulse" />
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex items-center justify-center p-6", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 bg-[#0a110e] flex items-center justify-center p-6 nutra-anim-in",
        className
      )}
    >
      {content}
    </div>
  );
}
