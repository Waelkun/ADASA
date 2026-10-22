import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import ZAI from "z-ai-web-dev-sdk";
import { z } from "zod";
import { kcalSanityOk } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ---------- validation ---------- */

const nutrientsSchema = z.object({
  kcal: z.number().nullable().catch(null),
  protein_g: z.number().nullable().catch(null),
  carbs_g: z.number().nullable().catch(null),
  sugar_g: z.number().nullable().catch(null),
  fat_g: z.number().nullable().catch(null),
  sat_fat_g: z.number().nullable().catch(null),
  fiber_g: z.number().nullable().catch(null),
  salt_g: z.number().nullable().catch(null),
});

const scanSchema = z.object({
  product_name: z.string().nullable().catch(null),
  brand: z.string().nullable().catch(null),
  serving_size_g: z.number().nullable().catch(null),
  servings_per_container: z.number().nullable().catch(null),
  per_100g: nutrientsSchema.nullable().catch(null),
  per_serving: nutrientsSchema.nullable().catch(null),
  confidence: z.number().min(0).max(1).catch(0.5),
  notes: z.string().nullable().catch(null),
});

/* ---------- rate limiting (20 scans/hour) ---------- */

const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.reset < now) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ---------- helpers ---------- */

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp);base64,/;
const MAX_BYTES = 8 * 1024 * 1024;

function validImage(v: unknown): v is string {
  return typeof v === "string" && DATA_URL_RE.test(v) && v.length < MAX_BYTES * 1.4;
}

/** strip markdown fences and extract the outermost JSON object */
function extractJson(text: string): string | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return t.slice(start, end + 1);
}

const SYSTEM_PROMPT = `You are a precise nutrition-label OCR engine. You will receive product photos:
- The FIRST image is the nutrition facts label (back of package): the PRIMARY source of truth for all nutrition values.
- If a SECOND image is present, it shows the product front: use it ONLY for the product name and brand.

Read carefully. Labels may be in Arabic (القيمة الغذائية / معلومات غذائية) or English, or both. Convert kJ to kcal by dividing by 4.184 (round to integer). Distinguish "per 100g" / "per 100ml" columns from "per serving" / "per bar" / "per pack" columns; extract both when both are visible.

STRICT RULES:
- Return ONLY ONE valid JSON object. No markdown fences, no explanations, no extra keys.
- NEVER guess or estimate values that are not clearly visible: use null.
- All numbers must be non-negative. Round grams to 1 decimal max.
- confidence: 0.9+ only when the label is crisp and fully readable; 0.5-0.9 when partially readable; below 0.5 when blurry or the label is missing.
- notes: one short sentence about ambiguities (e.g. "energy in kJ, converted to kcal"), or null.

JSON schema (exact keys):
{
  "product_name": string|null,
  "brand": string|null,
  "serving_size_g": number|null,
  "servings_per_container": number|null,
  "per_100g": {"kcal": number|null,"protein_g": number|null,"carbs_g": number|null,"sugar_g": number|null,"fat_g": number|null,"sat_fat_g": number|null,"fiber_g": number|null,"salt_g": number|null},
  "per_serving": {"kcal": number|null,"protein_g": number|null,"carbs_g": number|null,"sugar_g": number|null,"fat_g": number|null,"sat_fat_g": number|null,"fiber_g": number|null,"salt_g": number|null},
  "confidence": number,
  "notes": string|null
}`;

/* ---------- POST /api/scan ---------- */

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "local";
    if (rateLimited(ip)) {
      return Response.json(
        { error: "rate_limited", message: "Too many scans this hour" },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let labelImage: string | null = body?.labelImage ?? null;
    let frontImage: string | null = body?.frontImage ?? null;
    const demo: boolean = !!body?.demo;

    // demo mode: use bundled sample product images (still runs through the real AI)
    if (demo) {
      const root = process.cwd();
      const [labelBuf, frontBuf] = await Promise.all([
        readFile(path.join(root, "public", "demo", "label.png")),
        readFile(path.join(root, "public", "demo", "front.png")),
      ]);
      labelImage = `data:image/png;base64,${labelBuf.toString("base64")}`;
      frontImage = `data:image/png;base64,${frontBuf.toString("base64")}`;
    }

    if (!validImage(labelImage)) {
      return Response.json(
        { error: "bad_image", message: "A valid label image (PNG/JPEG/WebP, max 8MB) is required" },
        { status: 400 }
      );
    }
    if (frontImage && !validImage(frontImage)) frontImage = null;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "image_url", image_url: { url: labelImage } },
    ];
    if (frontImage) content.push({ type: "image_url", image_url: { url: frontImage } });

    const zai = await ZAI.create();
    let completion: { choices?: Array<{ message?: { content?: string } }> };
    try {
      completion = await zai.chat.completions.createVision({
        messages: [{ role: "user", content }],
        thinking: { type: "disabled" },
      });
    } catch (e) {
      console.error("scan: vision call failed", e);
      return Response.json(
        { error: "vision_failed", message: "AI service unavailable" },
        { status: 502 }
      );
    }

    const raw = completion.choices?.[0]?.message?.content ?? "";
    const jsonStr = extractJson(raw);
    if (!jsonStr) {
      return Response.json(
        { error: "unparseable", message: "Could not parse AI response" },
        { status: 422 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch {
      return Response.json(
        { error: "unparseable", message: "Could not parse AI response" },
        { status: 422 }
      );
    }

    const check = scanSchema.safeParse(parsedJson);
    if (!check.success) {
      return Response.json(
        { error: "unparseable", message: "AI response failed validation" },
        { status: 422 }
      );
    }
    const result = check.data;

    // did we actually find a label?
    const has100 = result.per_100g && Object.values(result.per_100g).some((v) => v != null);
    const hasServing = result.per_serving && Object.values(result.per_serving).some((v) => v != null);
    if (!has100 && !hasServing) {
      return Response.json(
        { error: "no_label", message: "No nutrition label found in the photo" },
        { status: 422 }
      );
    }

    // sanity check kcal vs macros (on whichever basis is available)
    let sanity_ok = true;
    if (result.per_100g?.kcal != null) {
      sanity_ok = kcalSanityOk(
        result.per_100g.kcal,
        result.per_100g.protein_g ?? 0,
        result.per_100g.carbs_g ?? 0,
        result.per_100g.fat_g ?? 0
      );
    } else if (result.per_serving?.kcal != null) {
      sanity_ok = kcalSanityOk(
        result.per_serving.kcal,
        result.per_serving.protein_g ?? 0,
        result.per_serving.carbs_g ?? 0,
        result.per_serving.fat_g ?? 0
      );
    }

    return Response.json({ ...result, sanity_ok, source: demo ? "demo" : "ai" });
  } catch (e) {
    console.error("scan error", e);
    return Response.json({ error: "server_error", message: "Scan failed" }, { status: 500 });
  }
}
