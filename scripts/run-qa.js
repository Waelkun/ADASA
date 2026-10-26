/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'qa-screenshots');
const SHEETS_DIR = path.resolve(SCREENSHOT_DIR, 'sheets');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(SHEETS_DIR)) fs.mkdirSync(SHEETS_DIR, { recursive: true });

const results = [];
const consoleMessages = [];

// Helper to calculate contrast ratio
function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Mock data generator
const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@nutra.app',
  user_metadata: { full_name: 'أحمد' },
  app_metadata: { provider: 'email' },
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'fake-jwt',
  refresh_token: 'fake-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 360000,
  user: mockUser,
};

const cookieVal = 'base64-' + Buffer.from(JSON.stringify(mockSession)).toString('base64');

function getMockProfile(overrides = {}) {
  return {
    id: '1',
    userId: mockUser.id,
    displayName: 'أحمد',
    onboardingCompleted: true,
    kcalGoal: 2030,
    kcalGoalBase: 2030,
    proteinG: 140,
    carbsG: 210,
    fatG: 65,
    waterGoalMl: 2500,
    targetWeightKg: 75,
    units: 'metric',
    workoutsPerWeekGoal: 4,
    zigzagPlan: 'plan1',
    zigzagStart: '2026-10-26',
    ...overrides,
  };
}

const mockFoods = [
  { id: 'f1', name: 'صدور دجاج مشوية', brand: 'الوطنية', servingSizeG: 150, kcal100: 165, protein100: 31, carbs100: 0, fat100: 3.6, isFavorite: true },
  { id: 'f2', name: 'أرز أبيض مطبوخ', brand: null, servingSizeG: 200, kcal100: 130, protein100: 2.7, carbs100: 28, fat100: 0.3, isFavorite: true },
  { id: 'f3', name: 'شوفان بالحليب', brand: 'كويكر', servingSizeG: 250, kcal100: 104, protein100: 4.4, carbs100: 17.6, fat100: 1.8, isFavorite: false },
  { id: 'f4', name: 'زبادي يوناني', brand: 'نادك', servingSizeG: 170, kcal100: 97, protein100: 9, carbs100: 3.9, fat100: 5, isFavorite: true },
];

const mockMeals = [
  {
    id: 'm1',
    name: 'وجبة بعد التمرين',
    items: [
      { id: 'it1', name: 'صدور دجاج', grams: 180, kcal: 297, proteinG: 55.8, carbsG: 0, fatG: 6.5 },
      { id: 'it2', name: 'أرز أبيض', grams: 200, kcal: 260, proteinG: 5.4, carbsG: 56, fatG: 0.6 },
    ],
  },
];

