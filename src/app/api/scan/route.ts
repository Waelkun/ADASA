import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kcalSanityOk } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ---------- validation schemas ---------- */

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
  estimated_weight_g: z.number().nullable().catch(null),
  per_100g: nutrientsSchema.nullable().catch(null),
  per_serving: nutrientsSchema.nullable().catch(null),
  confidence: z.number().min(0).max(1).catch(0.8),
  notes: z.string().nullable().catch(null),
});

/* ---------- limits & helpers ---------- */

const MAX_IMAGE_CHARS = 500_000;
const DATA_URL_RE = /^data:image\/(jpe?g|png|webp|heic);base64,/i;

function isValidImageDataUrl(v: unknown): v is string {
  return typeof v === "string" && DATA_URL_RE.test(v);
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

/** strip markdown code fences and extract outermost JSON object with robust sanitization */
function extractJson(text: string): string | null {
  let t = text.trim();
  // Strip reasoning/think tags if present
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let jsonStr = t.slice(start, end + 1);

  // Robust Sanitization:
  // 1. If model outputs fractions like "kcal": 1056/250, take the second number (kcal)
  jsonStr = jsonStr.replace(/:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g, ": $2");
  // 2. Fix European decimals like 4,0 -> 4.0
  jsonStr = jsonStr.replace(/:\s*(\d+),(\d+)/g, ": $1.$2");
  // 3. Remove trailing commas before closing braces/brackets
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

  return jsonStr;
}

/** Fix common kcal issues (e.g. model returned kJ instead of kcal, or kcal missing) */
function fixNutrientsKcal(nutrients: {
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  [key: string]: any;
} | null | undefined) {
  if (!nutrients) return;
  const p = nutrients.protein_g ?? 0;
  const c = nutrients.carbs_g ?? 0;
  const f = nutrients.fat_g ?? 0;
  const derived = 4 * p + 4 * c + 9 * f;

  if (nutrients.kcal != null && derived > 15) {
    // If kcal is approximately derived * 4.184 (meaning the model read kJ instead of kcal)
    const ratio = nutrients.kcal / derived;
    if (ratio >= 3.2 && ratio <= 5.2) {
      console.log(`[Nutrition Auto-Correction] Detected kJ (${nutrients.kcal} kJ) instead of kcal. Converting to ${Math.round(nutrients.kcal / 4.184)} kcal.`);
      nutrients.kcal = Math.round(nutrients.kcal / 4.184);
    }
  } else if ((nutrients.kcal == null || nutrients.kcal === 0) && derived > 15) {
    // If kcal is missing or zero but macros are present, derive it
    console.log(`[Nutrition Auto-Correction] Deriving missing kcal from macros: ${Math.round(derived)} kcal.`);
    nutrients.kcal = Math.round(derived);
  }
}

const SYSTEM_PROMPT = `You are an expert clinical nutrition AI and computer vision analyst. Analyze the provided food image(s):
- If the image contains a Nutrition Facts label (in German, Arabic, English, French, Spanish, etc.):
  * Extract exact numbers as primary ground truth. Read table rows top-to-bottom carefully.
  * MULTILINGUAL GUIDE:
    - German: "Brennwert" / "Energie" = Energy/Calories (take kcal, NEVER kJ!), "Fett" = Fat, "gesättigte Fettsäuren" = Saturated Fat, "Kohlenhydrate" = Carbs, "davon Zucker" = Sugar, "Ballaststoffe" = Fiber, "Eiweiß" = Protein, "Salz" = Salt.
    - French: "Valeur énergétique" = Energy/Calories (take kcal, NEVER kJ!), "Matières grasses" = Fat, "Glucides" = Carbs, "Protéines" = Protein, "Sel" = Salt.
    - Arabic: "السعرات" / "طاقة" = Calories (kcal), "الدهون" = Fat, "الكربوهيدرات" = Carbs, "البروتين" = Protein, "الألياف" = Fiber.
    - English: "Calories" = kcal, "Total Fat" = Fat, "Total Carbohydrate" = Carbs, "Protein" = Protein.
  * CRITICAL FOR ENERGY / CALORIES:
    - Always return KCAL (kilocalories), NEVER kJ (kilojoules).
    - If a label lists energy as both kJ and kcal (for example: "1056 kJ / 250 kcal" or "1056/250"), ALWAYS return ONLY the kcal number (250). Never return 1056!
    - Calorie sanity rule: kcal ≈ (4 * protein_g) + (4 * carbs_g) + (9 * fat_g). If the label's energy row lists both numbers, the smaller number is always kcal!
  * Distinguish "per 100g" / "per 100ml" from "per serving" columns.
- If it is a prepared meal / restaurant dish / mixed plate:
  * Estimate weight in grams and return in "estimated_weight_g".
  * Estimate nutrition values PER 100G in "per_100g".
  * Calculate kcal consistently: kcal ≈ 4 * protein_g + 4 * carbs_g + 9 * fat_g.
  * Set "serving_size_g" to null unless distinct pieces are apparent.
- If a USER HINT is provided, treat it as TRUSTED ground truth: it overrides visual guesses for the name and weights.

CRITICAL: Return ONLY a raw JSON object (all numbers must be pure numeric floats/ints or null, NEVER expressions like 1056/250) matching this schema:
{
  "product_name": string or null,
  "brand": string or null,
  "serving_size_g": number or null,
  "servings_per_container": number or null,
  "estimated_weight_g": number or null,
  "per_100g": {
    "kcal": number or null,
    "protein_g": number or null,
    "carbs_g": number or null,
    "sugar_g": number or null,
    "fat_g": number or null,
    "sat_fat_g": number or null,
    "fiber_g": number or null,
    "salt_g": number or null
  },
  "per_serving": {
    "kcal": number or null,
    "protein_g": number or null,
    "carbs_g": number or null,
    "sugar_g": number or null,
    "fat_g": number or null,
    "sat_fat_g": number or null,
    "fiber_g": number or null,
    "salt_g": number or null
  },
  "confidence": number between 0.0 and 1.0,
  "notes": string or null
}`;

/* ---------- Gemini Vision Provider (Primary) ---------- */

async function callGeminiVision(
  labelImage: string,
  frontImage: string | null,
  note: string | null,
  apiKey: string,
  modelName: string
): Promise<string> {
  const labelParsed = parseDataUrl(labelImage);
  if (!labelParsed) throw new Error("Invalid label image data URL");

  const parts: Array<
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  > = [];

  let textPrompt = SYSTEM_PROMPT;
  if (note) {
    textPrompt += `\n\nUSER HINT (TRUSTED — overrides visual guesses): "${note}"`;
  }
  parts.push({ text: textPrompt });
  parts.push({
    inline_data: {
      mime_type: labelParsed.mimeType,
      data: labelParsed.data,
    },
  });

  if (frontImage) {
    const frontParsed = parseDataUrl(frontImage);
    if (frontParsed) {
      parts.push({
        inline_data: {
          mime_type: frontParsed.mimeType,
          data: frontParsed.data,
        },
      });
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini API HTTP ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned empty candidate text");
    }
    return rawText;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/* ---------- NVIDIA Vision Provider (Fallback) ---------- */

async function callNvidiaVision(
  labelImage: string,
  frontImage: string | null,
  note: string | null,
  apiKey: string
): Promise<string> {
  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: SYSTEM_PROMPT }];

  if (note) {
    userContent.push({
      type: "text",
      text: `USER HINT (TRUSTED — overrides visual guesses): "${note}"`,
    });
  }

  userContent.push({
    type: "image_url",
    image_url: { url: labelImage },
  });

  if (
    isValidImageDataUrl(frontImage) &&
    labelImage.length + frontImage.length <= 180_000
  ) {
    userContent.push({
      type: "image_url",
      image_url: { url: frontImage },
    });
  }

  const primaryModel = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";
  const fallbackModel = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
  const modelsToAttempt = primaryModel === fallbackModel
    ? [primaryModel]
    : [primaryModel, fallbackModel];

  let nvidiaRes: globalThis.Response | null = null;
  let lastErrorText = "";

  for (let i = 0; i < modelsToAttempt.length; i++) {
    const activeModel = modelsToAttempt[i];
    const isReasoning = activeModel.includes("reasoning");
    const timeoutMs = 35_000;

    const requestPayload: Record<string, any> = {
      model: activeModel,
      messages: [{ role: "user", content: userContent }],
      max_tokens: isReasoning ? 4096 : 1024,
      temperature: isReasoning ? 0.6 : 0.2,
      top_p: isReasoning ? 0.95 : 0.7,
    };
    if (isReasoning) {
      requestPayload.reasoning_budget = 1024;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        nvidiaRes = res;
        break;
      }

      lastErrorText = await res.text().catch(() => "");
      console.warn(`NVIDIA API model ${activeModel} returned ${res.status}:`, lastErrorText);

      if (i < modelsToAttempt.length - 1) {
        console.warn(`Falling back to ${modelsToAttempt[i + 1]}...`);
        continue;
      }

      nvidiaRes = res;
      break;
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      console.warn(`NVIDIA API call for ${activeModel} failed:`, fetchErr?.message || fetchErr);
      if (i < modelsToAttempt.length - 1) {
        console.warn(`Falling back to ${modelsToAttempt[i + 1]}...`);
        continue;
      }
    }
  }

  if (!nvidiaRes || !nvidiaRes.ok) {
    throw new Error(`NVIDIA API failed (${nvidiaRes?.status ?? 502}): ${lastErrorText}`);
  }

  const nvidiaData = await nvidiaRes.json().catch(() => ({}));
  const rawContent: string = nvidiaData?.choices?.[0]?.message?.content ?? "";
  if (!rawContent) {
    throw new Error("NVIDIA returned empty completion");
  }
  return rawContent;
}

