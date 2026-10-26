/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
let chromium;
try {
  chromium = require('playwright').chromium;
} catch {
  chromium = require('C:/Users/Wael/AppData/Roaming/npm/node_modules/playwright').chromium;
}

const VERIFICATION_DIR = path.resolve(__dirname, '..', '.impeccable', 'verification');
if (!fs.existsSync(VERIFICATION_DIR)) {
  fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
}

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

const consoleIssues = [];

async function captureScreen(page, name, width, height, theme = 'light') {
  const filename = `${name}_${width}px.png`;
  const fullPath = path.join(VERIFICATION_DIR, filename);

  await page.evaluate(
    ({ theme }) => {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      window.localStorage.setItem('theme', theme);
    },
    { theme }
  );

  await page.waitForTimeout(300);
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(`[SAVED] ${filename}`);
  return fullPath;
}

async function createFreshPage(browser, w, h, skipSplash = true) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  if (skipSplash) {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('nutra-splash-v1', '1');
      } catch (e) {}
    });
  }
  return page;
}

async function clickNavTab(page, tabLabel) {
  await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('nav button'));
    const target = buttons.find(b => b.textContent && b.textContent.includes(label));
    if (target) target.click();
  }, tabLabel);
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const widths = [
    { w: 375, h: 812 },
    { w: 768, h: 1024 },
    { w: 1440, h: 900 },
  ];

  console.log('--- CAPTURING BASELINE SCREENSHOTS (375px, 768px, 1440px) ---');

  for (const { w, h } of widths) {
    console.log(`\n=== VIEWPORT: ${w}x${h} ===`);

    // 1. Unauthenticated Auth Screen
    {
      const page = await createFreshPage(browser, w, h);
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleIssues.push({ viewport: w, screen: 'auth', type: msg.type(), text: msg.text() });
        }
      });
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(600);
      await captureScreen(page, 'auth_login', w, h);

      // Signup
      const createAccBtn = page.locator('button:has-text("إنشاء حساب جديد")').first();
      if (await createAccBtn.isVisible()) {
        await createAccBtn.click();
        await page.waitForTimeout(300);
        await captureScreen(page, 'auth_signup', w, h);

        await page.locator('button:has-text("العودة لتسجيل الدخول")').first().click();
        await page.waitForTimeout(300);
      }

      // Forgot
      const forgotBtn = page.locator('button:has-text("نسيت كلمة المرور؟")').first();
      if (await forgotBtn.isVisible()) {
        await forgotBtn.click();
        await page.waitForTimeout(300);
        await captureScreen(page, 'auth_forgot', w, h);
      }
      await page.close();
    }

    // 2. Onboarding Flow
    {
      const page = await createFreshPage(browser, w, h);
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleIssues.push({ viewport: w, screen: 'onboarding', type: msg.type(), text: msg.text() });
        }
      });
      await setupPageRoutes(page, { profile: { onboardingCompleted: false } });
      await page.context().addCookies([
        { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
      ]);
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(800);

      await captureScreen(page, 'onboarding_step1', w, h);

      const nextBtn1 = page.locator('button:has-text("التالي")').first();
      if (await nextBtn1.isVisible()) {
        await nextBtn1.click();
        await page.waitForTimeout(350);
        await captureScreen(page, 'onboarding_step2', w, h);

        const nextBtn2 = page.locator('button:has-text("التالي")').first();
        if (await nextBtn2.isVisible()) {
          await nextBtn2.click();
          await page.waitForTimeout(350);
          await captureScreen(page, 'onboarding_step3', w, h);
        }
      }
      await page.close();
    }

    // 3. Authenticated Core Tabs
    {
      const page = await createFreshPage(browser, w, h);
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleIssues.push({ viewport: w, screen: 'main_tabs', type: msg.type(), text: msg.text() });
        }
      });
      await setupPageRoutes(page, { hasMeals: true, hasProgress: true, hasWorkout: true });
      await page.context().addCookies([
        { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
      ]);
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(800);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });

      // Today
      await captureScreen(page, 'screen_today', w, h);

      // Log
      await clickNavTab(page, 'السجل');
      await captureScreen(page, 'screen_log', w, h);

      // Goals
      await clickNavTab(page, 'الأهداف');
      await captureScreen(page, 'screen_goals', w, h);

      // Progress
      await clickNavTab(page, 'التقدم');
      await captureScreen(page, 'screen_progress', w, h);

      // Workouts
      await clickNavTab(page, 'التمارين');
      await captureScreen(page, 'screen_workouts', w, h);

      // Settings
      const settingsBtn = page.locator('header button[aria-label*="الإعدادات"], button[aria-label*="الإعدادات"]').first();
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForTimeout(400);
        await captureScreen(page, 'screen_settings', w, h);
      }

      await page.close();
    }

    async function openQuickAction(p, actionPattern) {
      await p.evaluate(() => {
        const btn = document.querySelector('nav button[aria-label*="إضافة سريعة"], nav button[aria-label*="Quick add"]');
        if (btn) btn.click();
      });
      await p.waitForTimeout(800);
      const actionBtn = p.locator(`[role="dialog"] button, [data-vaul-drawer] button`).filter({ hasText: actionPattern }).first();
      await actionBtn.click({ force: true });
      await p.waitForTimeout(800);
    }

    // 4. Sheets & Modals
    const captureSheet = async (sheetName, openAction) => {
      const page = await createFreshPage(browser, w, h);
      await setupPageRoutes(page, { hasMeals: true, hasWorkout: true });
      await page.context().addCookies([
        { name: 'sb-ervzzedwinbfckcvyddj-auth-token', value: cookieVal, domain: 'localhost', path: '/' },
      ]);
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(700);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await openAction(page);
      await page.waitForTimeout(500);
      await captureScreen(page, sheetName, w, h);
      await page.close();
    };

    // Quick Add
    await captureSheet('sheet_quick_add', async (page) => {
      await page.evaluate(() => {
        const btn = document.querySelector('nav button[aria-label*="إضافة سريعة"], nav button[aria-label*="Quick add"]');
        if (btn) btn.click();
      });
    });

    // Water Sheet
    await captureSheet('sheet_water', async (page) => {
      await openQuickAction(page, 'ماء');
    });

    // Weight Sheet
    await captureSheet('sheet_weight', async (page) => {
      await openQuickAction(page, 'وزن');
    });

    // Scan Sheet
    await captureSheet('sheet_scan', async (page) => {
      await openQuickAction(page, 'امسح');
    });

    // Food Confirm Sheet
    await captureSheet('sheet_food_confirm', async (page) => {
      await clickNavTab(page, 'السجل');
      const foodItem = page.locator('button:has-text("صدور دجاج مشوية"), [role="button"]:has-text("صدور دجاج مشوية")').first();
      if (await foodItem.isVisible()) {
        await foodItem.click({ force: true });
      }
    });

    // Meal Builder Sheet
    await captureSheet('sheet_meal_builder', async (page) => {
      await openQuickAction(page, 'بناء وجبة');
    });

    // Workout Sheet
    await captureSheet('sheet_workout', async (page) => {
      await clickNavTab(page, 'التمارين');
      const dayBtn = page.locator('button:has-text("26")').first();
      if (await dayBtn.isVisible()) {
        await dayBtn.click({ force: true });
      }
    });
  }

  await browser.close();

  fs.writeFileSync(
    path.join(VERIFICATION_DIR, 'console-issues.json'),
    JSON.stringify(consoleIssues, null, 2)
  );

  console.log('\n--- VERIFICATION CAPTURE COMPLETED SUCCESSFULLY ---');
  console.log(`Total Console Issues: ${consoleIssues.length}`);
}

run().catch((err) => {
  console.error('Error during baseline capture:', err);
  process.exit(1);
});
