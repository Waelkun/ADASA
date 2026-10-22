"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useI18n } from "@/lib/i18n";

/** shared bottom-sheet shell */
export function SheetShell({
  open,
  onOpenChange,
  title,
  children,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent
        className="mx-auto max-w-md rounded-t-[28px] border-t border-border bg-card focus:outline-none"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DrawerTitle>{title}</DrawerTitle>
        </VisuallyHidden>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className={`px-5 pt-3 pb-[max(env(safe-area-inset-bottom),20px)] ${contentClassName ?? ""}`}>
          <h2 className="text-base font-bold mb-4 text-center">{title}</h2>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
