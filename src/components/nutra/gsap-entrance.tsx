"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface GsapEntranceProps {
  children: React.ReactNode;
  tabKey: string;
}

/** GSAP page-load and tab-switch staggered card entrance animation with automatic scope cleanup */
export function GsapEntrance({ children, tabKey }: GsapEntranceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;

      // Honor prefers-reduced-motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const cards = containerRef.current?.querySelectorAll(".nutra-card");
      if (!cards || cards.length === 0) return;

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 12,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    },
    { scope: containerRef, dependencies: [tabKey], revertOnUpdate: true }
  );

  return (
    <div ref={containerRef} className="w-full">
      {children}
    </div>
  );
}
