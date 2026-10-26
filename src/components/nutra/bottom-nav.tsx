"use client";

import React, { useRef, useState } from "react";
import { Plus, CalendarDays, ClipboardList, Target, TrendingUp, Dumbbell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; icon: React.ElementType; key: DictKey }[] = [
  { id: "today", icon: CalendarDays, key: "tab_today" },
  { id: "log", icon: ClipboardList, key: "tab_log" },
  { id: "goals", icon: Target, key: "tab_goals" },
  { id: "progress", icon: TrendingUp, key: "tab_progress" },
  { id: "workouts", icon: Dumbbell, key: "tab_workouts" },
];

/** springy overshoot easing (iOS-like) */
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const ANIM_MS = 260;
/** px of movement before a press becomes a drag */
const DRAG_SLOP = 6;

function haptic(ms = 10) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported device — noop */
  }
}

/**
 * Liquid-glass bottom dock (iOS 26 style):
 * - glass capsule (backdrop blur) with 5 equal tabs (RTL: اليوم first on the right)
 * - separate glass + button beside the capsule, same height, group centered
 * - active-tab bubble: CSS-calc cell position (no measurement), spring slide,
 *   scales ~1.15 on press
 * - press & drag: bubble follows the finger (setPointerCapture + touch-action:none),
 *   the page switches live, and it snaps to the nearest tab on release (vibrate(10))
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function BottomNav() {
  const { t, isRTL } = useI18n();
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const openSheet = useAppStore((s) => s.openSheet);
  // bubble stays on the last main-nav tab while Settings (header) is open
  const lastNavTab = useAppStore((s) => s.lastNavTab);
  const navIdx = TABS.findIndex((x) => x.id === tab);
  const lastIdx = TABS.findIndex((x) => x.id === lastNavTab);
  const activeIdx = navIdx >= 0 ? navIdx : lastIdx >= 0 ? lastIdx : 0;

  const capsuleRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /** px override while the finger owns the bubble; null = measured cell position */
  const [dragBubble, setDragBubble] = useState<{ x: number; w: number } | null>(null);
  /** measured resting position of the ACTIVE tab — always physical px from the
   *  capsule's left edge (x = tabRect.left - pillRect.left), never index/percent/dir math */
  const [restBubble, setRestBubble] = useState<{ x: number; w: number } | null>(null);
  const [pressed, setPressed] = useState(false);
  /** spring transition on; off while tracking the finger */
  const [anim, setAnim] = useState(true);

  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const press = useRef<{ startX: number; baseX: number; w: number } | null>(null);

  /** measure the active tab cell — the single source of truth for the bubble */
  const measure = React.useCallback(() => {
    const cap = capsuleRef.current;
    const btn = tabRefs.current[activeIdx];
    if (!cap || !btn) return;
    const capR = cap.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    setRestBubble({ x: r.left - capR.left, w: r.width });
  }, [activeIdx]);

  // (re)measure on first render, on every tab/language switch, and on any
  // element resize (window rotate, font swap, capsule width change)
  useIsomorphicLayoutEffect(() => {
    measure();
    const cap = capsuleRef.current;
    if (!cap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(cap);
    tabRefs.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [measure, isRTL]);

  /** current tab index — read inside event handlers only */
  const curIdx = () => {
    const cur = useAppStore.getState().tab;
    const i = TABS.findIndex((x) => x.id === cur);
    return i >= 0 ? i : activeIdx;
  };

  /** index of the tab whose center is nearest to a point */
  const nearestTab = (centerX: number, fromIdx: number) => {
    let best = fromIdx;
    let bestD = Infinity;
    tabRefs.current.forEach((btn, i) => {
      if (!btn) return;
      const c = btn.offsetLeft + btn.offsetWidth / 2;
      const d = Math.abs(c - centerX);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPressed(true);
    const btn = tabRefs.current[curIdx()];
    press.current = {
      startX: e.clientX,
      baseX: btn?.offsetLeft ?? 0,
      w: btn?.offsetWidth ?? 0,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = press.current;
    const cap = capsuleRef.current;
    if (!st || !cap) return;
    const dx = e.clientX - st.startX;
    if (!dragging.current && Math.abs(dx) > DRAG_SLOP) {
      dragging.current = true;
      setAnim(false); // the finger owns the bubble now
      haptic(10);
      // jump the bubble under the finger, then track it 1:1
      const capR = cap.getBoundingClientRect();
      const fingerX = e.clientX - capR.left;
      const baseX = Math.min(Math.max(fingerX - st.w / 2, 0), Math.max(0, cap.offsetWidth - st.w));
      st.baseX = baseX;
      st.startX = e.clientX;
      setDragBubble({ x: baseX, w: st.w });
      // live switch to whatever tab is under the finger now
      const from0 = curIdx();
      const near0 = nearestTab(baseX + st.w / 2, from0);
      if (near0 !== from0) {
        setTab(TABS[near0].id);
        haptic(10);
      }
      return;
    }
    if (!dragging.current) return;
    const capW = cap.offsetWidth;
    const x = Math.min(Math.max(st.baseX + (e.clientX - st.startX), 0), Math.max(0, capW - st.w));
    setDragBubble({ x, w: st.w });
    // live page switching while dragging
    const from = curIdx();
    const near = nearestTab(x + st.w / 2, from);
    if (near !== from) {
      setTab(TABS[near].id);
      haptic(10);
    }
  };

  const endPointer = () => {
    const wasDrag = dragging.current;
    setPressed(false);
    press.current = null;
    dragging.current = false;
    if (wasDrag) {
      suppressClick.current = true;
      setAnim(true);
      setDragBubble(null); // spring-snap to the nearest tab's cell
      haptic(10);
    }
  };

  // bubble geometry: measured from the live DOM (physical px, left:0 anchor)
  const bubble = dragBubble ?? restBubble ?? { x: 0, w: 0 };

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 z-40">
      <div className="mx-auto max-w-md px-3 sm:px-4 pb-[var(--dock-bottom-offset)]">
        {/* centered group: glass capsule + separate + button (8px gap, same height) */}
        <div className="flex items-center gap-2">
          <div
            ref={capsuleRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onLostPointerCapture={endPointer}
            style={{ touchAction: "none" }}
            className="relative flex-1 min-w-0 h-14 rounded-full bg-card/70 backdrop-blur-[20px] backdrop-saturate-[1.8] border border-border shadow-[0_10px_32px_rgba(16,24,40,0.14)] overflow-hidden"
          >
            {/* sliding active bubble (spring) — physical x, explicit left:0 anchor */}
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 left-0 rounded-full bg-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(16,24,40,0.08)]"
              style={{
                width: `${bubble.w}px`,
                zIndex: 0,
                transform: `translateX(${bubble.x}px) scale(${pressed ? 1.15 : 1})`,
                transition: anim
                  ? `transform ${ANIM_MS}ms ${SPRING}, width ${ANIM_MS}ms ${SPRING}`
                  : "none",
              }}
            />
            <div className="absolute inset-0 flex px-1.5">
              {TABS.map((tb, i) => {
                const active = activeIdx === i;
                return (
                  <button
                    key={tb.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false; // swallow the click after a drag
                        return;
                      }
                      setAnim(true);
                      setDragBubble(null);
                      setTab(tb.id);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-[1] flex-1 min-w-0 min-h-[44px] my-0.5 flex flex-col items-center justify-center gap-0.5 rounded-full transition-colors",
                      active ? "text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    <tb.icon className="size-[20px]" strokeWidth={active ? 2.4 : 2} />
                    <span className="text-[11px] font-bold leading-tight truncate px-0.5">{t(tb.key)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* separate glass + button (opens quick add) */}
          <button
            onClick={() => openSheet("quick-add")}
            aria-label={t("quick_add")}
            className="size-14 shrink-0 rounded-full bg-primary/95 backdrop-blur-[20px] backdrop-saturate-[1.8] text-primary-foreground border border-white/25 shadow-[0_10px_28px_rgba(16,185,129,0.4)] grid place-items-center active:scale-95 transition-transform"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </nav>
  );
}
