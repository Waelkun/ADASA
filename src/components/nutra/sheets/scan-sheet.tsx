"use client";

import React, { useRef, useState } from "react";
import { Camera, Images, Loader2, RefreshCw, ScanLine, AlertTriangle, Wand2, PencilLine } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { useScan } from "@/lib/api";
import type { ScanResult } from "@/lib/types";
import { SheetShell } from "./sheet-shell";

/** compress an image file client-side: max 1024px, JPEG 0.7 (target < 100 KB) */
async function compressImage(file: File, maxDim = 1024, quality = 0.7): Promise<string> {
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
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    // If still large (>150,000 characters ~110 KB), reduce quality to stay safely within NVIDIA limits
    if (dataUrl.length > 150_000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    }
    return dataUrl;
  } finally {
    bitmap.close?.();
  }
}

/** allowed photo types (item: gallery type check) */
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const OK_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
function photoTypeOk(file: File): boolean {
  // some browsers report an empty type for HEIC — fall back to the extension
  return OK_TYPES.includes(file.type) || (!file.type && OK_EXT.test(file.name));
}

/** downscale any image source (data URL / URL) to a small square-ish thumbnail: 200px, JPEG 0.5 (~15-20 KB) */
async function makeThumbnail(src: string, maxDim = 200, quality = 0.5): Promise<string | null> {
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

type ScanErrorKind =
  | "no_label"
  | "unparseable"
  | "vision_failed"
  | "bad_image"
  | "bad_type"
  | "payload_too_large"
  | "daily_limit_exceeded"
  | "generic";

export function ScanSheet({ onResult }: { onResult: (r: ScanResult, thumb: string | null) => void }) {
  const { t } = useI18n();
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  const openSheet = useAppStore((s) => s.openSheet);

  const [labelImg, setLabelImg] = useState<string | null>(null);
  const [frontImg, setFrontImg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<ScanErrorKind | null>(null);
  const [customErrorMsg, setCustomErrorMsg] = useState<string | null>(null);
  const labelInput = useRef<HTMLInputElement>(null);
  const frontInput = useRef<HTMLInputElement>(null);
  const labelGallery = useRef<HTMLInputElement>(null);
  const frontGallery = useRef<HTMLInputElement>(null);
  const scan = useScan();

  const pick = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!photoTypeOk(file)) {
      setError("bad_type");
      setCustomErrorMsg(null);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("bad_image");
      setCustomErrorMsg(null);
      return;
    }
    setError(null);
    setCustomErrorMsg(null);
    try {
      setter(await compressImage(file));
    } catch {
      setError("generic");
    }
  };

  const analyze = async () => {
    if (!labelImg) return;
    setError(null);
    setCustomErrorMsg(null);
    scan.mutate(
      { labelImage: labelImg, frontImage: frontImg ?? undefined, note: note.trim() || undefined },
      {
        onSuccess: async (r) => {
          // small compressed thumbnail kept with the entry (front photo preferred)
          const thumb = await makeThumbnail(frontImg ?? labelImg);
          onResult(r, thumb);
          setLabelImg(null);
          setFrontImg(null);
          setNote("");
          setCustomErrorMsg(null);
        },
        onError: (e: Error & { payload?: { error?: string; message?: string } }) => {
          const code = e.payload?.error;
          const msg = e.payload?.message;
          if (msg) setCustomErrorMsg(msg);

          if (code === "daily_limit_exceeded") {
            setError("daily_limit_exceeded");
          } else if (code === "payload_too_large") {
            setError("payload_too_large");
          } else if (code === "no_label") {
            setError("no_label");
          } else if (code === "bad_image") {
            setError("bad_image");
          } else if (code === "vision_failed") {
            setError("vision_failed");
          } else {
            setError("generic");
          }
        },
      }
    );
  };

  const errorText = () => {
    if (customErrorMsg) return customErrorMsg;
    switch (error) {
      case "daily_limit_exceeded":
        return t("scan_error_limit");
      case "payload_too_large":
        return t("scan_error_payload");
      case "no_label":
        return t("scan_error_no_label");
      case "bad_type":
        return t("scan_error_type");
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
      {/* photo slots: nutrition-label photo + meal/product photo —
          each accepts camera or gallery import (same compression + analysis path) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <PhotoSlot
          title={t("label_photo")}
          hint={t("label_photo_hint")}
          img={labelImg}
          required
          onCamera={() => labelInput.current?.click()}
          onGallery={() => labelGallery.current?.click()}
          onClear={() => setLabelImg(null)}
        />
        <PhotoSlot
          title={t("front_photo")}
          hint={t("front_photo_hint")}
          img={frontImg}
          onCamera={() => frontInput.current?.click()}
          onGallery={() => frontGallery.current?.click()}
          onClear={() => setFrontImg(null)}
        />
      </div>

      {/* camera capture (environment) */}
      <input
        ref={labelInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e, setLabelImg)}
        aria-hidden
      />
      <input
        ref={frontInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e, setFrontImg)}
        aria-hidden
      />
      {/* gallery import (no capture) */}
      <input
        ref={labelGallery}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => pick(e, setLabelImg)}
        aria-hidden
      />
      <input
        ref={frontGallery}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => pick(e, setFrontImg)}
        aria-hidden
      />

      {/* optional description / weight hint (trusted by the AI) — RTL textarea, 500 chars */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("scan_note_field")}
        aria-label={t("scan_note_field")}
        maxLength={500}
        rows={2}
        className="w-full rounded-[18px] bg-card border border-border px-4 py-3 mb-4 text-base font-medium leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none nutra-scroll shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
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
            {error === "daily_limit_exceeded" ? (
              <button
                type="button"
                onClick={() => {
                  closeSheet();
                  openSheet("manual-food");
                }}
                className="mt-2.5 h-10 px-4 rounded-full bg-negative/20 text-negative text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <PencilLine className="size-3.5" />
                {t("manual_entry")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => analyze()}
                className="mt-2.5 h-10 px-4 rounded-full bg-negative/20 text-negative text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <RefreshCw className="size-3.5" />
                {t("retry")}
              </button>
            )}
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
            onClick={() => analyze()}
            disabled={!labelImg}
            className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40 shadow-lg shadow-primary/25"
          >
            <Wand2 className="size-5" />
            {t("analyze")}
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
  onCamera,
  onGallery,
  onClear,
  required,
}: {
  title: string;
  hint: string;
  img: string | null;
  onCamera: () => void;
  onGallery: () => void;
  onClear: () => void;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold">{title}</span>
        {required && (
          <span className="size-1.5 rounded-full bg-negative" aria-label={t("required")} />
        )}
      </div>
      {img ? (
        <button
          onClick={onClear}
          className="relative aspect-[3/4] rounded-[20px] overflow-hidden border-2 border-primary/50 transition-all"
          aria-label={t("retake")}
        >
          <img src={img} alt={title} className="absolute inset-0 size-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 py-1.5 text-xs font-bold text-white bg-black/45 text-center backdrop-blur-sm leading-normal">
            {t("retake")}
          </span>
        </button>
      ) : (
        <div className="relative aspect-[3/4] rounded-[20px] border-2 border-dashed border-border bg-secondary/50 flex items-center justify-center p-2">
          <div className="flex flex-col items-stretch justify-center gap-2 w-full max-w-[128px]">
            <button
              type="button"
              onClick={onCamera}
              aria-label={t("take_photo")}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-2 rounded-full bg-card border border-border text-xs font-bold text-foreground shadow-sm active:scale-95 transition-transform"
            >
              <Camera className="size-4 shrink-0 text-primary" />
              <span>{t("camera")}</span>
            </button>
            <button
              type="button"
              onClick={onGallery}
              aria-label={t("from_gallery")}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-2 rounded-full bg-card border border-border text-xs font-bold text-foreground shadow-sm active:scale-95 transition-transform"
            >
              <Images className="size-4 shrink-0 text-water" />
              <span className="truncate">{t("from_gallery")}</span>
            </button>
          </div>
        </div>
      )}
      <span className="text-xs text-muted-foreground text-center leading-relaxed">{hint}</span>
    </div>
  );
}
