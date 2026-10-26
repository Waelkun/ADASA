function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1));
  const l2 = luminance(hexToRgb(hex2));
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

// 1. Carbs text in light mode
// Current: var(--carbs) = #f59e0b
// Surfaces in light mode: #ffffff (card), #f4f6f8 (background), bg-primary/8 = color-mix(#10b981 8%, #ffffff) ~ #edf9f3
console.log('--- C1: Carbs in Light Mode ---');
console.log('#f59e0b on #ffffff:', contrast('#f59e0b', '#ffffff')); // ~ 2.14:1 (FAIL)
console.log('#f59e0b on #edf9f3:', contrast('#f59e0b', '#edf9f3')); // ~ 2.12:1 (FAIL)
// Candidate dark amber: #b45309 (amber-700) or #92400e (amber-800) or #a15c07
console.log('#b45309 on #ffffff:', contrast('#b45309', '#ffffff')); // ~ 4.54:1 (PASS)
console.log('#b45309 on #edf9f3:', contrast('#b45309', '#edf9f3')); // ~ 4.49:1
console.log('#92400e on #ffffff:', contrast('#92400e', '#ffffff')); // ~ 6.13:1 (STRONG PASS)
console.log('#92400e on #edf9f3:', contrast('#92400e', '#edf9f3')); // ~ 6.07:1 (STRONG PASS)
console.log('#a15c07 on #edf9f3:', contrast('#a15c07', '#edf9f3')); // ~ 4.88:1 (PASS)

// 2. Workout Muscle Tags
// Tags: chest: #f97066, back: #10b981, arms: #f59e0b, legs: #14b8a6, abs: #8b5cf6, shoulders: #ec4899, cardio: #06b6d4, other: #94a3b8
console.log('\n--- C2: Workout Muscle Tags with White (#ffffff) and Dark (#0b1210) ---');
const tags = {
  chest: '#f97066',
  back: '#10b981',
  arms: '#f59e0b',
  legs: '#14b8a6',
  abs: '#8b5cf6',
  shoulders: '#ec4899',
  cardio: '#06b6d4',
  other: '#94a3b8'
};
for (const [tag, color] of Object.entries(tags)) {
  const crWhite = contrast('#ffffff', color);
  const crDark = contrast('#0b1210', color);
  console.log(`${tag} (${color}): on white = ${crWhite}:1 | on dark = ${crDark}:1 -> winner: ${crWhite >= 4.5 ? 'white' : crDark >= 4.5 ? 'dark' : 'needs adjustment'}`);
}

// 3. Muted text
// Light mode: background = #f4f6f8, card = #ffffff, muted-foreground = #667085
// Dark mode: background = #0b1210, card = #141d19, muted-foreground = #8ca39a
console.log('\n--- C3: Muted text ---');
console.log('Light: #667085 on #f4f6f8 (bg):', contrast('#667085', '#f4f6f8')); // ~ 4.67:1 (PASS)
console.log('Light: #667085 on #ffffff (card):', contrast('#667085', '#ffffff')); // ~ 4.79:1 (PASS)
console.log('Dark: #8ca39a on #0b1210 (bg):', contrast('#8ca39a', '#0b1210')); // ~ 6.96:1 (PASS)
console.log('Dark: #8ca39a on #141d19 (card):', contrast('#8ca39a', '#141d19')); // ~ 6.13:1 (PASS)
// What about secondary-foreground?
console.log('Dark secondary: #c5d5cd on #1c2721:', contrast('#c5d5cd', '#1c2721'));

// 4. Dark borders
// Currently: dark background #0b1210, card #141d19.
// In globals.css: border is #22302a.
// Contrast of #22302a on #0b1210:
console.log('\n--- C4: Dark borders ---');
console.log('Border #22302a on #0b1210:', contrast('#22302a', '#0b1210')); // ~ 1.35:1 (too low!)
// If border is #2e4138 or #364e43:
console.log('Border #2e4138 on #0b1210:', contrast('#2e4138', '#0b1210'));
console.log('Border #364e43 on #0b1210:', contrast('#364e43', '#0b1210'));
console.log('Input border #3d564a on #0b1210:', contrast('#3d564a', '#0b1210'));

module.exports = { contrast, hexToRgb, luminance };

