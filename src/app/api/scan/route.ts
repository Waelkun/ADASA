import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kcalSanityOk } from "@/lib/nutrition";

export const runtime = "nodejs";
export const maxDuration = 45;

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

// NVIDIA inline base64 images are capped (~180,000 characters / ~130 KB)
const MAX_IMAGE_CHARS = 180_000;
const DATA_URL_RE = /^data:image\/(jpe?g|png|webp|heic);base64,/i;

function isValidImageDataUrl(v: unknown): v is string {
  return typeof v === "string" && DATA_URL_RE.test(v);
}

/** strip markdown code fences and extract outermost JSON object */
function extractJson(text: string): string | null {
  let t = text.trim();
  // Strip reasoning/think tags if present (common in reasoning models)
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return t.slice(start, end + 1);
}

const SYSTEM_PROMPT = `You are an expert clinical nutrition AI and computer vision analyst. Analyze the provided food image(s):
- If the image contains a Nutrition Facts label (in Arabic or English):
  * Extract exact numbers as primary ground truth.
  * If energy is in kJ only, convert to kcal by dividing by 4.184 (rounded to integer).
  * Distinguish "per 100g" / "per 100ml" from "per serving" columns.
- If it is a prepared meal / restaurant dish / mixed plate:
  * Estimate weight in grams and return in "estimated_weight_g".
  * Estimate nutrition values PER 100G in "per_100g".
  * Set "serving_size_g" to null unless distinct pieces are apparent.
- If a USER HINT is provided, treat it as TRUSTED ground truth: it overrides visual guesses for the name and weights.

CRITICAL: Return ONLY a raw JSON object (no markdown, no backticks, no comments, no extra text) matching this schema:
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

    // 3. Verify NVIDIA configuration
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error: "server_misconfigured",
          message: "مفتاح NVIDIA_API_KEY غير مهيأ في الخادم.",
        },
        { status: 500 }
      );
    }
    const model = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

    // 4. Validate input payload
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

    // Enforce size limit to protect NVIDIA endpoint (~180k chars)
    if (labelImage.length > MAX_IMAGE_CHARS) {
      return Response.json(
        {
          error: "payload_too_large",
          message: "حجم الصورة كبير جداً (أكثر من 100 كيلوبايت). يرجى تقليل حجم الصورة وإعادة المحاولة.",
        },
        { status: 413 }
      );
    }

    // 5. Build NVIDIA Vision completion payload
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

    // Only include frontImage if total payload stays within safe limits
    if (
      isValidImageDataUrl(frontImage) &&
      labelImage.length + frontImage.length <= MAX_IMAGE_CHARS
    ) {
      userContent.push({
        type: "image_url",
        image_url: { url: frontImage },
      });
    }

    // 6. Call NVIDIA API with primary model + automatic high-availability fallback
    const primaryModel = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
    const fallbackModel = "meta/llama-3.2-11b-vision-instruct";
    const modelsToAttempt = primaryModel === fallbackModel
      ? [primaryModel]
      : [primaryModel, fallbackModel];

    let nvidiaRes: globalThis.Response | null = null;
    let lastErrorText = "";

    for (let i = 0; i < modelsToAttempt.length; i++) {
      const activeModel = modelsToAttempt[i];
      const isReasoning = activeModel.includes("reasoning");
      const timeoutMs = i === 0 ? 18_000 : 20_000;

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
      console.error("NVIDIA API response error:", nvidiaRes?.status, lastErrorText);
      return Response.json(
        {
          error: "vision_failed",
          message: `خطأ في استجابة خدمة الذكاء الاصطناعي (${nvidiaRes?.status ?? 502}).`,
        },
        { status: 502 }
      );
    }

    const nvidiaData = await nvidiaRes.json().catch(() => ({}));
    const rawContent: string = nvidiaData?.choices?.[0]?.message?.content ?? "";

    // 7. Parse and validate JSON from model response
    const jsonStr = extractJson(rawContent);
    if (!jsonStr) {
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

    // 8. Sanity check kcal vs macros
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

    // 9. Increment daily scan usage in Supabase
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

    // 10. Return validated ScanResult
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
    });
  } catch (err: any) {
    console.error("Fatal /api/scan error:", err);
    return Response.json(
      { error: "server_error", message: "حدث خطأ غير متوقع أثناء معالجة الصورة." },
      { status: 500 }
    );
  }
}
