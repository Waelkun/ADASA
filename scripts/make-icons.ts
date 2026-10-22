/**
 * Generate PWA icons for Nutra (SVG -> PNG via sharp)
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";

const dir = "/home/z/my-project/public/icons";
mkdirSync(dir, { recursive: true });

// leaf mark inside rounded squircle
const iconSvg = (pct: number) => {
  const bg = "rect:0,0,512,512";
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#34d399"/>
      <stop offset="1" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#g)"/>
  <g transform="translate(256 262) scale(${pct}) translate(-256 -262)">
    <!-- leaf -->
    <path d="M256 118 C 330 160, 372 232, 352 318 C 300 356, 214 344, 172 288 C 150 254, 152 196, 176 152 C 200 128, 228 116, 256 118 Z" fill="#ffffff" opacity="0.96"/>
    <!-- leaf vein -->
    <path d="M256 140 L 256 330" stroke="#059669" stroke-width="16" stroke-linecap="round"/>
    <path d="M256 200 L 210 172" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
    <path d="M256 240 L 306 210" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
    <path d="M256 282 L 208 262" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
    <path d="M256 312 L 300 288" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;
};

const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#059669"/>
  <g transform="translate(256 262) scale(0.62) translate(-256 -262)">
    <path d="M256 118 C 330 160, 372 232, 352 318 C 300 356, 214 344, 172 288 C 150 254, 152 196, 176 152 C 200 128, 228 116, 256 118 Z" fill="#ffffff"/>
    <path d="M256 140 L 256 330" stroke="#059669" stroke-width="16" stroke-linecap="round"/>
    <path d="M256 200 L 210 172" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
    <path d="M256 240 L 306 210" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
    <path d="M256 282 L 208 262" stroke="#059669" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;

writeFileSync("/tmp/nutra-icon.svg", iconSvg("0.78"));
writeFileSync("/tmp/nutra-maskable.svg", maskableSvg);

await sharp("/tmp/nutra-icon.svg").resize(512, 512).png().toFile(`${dir}/icon-512.png`);
await sharp("/tmp/nutra-icon.svg").resize(192, 192).png().toFile(`${dir}/icon-192.png`);
await sharp("/tmp/nutra-maskable.svg").resize(512, 512).png().toFile(`${dir}/icon-maskable-512.png`);
await sharp("/tmp/nutra-icon.svg").resize(180, 180).png().toFile(`${dir}/apple-touch-icon.png`);

console.log("icons generated in", dir);
