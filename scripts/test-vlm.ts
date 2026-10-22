/** Quick VLM pipeline test on the demo label */
import ZAI from "z-ai-web-dev-sdk";
import { readFile } from "fs/promises";

async function main() {
  const labelB64 = await readFile("/home/z/my-project/public/demo/label.png");
  const dataUrl = `data:image/png;base64,${labelB64.toString("base64")}`;
  console.log("image size (KB):", Math.round(labelB64.length / 1024));

  const zai = await ZAI.create();
  const res = await zai.chat.completions.createVision({
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a precise nutrition-label OCR engine. Read the nutrition facts label in this image. Return ONLY one valid JSON object, no markdown fences, no explanations, matching exactly:
{"product_name": string|null, "brand": string|null, "serving_size_g": number|null, "servings_per_container": number|null,
 "per_100g": {"kcal": number|null,"protein_g": number|null,"carbs_g": number|null,"sugar_g": number|null,"fat_g": number|null,"sat_fat_g": number|null,"fiber_g": number|null,"salt_g": number|null},
 "per_serving": {"kcal": number|null,"protein_g": number|null,"carbs_g": number|null,"sugar_g": number|null,"fat_g": number|null,"sat_fat_g": number|null,"fiber_g": number|null,"salt_g": number|null},
 "confidence": 0-1, "notes": string|null}
Rules: never guess values that are not visible, use null. Support Arabic and English labels. Convert kJ to kcal (divide by 4.184).`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    thinking: { type: "disabled" },
  });

  const content = res.choices[0]?.message?.content ?? "";
  console.log("=== RAW RESPONSE ===");
  console.log(content);
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
