"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

/** React Bits — ShinyText: sweeping sheen across text without affecting underlying layout */
export function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = "",
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent relative",
        !disabled && "nutra-shine",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(110deg, currentColor 35%, rgba(255,255,255,0.9) 50%, currentColor 65%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
}