async function setupPageRoutes(page, state = {}) {
  await page.route('**/api/today*', (route) => {
    const hasMeals = state.hasMeals !== false;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-10-26',
        streak: 5,
        profile: getMockProfile(state.profile || {}),
        logs: hasMeals
          ? [
              { id: 'l1', name: 'شوفان بالحليب', mealType: 'breakfast', grams: 250, kcal: 260, proteinG: 11, carbsG: 44, fatG: 4.5, dayDate: '2026-10-26', loggedAt: '2026-10-26T08:30:00Z' },
              { id: 'l2', name: 'صدور دجاج مشوية', mealType: 'lunch', grams: 180, kcal: 297, proteinG: 55.8, carbsG: 0, fatG: 6.5, dayDate: '2026-10-26', loggedAt: '2026-10-26T13:00:00Z' },
              { id: 'l3', name: 'أرز أبيض مطبوخ', mealType: 'lunch', grams: 200, kcal: 260, proteinG: 5.4, carbsG: 56, fatG: 0.6, dayDate: '2026-10-26', loggedAt: '2026-10-26T13:10:00Z' },
            ]
          : [],
        waterToday: {
          total: 1500,
          entries: [
            { id: 'w1', amountMl: 500, dayDate: '2026-10-26', loggedAt: '2026-10-26T09:00:00Z' },
            { id: 'w2', amountMl: 500, dayDate: '2026-10-26', loggedAt: '2026-10-26T11:00:00Z' },
            { id: 'w3', amountMl: 500, dayDate: '2026-10-26', loggedAt: '2026-10-26T13:30:00Z' },
          ],
        },
        weightToday: { id: 'wt1', date: '2026-10-26', weightKg: 78.4 },
        workoutToday: state.hasWorkout ? { id: 'w1', date: '2026-10-26', muscleGroups: ['chest', 'shoulders', 'arms'], durationMin: 55, note: 'تمرين قوي' } : null,
        totals: hasMeals
          ? { kcal: 817, protein: 72.2, carbs: 100, fat: 11.6 }
          : { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      }),
    });
  });

  await page.route('**/api/foods*', (route) => {
    const url = route.request().url();
    if (url.includes('q=nonexistent') || state.emptySearch) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFoods) });
    }
  });

  await page.route('**/api/meals*', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMeals) });
  });

  await page.route('**/api/progress*', (route) => {
    const hasData = state.hasProgress !== false;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        weights: hasData
          ? [
              { date: '2026-10-01', weightKg: 80.5 },
              { date: '2026-10-08', weightKg: 80.0 },
              { date: '2026-10-15', weightKg: 79.2 },
              { date: '2026-10-22', weightKg: 78.6 },
              { date: '2026-10-26', weightKg: 78.4 },
            ]
          : [],
        workouts: hasData
          ? [
              { date: '2026-10-20', muscleGroups: ['chest', 'arms'], durationMin: 50 },
              { date: '2026-10-22', muscleGroups: ['back'], durationMin: 60 },
              { date: '2026-10-24', muscleGroups: ['legs'], durationMin: 70 },
              { date: '2026-10-26', muscleGroups: ['chest', 'shoulders'], durationMin: 55 },
            ]
          : [],
        weeklyKcal: hasData
          ? [
              { dayDate: '2026-10-20', kcal: 1950 },
              { dayDate: '2026-10-21', kcal: 2050 },
              { dayDate: '2026-10-22', kcal: 1890 },
              { dayDate: '2026-10-23', kcal: 2100 },
              { dayDate: '2026-10-24', kcal: 1980 },
              { dayDate: '2026-10-25', kcal: 2020 },
              { dayDate: '2026-10-26', kcal: 817 },
            ]
          : [],
        averages: hasData
          ? { avgKcal: 1980, avgWaterMl: 2400, avgProteinG: 135, avgCarbsG: 205, avgFatG: 62 }
          : null,
        stats: hasData
          ? {
              totalChange: -2.1,
              ratePerWeek: -0.5,
              toGoal: 3.4,
              periodAverages: { kcal: 1980, weight: 79.3, water: 2400, protein: 135, carbs: 205, fat: 62 },
              trend: { kcal: -45, weight: -0.6, water: 250, protein: 5, carbs: -15, fat: -2 },
            }
          : null,
      }),
    });
  });

  await page.route('**/api/workouts*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        month: '2026-10',
        workouts: [
          { id: 'w1', date: '2026-10-26', muscleGroups: ['chest', 'shoulders', 'arms'], durationMin: 55, note: '' },
          { id: 'w2', date: '2026-10-24', muscleGroups: ['legs'], durationMin: 70, note: '' },
          { id: 'w3', date: '2026-10-22', muscleGroups: ['back'], durationMin: 60, note: '' },
          { id: 'w4', date: '2026-10-20', muscleGroups: ['chest', 'arms'], durationMin: 50, note: '' },
        ],
        stats: {
          thisWeekCount: 3,
          streak: 4,
          counts: { chest: 2, shoulders: 1, arms: 2, legs: 1, back: 1 },
          lastTrained: { chest: '2026-10-26', shoulders: '2026-10-26', arms: '2026-10-26' },
          lastWorkoutDate: '2026-10-26',
        },
      }),
    });
  });
}

