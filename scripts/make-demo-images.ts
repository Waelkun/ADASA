/**
 * Generate demo product images (front + nutrition label) for the scan flow demo.
 * English-only text to guarantee crisp librsvg rendering.
 */
import sharp from "sharp";
import { mkdirSync } from "fs";

const dir = "/home/z/my-project/public/demo";
mkdirSync(dir, { recursive: true });

const FONT = "DejaVu Sans, Liberation Sans, sans-serif";

/** realistic nutrition facts panel */
const labelSvg = `<svg width="760" height="1040" xmlns="http://www.w3.org/2000/svg">
  <rect width="760" height="1040" fill="#ffffff" stroke="#1a1a1a" stroke-width="8"/>
  <!-- header -->
  <text x="40" y="86" font-family="${FONT}" font-size="58" font-weight="bold" fill="#1a1a1a">Nutrition Facts</text>
  <line x1="40" y1="112" x2="720" y2="112" stroke="#1a1a1a" stroke-width="10"/>
  <text x="40" y="156" font-family="${FONT}" font-size="28" fill="#1a1a1a">Serving Size: 1 bar (40 g)</text>
  <text x="40" y="192" font-family="${FONT}" font-size="28" fill="#1a1a1a">Servings Per Container: 6</text>
  <line x1="40" y1="216" x2="720" y2="216" stroke="#1a1a1a" stroke-width="10"/>

  <!-- column headers -->
  <text x="470" y="258" font-family="${FONT}" font-size="26" font-weight="bold" fill="#1a1a1a" text-anchor="end">Per bar</text>
  <text x="700" y="258" font-family="${FONT}" font-size="26" font-weight="bold" fill="#1a1a1a" text-anchor="end">Per 100 g</text>
  <line x1="40" y1="274" x2="720" y2="274" stroke="#1a1a1a" stroke-width="4"/>

  ${[
    ["Energy", "172 kcal", "430 kcal", true],
    ["Protein", "4.4 g", "11 g", true],
    ["Total Carbohydrate", "24.8 g", "62 g", true],
    ["  Sugars", "8.2 g", "20.5 g", false],
    ["Total Fat", "4.8 g", "12 g", true],
    ["  Saturated Fat", "1.4 g", "3.5 g", false],
    ["Dietary Fiber", "2.1 g", "5.2 g", false],
    ["Salt", "0.2 g", "0.5 g", false],
  ]
    .map(([name, perBar, per100, bold], i) => {
      const y = 326 + i * 82;
      const w = bold ? 'font-weight="bold"' : "";
      const thick = bold ? 4 : 1;
      const stroke = bold ? "#1a1a1a" : "#999";
      return `
      <text x="40" y="${y}" font-family="${FONT}" font-size="30" fill="#1a1a1a" ${w}>${name}</text>
      <text x="470" y="${y}" font-family="${FONT}" font-size="30" fill="#1a1a1a" text-anchor="end" ${w}>${perBar}</text>
      <text x="700" y="${y}" font-family="${FONT}" font-size="30" fill="#1a1a1a" text-anchor="end" ${w}>${per100}</text>
      <line x1="40" y1="${y + 16}" x2="720" y2="${y + 16}" stroke="${stroke}" stroke-width="${thick}"/>`;
    })
    .join("")}

  <text x="40" y="1010" font-family="${FONT}" font-size="20" fill="#666">Manufactured for NutraBar Co. — Product of Türkiye</text>
</svg>`;

/** product front (name + brand) */
const frontSvg = `<svg width="760" height="1040" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f2a24"/>
      <stop offset="1" stop-color="#0e1713"/>
    </linearGradient>
  </defs>
  <rect width="760" height="1040" fill="url(#bg)"/>
  <rect x="28" y="28" width="704" height="984" fill="none" stroke="#34d399" stroke-width="6" rx="28"/>
  <text x="380" y="300" font-family="${FONT}" font-size="46" fill="#9fe8c9" text-anchor="middle" letter-spacing="14">NUTRABAR</text>
  <text x="380" y="520" font-family="${FONT}" font-size="96" font-weight="bold" fill="#ffffff" text-anchor="middle">Chocolate</text>
  <text x="380" y="620" font-family="${FONT}" font-size="96" font-weight="bold" fill="#ffffff" text-anchor="middle">Protein Bar</text>
  <circle cx="380" cy="800" r="90" fill="none" stroke="#34d399" stroke-width="8"/>
  <text x="380" y="822" font-family="${FONT}" font-size="44" font-weight="bold" fill="#34d399" text-anchor="middle">20 g</text>
  <text x="380" y="866" font-family="${FONT}" font-size="24" fill="#9fe8c9" text-anchor="middle">PROTEIN</text>
  <text x="380" y="960" font-family="${FONT}" font-size="24" fill="#8aa69a" text-anchor="middle">NET WT. 240 g (6 bars)</text>
</svg>`;

await sharp(Buffer.from(labelSvg)).png().toFile(`${dir}/label.png`);
await sharp(Buffer.from(frontSvg)).png().toFile(`${dir}/front.png`);
console.log("demo images written to public/demo");
