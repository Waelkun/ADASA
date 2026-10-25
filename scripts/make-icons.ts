/**
 * Generate PWA icons for عدسة (Adasa) from the uploaded brand icon (via sharp)
 * - icon-512 / icon-192: full-bleed resize (source already has the brand bg)
 * - maskable-512: full-bleed on #0b1210 (edges are plain dark bg; lens sits in the safe zone)
 * - apple-touch-icon: 180px
 */
import sharp from "sharp";
import { mkdirSync } from "fs";

const dir = "/home/z/my-project/public/icons";
mkdirSync(dir, { recursive: true });

const SRC = "/home/z/my-project/upload/أيقونة عدسة صحية لامعة.png";
const BRAND_BG = "#0b1210";

async function square(size: number, out: string) {
  // draw the source on a brand-bg canvas so the output is always opaque & square
  const base = await sharp(SRC).resize(size, size, { fit: "contain" }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BG },
  })
    .composite([{ input: base }])
    .png()
    .toFile(out);
}

await square(512, `${dir}/icon-512.png`);
await square(192, `${dir}/icon-192.png`);
await square(512, `${dir}/icon-maskable-512.png`);
await square(180, `${dir}/apple-touch-icon.png`);

console.log("icons generated in", dir);