// Automated check evaluator running in page context
async function runPageChecks(page, screenName, viewport) {
  return await page.evaluate(
    ({ screenName, viewport }) => {
      // 1. Horizontal overflow
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const hasDocOverflow = docWidth > winWidth;

      const overflowingElements = [];
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.right > winWidth + 2) {
          overflowingElements.push({
            tag: el.tagName,
            id: el.id,
            className: (el.className || '').toString().slice(0, 50),
            right: rect.right,
            winWidth,
          });
        }
      }

      // 2. Text < 12px (allow bottom-nav 11px)
      const sub12Text = [];
      const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = textWalker.nextNode())) {
        const text = node.textContent.trim();
        if (!text || text.length < 2) continue;
        const parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest('nav') || parent.closest('[role="navigation"]')) continue; // allowed 11px
        const fs = parseFloat(window.getComputedStyle(parent).fontSize);
        if (fs < 11.5) {
          sub12Text.push({
            text: text.slice(0, 30),
            fontSize: fs,
            parentTag: parent.tagName,
            parentClass: (parent.className || '').toString().slice(0, 40),
          });
        }
      }

      // 3. Sub-44px touch targets
      const sub44Targets = [];
      const interactiveEls = document.querySelectorAll(
        'button, a, input, [role="button"], [role="switch"], [role="radio"]'
      );
      for (const el of interactiveEls) {
        // exempt allowed chips
        const isChip =
          el.classList.contains('nutra-chip') ||
          el.closest('.nutra-chip') ||
          el.getAttribute('data-chip') ||
          el.closest('[data-slot="preset"]');
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.width < 43 || rect.height < 43) {
          if (!isChip) {
            sub44Targets.push({
              tag: el.tagName,
              ariaLabel: el.getAttribute('aria-label') || el.innerText.trim().slice(0, 20),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              className: (el.className || '').toString().slice(0, 40),
            });
          }
        }
      }

      // 4. Color contrast for carbs text and muscle tags
      const contrastChecks = [];
      const carbsTexts = document.querySelectorAll('.text-carbs-text, .text-carbs');
      for (const el of carbsTexts) {
        const style = window.getComputedStyle(el);
        contrastChecks.push({
          type: 'carbs',
          color: style.color,
          bg: style.backgroundColor,
        });
      }

      return {
        screenName,
        viewport,
        docWidth,
        winWidth,
        hasDocOverflow,
        overflowCount: overflowingElements.length,
        overflowSamples: overflowingElements.slice(0, 3),
        sub12Count: sub12Text.length,
        sub12Samples: sub12Text.slice(0, 3),
        sub44Count: sub44Targets.length,
        sub44Samples: sub44Targets.slice(0, 3),
        contrastChecks,
      };
    },
    { screenName, viewport }
  );
}

// Master capture function
async function clickNavTab(page, text) {
  await page.evaluate((text) => {
    const btns = Array.from(document.querySelectorAll('nav button'));
    const btn = btns.find((b) => b.textContent && b.textContent.includes(text));
    if (btn) btn.click();
  }, text);
  await page.waitForTimeout(400);
}