/* ---------- POST /api/scan ---------- */

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Supabase session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "unauthorized", message: "يجب تسجيل الدخول لاستخدام ميزة تحليل الطعام." },
        { status: 401 }
      );
    }

    // 2. Check and enforce daily scan limit via public.scan_usage
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const limit = Number(process.env.SCAN_DAILY_LIMIT) || 30;

    const { data: usageRow, error: usageSelectError } = await supabase
      .from("scan_usage")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("day_date", today)
      .maybeSingle();

    if (usageSelectError) {
      console.warn("Scan usage select warning:", usageSelectError.message);
    }

    const currentCount = usageRow?.count ?? 0;
    if (currentCount >= limit) {
      return Response.json(
        {
          error: "daily_limit_exceeded",
          message: `لقد وصلت إلى الحد الأقصى للمسح اليومي (${limit} عملية مسح اليوم). يمكنك المتابعة غداً.`,
        },
        { status: 429 }
      );
    }

    // 3. Validate input payload
    const body = await req.json().catch(() => ({}));
    const labelImage: string | null = body?.labelImage ?? null;
    const frontImage: string | null = body?.frontImage ?? null;
    const note: string | null =
      typeof body?.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 500)
        : null;

    if (!isValidImageDataUrl(labelImage)) {
      return Response.json(
        {
          error: "bad_image",
          message: "صورة غير صالحة. يرجى تزويد صورة بتنسيق مدعوم (JPEG / PNG / WebP).",
        },
        { status: 400 }
      );
    }

    if (labelImage.length > MAX_IMAGE_CHARS) {
      return Response.json(
        {
          error: "payload_too_large",
          message: "حجم الصورة كبير جداً. يرجى تقليل حجم الصورة وإعادة المحاولة.",
        },
        { status: 413 }
      );
    }

    // 4. Execute Vision AI: Try Gemini first, fallback to NVIDIA
    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const nvidiaKey = process.env.NVIDIA_API_KEY;

    let rawContent: string | null = null;
    let providerUsed: "gemini" | "nvidia" = "gemini";
    let lastError: any = null;

    if (geminiKey) {
      try {
        console.log(`[Scan] Attempting primary provider: Gemini (${geminiModel})...`);
        rawContent = await callGeminiVision(labelImage, frontImage, note, geminiKey, geminiModel);
        providerUsed = "gemini";
        console.log("[Scan] Gemini Vision succeeded!");
      } catch (geminiErr: any) {
        console.warn("[Scan] Gemini Vision failed, attempting fallback to NVIDIA:", geminiErr?.message || geminiErr);
        lastError = geminiErr;
      }
    } else {
      console.warn("[Scan] GEMINI_API_KEY not configured, falling back to NVIDIA.");
    }

    if (!rawContent && nvidiaKey) {
      try {
        console.log("[Scan] Calling NVIDIA Vision fallback...");
        rawContent = await callNvidiaVision(labelImage, frontImage, note, nvidiaKey);
        providerUsed = "nvidia";
        console.log("[Scan] NVIDIA Vision succeeded!");
      } catch (nvidiaErr: any) {
        console.error("[Scan] NVIDIA Vision also failed:", nvidiaErr?.message || nvidiaErr);
        lastError = nvidiaErr;
      }
    }

    if (!rawContent) {
      return Response.json(
        {
          error: "vision_failed",
          message: "تعذر استجابة خدمة الذكاء الاصطناعي لتحليل الصورة. يرجى المحاولة مجدداً.",
          details: lastError?.message,
        },
        { status: 502 }
      );
    }

    // 5. Parse and validate JSON from model response
    const jsonStr = extractJson(rawContent);
    if (!jsonStr) {
      console.warn("Failed to extract JSON from raw content:", rawContent.slice(0, 300));
      return Response.json(
        {
          error: "unparseable",
          message: "تعذر استخراج بيانات غذائية مقروءة من استجابة النموذج.",
        },
        { status: 422 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch {
      return Response.json(
        {
          error: "unparseable",
          message: "صيغة بيانات النموذج غير صالحة.",
        },
        { status: 422 }
      );
    }

    const check = scanSchema.safeParse(parsedJson);
    if (!check.success) {
      return Response.json(
        {
          error: "unparseable",
          message: "فشل التحقق من صحة بنية البيانات الغذائية.",
        },
        { status: 422 }
      );
    }

    const result = check.data;

    // 6. Fix kJ vs kcal and missing calories
    fixNutrientsKcal(result.per_100g);
    fixNutrientsKcal(result.per_serving);

    // Verify whether any nutritional values or food was recognized
    const has100 =
      result.per_100g && Object.values(result.per_100g).some((v) => v != null);
    const hasServing =
      result.per_serving && Object.values(result.per_serving).some((v) => v != null);

    if (!has100 && !hasServing && !result.product_name) {
      return Response.json(
        {
          error: "no_label",
          message: "لم يتم التعرف على ملصق غذائي أو صنف طعام في الصورة.",
        },
        { status: 422 }
      );
    }

    // 7. Sanity check kcal vs macros
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

    // 8. Increment daily scan usage in Supabase
    try {
      if (!usageRow) {
        await supabase.from("scan_usage").insert({
          user_id: user.id,
          day_date: today,
          count: 1,
        });
      } else {
        await supabase
          .from("scan_usage")
          .update({ count: currentCount + 1 })
          .eq("id", usageRow.id);
      }
    } catch (dbErr) {
      console.warn("Failed to update scan_usage counter:", dbErr);
    }

    // 9. Return validated ScanResult
    return Response.json({
      product_name: result.product_name || "صنف غذائي",
      brand: result.brand,
      serving_size_g: result.serving_size_g,
      servings_per_container: result.servings_per_container,
      estimated_weight_g: result.estimated_weight_g,
      per_100g: result.per_100g ?? {
        kcal: 0,
        protein_g: 0,
        carbs_g: 0,
        sugar_g: null,
        fat_g: 0,
        sat_fat_g: null,
        fiber_g: null,
        salt_g: null,
      },
      per_serving: result.per_serving,
      confidence: result.confidence,
      notes: result.notes,
      sanity_ok,
      source: "ai",
      provider: providerUsed,
    });
  } catch (err: any) {
    console.error("Fatal /api/scan error:", err);
    return Response.json(
      { error: "server_error", message: "حدث خطأ غير متوقع أثناء معالجة الصورة." },
      { status: 500 }
    );
  }
}
