"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

/** small stat card with label + value + optional delta chip */
export function StatCard({
  label,
  value,
  unit,
  delta,
  invertDelta = false,
  className,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  /** signed change; sign shown with arrow */
  delta?: number;
  /** true when a positive delta is bad (e.g. weight on a cut) */
  invertDelta?: boolean;
  className?: string;
  icon?: React.ReactNode;
}) {
  const showDelta = delta != null && Number.isFinite(delta) && delta !== 0;
  const good = showDelta ? (delta! > 0) !== invertDelta : true;
  return (
    <div className={cn("nutra-card p-4 flex flex-col gap-1 min-w-0", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="nutra-hero-num text-xl tabular">{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {showDelta && (
        <span
          className={cn(
            "nutra-chip w-fit mt-0.5",
            good ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative"
          )}
        >
          {delta! > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(delta!).toLocaleString("en-US", { maximumFractionDigits: 1 })}
        </span>
      )}
    </div>
  );
}

/** big hero number with delta chip underneath (finance-app style) */
export function HeroNumber({
  value,
  unit,
  caption,
  delta,
  invertDelta = false,
  className,
}: {
  value: string;
  unit?: string;
  caption?: string;
  delta?: number;
  invertDelta?: boolean;
  className?: string;
}) {
  const showDelta = delta != null && Number.isFinite(delta) && delta !== 0;
  const good = showDelta ? (delta! > 0) !== invertDelta : true;
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="nutra-hero-num text-4xl md:text-5xl tabular">{value}</span>
        {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>
      {caption && <span className="text-[13px] font-medium text-muted-foreground mt-1">{caption}</span>}
      {showDelta && (
        <span
          className={cn(
            "nutra-chip w-fit mt-2",
            good ? "bg-positive/12 text-positive" : "bg-negative/12 text-negative"
          )}
        >
          {delta! > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {Math.abs(delta!).toLocaleString("en-US", { maximumFractionDigits: 1 })}
        </span>
      )}
    </div>
  );
}
