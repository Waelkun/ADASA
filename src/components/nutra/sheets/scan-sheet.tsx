"use client";

import React, { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RefreshCw, ScanLine, AlertTriangle, Wand2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useScan } from "@/lib/api";
import type { ScanResult } from "@/lib/types";
import { SheetShell } from "./sheet-shell";
import { cn } from "@/lib/utils";

/** compress an image file client-side: max 1600px, JPEG 0.8 */
async function compressImage(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close?.();
  }
}

/** downscale any image source (data URL / URL) to a small square-ish thumbnail: 256px, JPEG 0.7 */
async function makeThumbnail(src: string, maxDim = 256, quality = 0.7): Promise<string | null> {
  try {
    const blob = await (await fetch(src)).blob();
    const bitmap = await createImageBitmap(blob);
    try {
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL("image/jpeg", quality);
    } finally {
      bitmap.close?.();
    }
  } catch {
    return null;
  }
}

type ScanErrorKind = "no_label" | "unparseable" | "vision_failed" | "bad_image" | "generic";

export function ScanSheet({ onResult }: { onResult: (r: ScanResult, thumb: string | null) => void }) {
  const { t } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const openSheet = useAppStore((s) => s.openSheet);

  const [labelImg, setLabelImg] = useState<string | null>(null);
  const [frontImg, setFrontImg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<ScanErrorKind | null>(null);
  const labelInput = useRef<HTMLInputElement>(null);
  const frontInput = useRef<HTMLInputElement>(null);
  const scan = useScan();

  const pick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("bad_image");
      return;
    }
    setError(null);
    try {
      setter(await compressImage(file));
    } catch {
      setError("generic");
    }
  };

  const analyze = async (demo = false) => {
    if (!demo && !labelImg) return;
    setError(null);
    scan.mutate(
      demo
        ? { demo: true, note: note.trim() || undefined }
        : { labelImage: labelImg!, frontImage: frontImg ?? undefined, note: note.trim() || undefined },
      {
        onSuccess: async (r) => {
          // small compressed thumbnail kept with the entry (front photo preferred)
          let thumb: string | null = null;
          if (demo) {
            thumb = await makeThumbnail("/demo/front.png");
          } else {
            thumb = await makeThumbnail(frontImg ?? labelImg!);
          }
          onResult(r, thumb);
          setLabelImg(null);
          setFrontImg(null);
          setNote("");
        },
        onError: (e: Error & { payload?: { error?: string } }) => {
          const code = e.payload?.error;
          setError(
            code === "no_label"
              ? "no_label"
              : code === "unparseable"
                ? "no_label"
                : code === "bad_image"
                  ? "bad_image"
                  : code === "vision_failed"
                    ? "vision_failed"
                    : "generic"
          );
        },
      }
    );
  };

  const errorText = () => {
    switch (error) {
      case "no_label":
        return t("scan_error_no_label");
      case "bad_image":
        return t("scan_error_size");
      case "vision_failed":
      case "unparseable":
        return t("scan_error_generic");
      default:
        return t("scan_error_generic");
    }
  };

  return (
    <SheetShell
      open={sheet === "scan"}
      onOpenChange={(o) => {
        if (!o) {
          closeSheet();
          setLabelImg(null);
          setFrontImg(null);
          setError(null);
        }
      }}
      title={t("scan_title")}
    >
      {/* photo slots */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <PhotoSlot
          title={t("label_photo")}
          hint={t("label_photo_hint")}
          img={labelImg}
          required
          onPick={() => labelInput.current?.click()}
          onClear={() => setLabelImg(null)}
        />
        <PhotoSlot
          title={t("front_photo")}
          hint={t("front_photo_hint")}
          img={frontImg}
          onPick={() => frontInput.current?.click()}
          onClear={() => setFrontImg(null)}
        />
      </div>

      <input
        ref={labelInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e, setLabelImg)}
        aria-hidden
      />
      <input
        ref={frontInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e, setFrontImg)}
        aria-hidden
      />

      {/* optional description / weight hint (trusted by the AI) */}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("scan_note_field")}
        aria-label={t("scan_note_field")}
        maxLength={200}
        className="w-full h-12 rounded-full bg-card border border-border px-5 text-sm font-medium mb-4 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      />

      {/* error */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-4 rounded-[18px] bg-negative/10 flex items-start gap-3 text-start"
        >
          <AlertTriangle className="size-5 text-negative shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-negative">{errorText()}</p>
            <button
              onClick={() => analyze(!!scan.variables?.demo)}
              className="mt-2 nutra-chip bg-negative/15 text-negative gap-1"
            >
              <RefreshCw className="size-3" />
              {t("retry")}
            </button>
          </div>
        </div>
      )}

      {/* states */}
      {scan.isPending ? (
        <div className="py-10 flex flex-col items-center gap-3">
          <span className="relative size-16 grid place-items-center">
            <Loader2 className="size-16 text-primary animate-spin" strokeWidth={1.5} />
            <ScanLine className="size-6 text-primary absolute" />
          </span>
          <p className="text-sm font-bold">{t("analyzing")}</p>
          <p className="text-xs text-muted-foreground">{t("analyzing_hint")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => analyze(false)}
            disabled={!labelImg}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-primary/25"
          >
            <Wand2 className="size-5" />
            {t("analyze")}
          </button>
          <button
            onClick={() => analyze(true)}
            disabled={scan.isPending}
            className="w-full h-11 rounded-full bg-secondary text-xs font-semibold text-muted-foreground"
          >
            🧪 {t("try_demo")}
          </button>
          <button
            onClick={() => openSheet("manual-food")}
            className="w-full h-11 rounded-full text-xs font-semibold text-primary"
          >
            {t("manual_entry")} →
          </button>
        </div>
      )}
    </SheetShell>
  );
}

function PhotoSlot({
  title,
  hint,
  img,
  onPick,
  onClear,
  required,
}: {
  title: string;
  hint: string;
  img: string | null;
  onPick: () => void;
  onClear: () => void;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold">{title}</span>
        {required && (
          <span className="size-1.5 rounded-full bg-negative" aria-label="required" />
        )}
      </div>
      <button
        onClick={img ? onClear : onPick}
        className={cn(
          "relative aspect-[3/4] rounded-[20px] overflow-hidden border-2 border-dashed transition-all",
          img ? "border-primary/50" : "border-border hover:border-primary/40 bg-secondary/50"
        )}
        aria-label={img ? t("retake") : t("take_photo")}
      >
        {img ? (
          <>
            <img src={img} alt={title} className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 py-1.5 text-[10px] font-bold text-white bg-black/45 text-center backdrop-blur-sm">
              {t("retake")}
            </span>
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground px-2">
            <Camera className="size-6" />
            <span className="text-[10px] font-semibold flex items-center gap-1">
              <ImagePlus className="size-3" />
              {t("take_photo")}
            </span>
          </span>
        )}
      </button>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{hint}</span>
    </div>
  );
}
