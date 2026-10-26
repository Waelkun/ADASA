"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Free-typing numeric input (item: NumInput):
 * - while focused you can type/delete freely, including a decimal point
 *   ("." "," "٫" all accepted) — nothing is clamped per keystroke
 * - the value is committed (parsed → clamped to [min,max] → rounded) on blur
 *   or Enter
 * - controlled by a number (or "" when allowEmpty)
 */
export function NumInput({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  decimals = 0,
  allowEmpty = false,
  placeholder,
  className,
  ariaLabel,
  inputMode = "decimal",
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  inputMode?: "decimal" | "numeric";
}) {
  const [editing, setEditing] = useState(false);
  // draft text while the field is focused (free typing, no clamping)
  const [draft, setDraft] = useState("");

  const clamp = (n: number) => {
    const c = Math.min(max, Math.max(min, n));
    const p = 10 ** decimals;
    return Math.round(c * p) / p;
  };

  /** parse + clamp + report; returns the display text to fall back to */
  const commit = (raw: string) => {
    const cleaned = raw.replace(/[٫,]/g, ".").replace(/\s/g, "");
    if (cleaned === "") {
      if (allowEmpty) {
        onChange("");
        return "";
      }
      const fallback = value === "" ? String(min) : String(value);
      return fallback;
    }
    const n = Number(cleaned);
    if (!Number.isFinite(n)) {
      return value === "" ? String(min) : String(value);
    }
    const v = clamp(n);
    onChange(v);
    return String(v);
  };

  // display: the free-typing draft while focused, the committed value otherwise
  const display = editing ? draft : value === "" ? "" : String(value);

  return (
    <input
      value={display}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => {
        setDraft(value === "" ? "" : String(value));
        setEditing(true);
        e.target.select();
      }}
      onBlur={() => {
        setEditing(false);
        // keep the committed text as the next draft (covers the revert case)
        setDraft(commit(draft));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      inputMode={inputMode}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={cn(
        "min-w-0 text-base font-bold tabular bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-2xl",
        className
      )}
    />
  );
}