async function captureScreen(page, name, width, height, lang = 'ar', theme = 'dark') {
  const filename = `${name}_${width}_${lang}_${theme}.png`;
  const fullPath = path.join(SCREENSHOT_DIR, filename);

  // Set direction and lang
  await page.evaluate(
    ({ lang, theme }) => {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      window.localStorage.setItem('nutra_lang', lang);
      window.localStorage.setItem('theme', theme);
    },
    { lang, theme }
  );

  await page.waitForTimeout(300);
  await page.screenshot({ path: fullPath, fullPage: false });

  const check = await runPageChecks(page, name, `${width}x${height}`);
  check.filename = filename;
  check.theme = theme;
  check.lang = lang;
  results.push(check);
  console.log(`[CAPTURED] ${filename} (Overflow: ${check.hasDocOverflow}, Sub12: ${check.sub12Count}, Sub44: ${check.sub44Count})`);
  return fullPath;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  console.log('--- STARTING VISUAL QA TEST RUN ---');

  const viewports = [
    { w: 320, h: 640 },
    { w: 390, h: 844 },
  ];

  // ==========================================
  // 1. AUTH SCREENS (Unauthenticated)
  // ==========================================
  for (const vp of viewports) {
    for (const theme of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.text().includes('Warning:')) {
          consoleMessages.push({ screen: 'auth', text: msg.text() });
        }
      });
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(500);

      // Login
      await captureScreen(page, 'auth_login', vp.w, vp.h, 'ar', theme);

      // Signup
      const createAccBtn = page.locator('button:has-text("إنشاء حساب جديد")').first();
      if (await createAccBtn.isVisible()) {
        await createAccBtn.click();
        await page.waitForTimeout(300);
        await captureScreen(page, 'auth_signup', vp.w, vp.h, 'ar', theme);

        // Submit empty form to trigger validation errors
        const submitBtn = page.locator('button[type="submit"]').first();
        await submitBtn.click();
        await page.waitForTimeout(300);
        await captureScreen(page, 'auth_signup_errors', vp.w, vp.h, 'ar', theme);

        // Switch to login then to forgot
        await page.locator('button:has-text("العودة لتسجيل الدخول")').first().click();
        await page.waitForTimeout(300);
      }

      // Forgot password
      const forgotBtn = page.locator('button:has-text("نسيت كلمة المرور؟")').first();
      if (await forgotBtn.isVisible()) {
        await forgotBtn.click();
        await page.waitForTimeout(300);
        await captureScreen(page, 'auth_forgot', vp.w, vp.h, 'ar', theme);
      }

      await page.close();
    }
  }

  // English LTR Auth
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(500);
    await captureScreen(page, 'auth_login', 390, 844, 'en', 'dark');
    await page.close();
  }

  // ==========================================
  // 2. ONBOARDING (Step 1, 2 metric, 2 imperial, 3)
  // ==========================================
  for (const vp of viewports) {
    for (const theme of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
      await setupPageRoutes(page, {
        profile: { onboardingCompleted: false },
      });
      await page.context().addCookies([
        { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
      ]);
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(800);

      // Step 1: Name
      await captureScreen(page, 'onboarding_step1', vp.w, vp.h, 'ar', theme);

      // Advance to step 2: Theme
      const nextBtn1 = page.locator('button:has-text("التالي"), button:has-text("Next")').first();
      if (await nextBtn1.isVisible()) {
        await nextBtn1.click();
        await page.waitForTimeout(400);
        await captureScreen(page, 'onboarding_step2', vp.w, vp.h, 'ar', theme);

        // Advance to step 3: Goals + Weight + Age (Metric)
        const nextBtn2 = page.locator('button:has-text("التالي"), button:has-text("Next")').first();
        if (await nextBtn2.isVisible()) {
          await nextBtn2.click();
          await page.waitForTimeout(400);
          await captureScreen(page, 'onboarding_step3_metric', vp.w, vp.h, 'ar', theme);
        }
      }
      await page.close();

      // Onboarding Step 3 Imperial
      if (theme === 'dark') {
        const pageImp = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
        await setupPageRoutes(pageImp, {
          profile: { onboardingCompleted: false, units: 'imperial' },
        });
        await pageImp.context().addCookies([
          { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
        ]);
        await pageImp.goto('http://localhost:3000');
        await pageImp.waitForTimeout(800);
        const n1 = pageImp.locator('button:has-text("التالي"), button:has-text("Next")').first();
        if (await n1.isVisible()) {
          await n1.click();
          await pageImp.waitForTimeout(300);
          const n2 = pageImp.locator('button:has-text("التالي"), button:has-text("Next")').first();
          if (await n2.isVisible()) {
            await n2.click();
            await pageImp.waitForTimeout(300);
            await captureScreen(pageImp, 'onboarding_step3_imperial', vp.w, vp.h, 'ar', theme);
          }
        }
        await pageImp.close();
      }
    }
  }

  // ==========================================
  // 3. AUTHENTICATED TABS & SCREENS
  // ==========================================
  const authenticatedScreens = [
    { id: 'today', name: 'today' },
    { id: 'log', name: 'log' },
    { id: 'goals', name: 'goals' },
    { id: 'progress', name: 'progress' },
    { id: 'workouts', name: 'workouts' },
    { id: 'settings', name: 'settings' },
  ];

  for (const vp of viewports) {
    for (const theme of ['dark', 'light']) {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
      await setupPageRoutes(page, { hasMeals: true, hasProgress: true, hasWorkout: true });
      await page.context().addCookies([
        { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
      ]);
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(800);

      // Today with meals
      await captureScreen(page, 'today_meals', vp.w, vp.h, 'ar', theme);

      // Today scrolled to very bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await captureScreen(page, 'today_scrolled_bottom', vp.w, vp.h, 'ar', theme);

      // Log tab
      await clickNavTab(page, 'السجل');
      await captureScreen(page, 'log_normal', vp.w, vp.h, 'ar', theme);

      // Log empty search
      const searchInput = page.locator('input[placeholder*="أطعمتك"], input[aria-label*="أطعمتك"], input[placeholder*="Search"]').first();
      await searchInput.fill('nonexistentfooditem123');
      await page.waitForTimeout(500);
      await captureScreen(page, 'log_empty_search', vp.w, vp.h, 'ar', theme);
      await searchInput.fill('');
      await page.waitForTimeout(300);

      // Goals tab — 3 full page captures
      await clickNavTab(page, 'الأهداف');
      await page.evaluate(() => window.scrollTo(0, 0));
      await captureScreen(page, 'goals_top', vp.w, vp.h, 'ar', theme);

      // Macro editor in grams
      const macroCard = page.locator('section:has-text("توزيع الماكروز"), div:has-text("توزيع الماكروز")').first();
      if (await macroCard.isVisible()) {
        await macroCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await captureScreen(page, 'goals_macro_grams', vp.w, vp.h, 'ar', theme);

        // Switch to percent mode
        const pctBtn = page.locator('button:has-text("نسب مئوية")').first();
        if (await pctBtn.isVisible()) {
          await pctBtn.click();
          await page.waitForTimeout(300);
          await captureScreen(page, 'goals_macro_percent', vp.w, vp.h, 'ar', theme);
        }
      }

      // Goals bottom (Calorie calculator + Zigzag)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await captureScreen(page, 'goals_bottom', vp.w, vp.h, 'ar', theme);

      // Progress tab (with data)
      await clickNavTab(page, 'التقدم');
      await captureScreen(page, 'progress_data', vp.w, vp.h, 'ar', theme);

      // Workouts tab (Calendar month)
      await clickNavTab(page, 'التمارين');
      await captureScreen(page, 'workouts_calendar', vp.w, vp.h, 'ar', theme);

      // Settings tab (from header button)
      await page.locator('header button[aria-label*="الإعدادات"], button[aria-label*="الإعدادات"]').first().click();
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await captureScreen(page, 'settings_top', vp.w, vp.h, 'ar', theme);

      // Scrolled to sticky save button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      await captureScreen(page, 'settings_scrolled_bottom', vp.w, vp.h, 'ar', theme);

      await page.close();
    }
  }

  // 768px Desktop Viewport for Goals and Settings only
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await setupPageRoutes(page, { hasMeals: true, hasProgress: true });
    await page.context().addCookies([
      { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
    ]);
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    // Goals at 768
    await clickNavTab(page, 'الأهداف');
    await captureScreen(page, 'goals_desktop', 768, 1024, 'ar', theme);

    // Settings at 768
    await page.locator('header button[aria-label*="الإعدادات"], button[aria-label*="الإعدادات"]').first().click();
    await page.waitForTimeout(500);
    await captureScreen(page, 'settings_desktop', 768, 1024, 'ar', theme);

    await page.close();
  }

  // English LTR dark for Goals, Today, Weight Sheet
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await setupPageRoutes(page, { hasMeals: true, hasProgress: true });
    await page.context().addCookies([
      { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
    ]);
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    await captureScreen(page, 'today_meals', 390, 844, 'en', 'dark');

    await clickNavTab(page, 'Goals');
    await captureScreen(page, 'goals_top', 390, 844, 'en', 'dark');

    await page.close();
  }

  // ==========================================
  // 4. EMPTY STATES
  // ==========================================
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await setupPageRoutes(page, { hasMeals: false, hasProgress: false });
    await page.context().addCookies([
      { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
    ]);
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    // Today empty
    await captureScreen(page, 'today_empty', 390, 844, 'ar', 'dark');

    // Progress empty
    await clickNavTab(page, 'التقدم');
    await captureScreen(page, 'progress_empty', 390, 844, 'ar', 'dark');

    await page.close();
  }

  // ==========================================
  // 5. SHEETS & DIALOGS
  // ==========================================
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await setupPageRoutes(page, { hasMeals: true, hasWorkout: true });
    await page.context().addCookies([
      { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
    ]);
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    async function openQuickAction(actionText) {
      await page.evaluate(() => {
        const btn = document.querySelector('nav button[aria-label*="إضافة سريعة"], nav button[aria-label*="Quick add"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(500);
      const actionBtn = page.locator(`button:has-text("${actionText}")`).first();
      await actionBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // 1. Weight Sheet (with range hint + inline error)
    await openQuickAction('سجّل وزنك');
    const weightInput = page.locator('input[aria-label*="وزن اليوم"], input[aria-label*="weight"]').first();
    await weightInput.fill('10');
    await page.locator('button:has-text("حفظ"), button:has-text("Save")').first().click({ force: true });
    await page.waitForTimeout(300);
    await captureScreen(page, 'sheet_weight_error', 390, 844, 'ar', 'dark');

    // Close weight sheet
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // 2. Food Confirm Sheet (carbs in LIGHT theme)
    await clickNavTab(page, 'السجل');
    const foodItem = page.locator('button:has-text("صدور دجاج مشوية"), [role="button"]:has-text("صدور دجاج مشوية")').first();
    if (await foodItem.isVisible()) {
      await foodItem.click({ force: true });
      await page.waitForTimeout(500);
      await captureScreen(page, 'sheet_food_confirm', 390, 844, 'ar', 'light');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // 3. Edit Grams Sheet (LIGHT theme)
    await clickNavTab(page, 'اليوم');
    const editBtn = page.locator('button[aria-label*="تعديل الكمية"], button[aria-label*="Edit amount"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click({ force: true });
      await page.waitForTimeout(500);
      await captureScreen(page, 'sheet_edit_grams', 390, 844, 'ar', 'light');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // 4. Workout Sheet with Delete Dialog Open
    await clickNavTab(page, 'التمارين');
    const calDayBtn = page.locator('button:has-text("26")').first();
    if (await calDayBtn.isVisible()) {
      await calDayBtn.click({ force: true });
      await page.waitForTimeout(500);
      const trashBtn = page.locator('button[aria-label="حذف"], button[aria-label="Delete"]').first();
      if (await trashBtn.isVisible()) {
        await trashBtn.click({ force: true });
        await page.waitForTimeout(400);
        await captureScreen(page, 'sheet_workout_delete_dialog', 390, 844, 'ar', 'dark');
        await page.locator('button:has-text("إلغاء"), button:has-text("Cancel")').last().click({ force: true });
        await page.waitForTimeout(300);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // 5. Meal Builder Sheet with Discard Dialog Open
    await openQuickAction('بناء وجبة');
    await page.locator('button:has-text("صدور دجاج مشوية")').first().click({ force: true });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.trim() === 'إلغاء');
      if (cancelBtn) cancelBtn.click();
    });
    await page.waitForTimeout(400);
    await captureScreen(page, 'sheet_meal_builder_discard', 390, 844, 'ar', 'dark');
    await page.evaluate(() => {
      const discardBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.trim() === 'تجاهل');
      if (discardBtn) discardBtn.click();
    });
    await page.waitForTimeout(400);

    // 6. Scan Sheet Error & Quota States
    await openQuickAction('امسح منتجاً');
    await captureScreen(page, 'sheet_scan_initial', 390, 844, 'ar', 'dark');
    await page.keyboard.press('Escape');

    await page.close();
  }

  // ==========================================
  // 6. BOTTOM NAV FIT AT 320PX ON EVERY TAB
  // ==========================================
  {
    const page = await browser.newPage({ viewport: { width: 320, height: 640 } });
    await setupPageRoutes(page, { hasMeals: true });
    await page.context().addCookies([
      { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
    ]);
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

    const tabLabels = [
      { id: 'today', text: 'اليوم' },
      { id: 'log', text: 'السجل' },
      { id: 'goals', text: 'الأهداف' },
      { id: 'progress', text: 'التقدم' },
      { id: 'workouts', text: 'التمارين' },
    ];
    for (const t of tabLabels) {
      await clickNavTab(page, t.text);
      await captureScreen(page, `bottom_nav_${t.id}`, 320, 640, 'ar', 'dark');
    }
    await page.close();
  }

  await browser.close();

  // Save audit results
  fs.writeFileSync(path.resolve(__dirname, '..', 'qa-results.json'), JSON.stringify({ results, consoleMessages }, null, 2));
  console.log('--- VISUAL QA COMPLETE: Total captures =', results.length, '---');
}

main().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
