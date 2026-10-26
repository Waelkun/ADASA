import React from "react";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#0a110e] flex items-center justify-center p-6"
    >
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
          <span className="text-sm font-bold text-[#eef4f1] tracking-wide">
            جاري التحميل...
          </span>
          <span className="h-1 w-12 rounded-full bg-emerald-500/50 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
