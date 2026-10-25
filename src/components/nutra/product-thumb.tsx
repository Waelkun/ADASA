"use client";

import React, { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fixed-size rounded thumbnail beside a food/entry name.
 * Falls back to a default icon (same size) when no image or on load error,
 * so row layout never shifts. Lazy-loaded.
 */
export function ProductThumb({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  return (
    <span
      aria-hidden
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-secondary grid place-items-center",
        className ?? "size-11"
      )}
    >
      {src && !err ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setErr(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <UtensilsCrossed className="size-5 text-muted-foreground/50" />
      )}
    </span>
  );
}
