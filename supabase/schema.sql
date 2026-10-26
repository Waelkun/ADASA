-- ==============================================================================
-- مشروع عدسة (Nutra) - مخطط قاعدة بيانات Supabase (PostgreSQL Schema)
-- ==============================================================================
-- تعليمات التطبيق:
-- 1. افتح لوحة تحكم Supabase للمشروع المستهدف (adasa).
-- 2. توجّه إلى SQL Editor وانقر على "New Query".
-- 3. الصق محتوى هذا الملف ونفّذه بالكامل (Run).
-- 4. تأكد من تفعيل RLS على جميع الجداول وأن صلاحيات auth.users مربوطة بشكل سليم.
-- ==============================================================================

-- تفعيل الامتدادات المطلوبة لتوليد المعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. الدوال المساعدة والمشغلات العامة (Utility Functions & Triggers)
-- ==============================================================================

-- دالة تحديث عمود updated_at تلقائياً عند أي تعديل
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- دالة إنشاء ملف شخصي تلقائياً عند تسجيل مستخدم جديد عبر Supabase Auth
-- ملاحظة أمنية: تم تحديد search_path فارغاً واستخدام المسار الكامل public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم عدسة')
  );
  RETURN NEW;
END;
$$;

-- مشغل إنشاء الملف الشخصي بعد إضافة المستخدم في auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 2. جداول قاعدة البيانات (Application Tables)
-- ==============================================================================

-- (أ) جدول الملف الشخصي للمستخدم والأهداف (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'مستخدم عدسة',
  sex TEXT NOT NULL DEFAULT 'male' CHECK (sex IN ('male', 'female')),
  birth_year INTEGER NOT NULL DEFAULT 1995,
  height_cm NUMERIC(5,2) NOT NULL DEFAULT 175,
  activity_level TEXT NOT NULL DEFAULT 'moderate' 
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type TEXT NOT NULL DEFAULT 'lose' 
    CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  kcal_goal INTEGER NOT NULL DEFAULT 2100,
  protein_g INTEGER NOT NULL DEFAULT 160,
  carbs_g INTEGER NOT NULL DEFAULT 190,
  fat_g INTEGER NOT NULL DEFAULT 70,
  water_goal_ml INTEGER NOT NULL DEFAULT 2800,
  goal_weight_kg NUMERIC(5,2),
  workouts_per_week INTEGER NOT NULL DEFAULT 4,
  units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  zigzag_plan TEXT CHECK (zigzag_plan IN ('plan1', 'plan2') OR zigzag_plan IS NULL),
  zigzag_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- (ب) جدول قائمة الأطعمة الخاصة بالمستخدم (Foods)
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size_g NUMERIC(6,2),
  kcal100 NUMERIC(6,2) NOT NULL,
  protein100 NUMERIC(6,2) NOT NULL,
  carbs100 NUMERIC(6,2) NOT NULL,
  sugar100 NUMERIC(6,2),
  fat100 NUMERIC(6,2) NOT NULL,
  sat_fat100 NUMERIC(6,2),
  fiber100 NUMERIC(6,2),
  salt100 NUMERIC(6,2),
  image_url TEXT, -- مصغرة مضغوطة بحجم صغير Data URL
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_foods_user_name ON public.foods(user_id, name);


-- (ج) جدول سجلات الوجبات اليومية (Food Logs)
CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  day_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  grams NUMERIC(6,2) NOT NULL,
  kcal NUMERIC(6,2) NOT NULL,
  protein_g NUMERIC(6,2) NOT NULL,
  carbs_g NUMERIC(6,2) NOT NULL,
  fat_g NUMERIC(6,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('scan', 'manual', 'myfoods')),
  kcal100 NUMERIC(6,2),
  protein100 NUMERIC(6,2),
  carbs100 NUMERIC(6,2),
  fat100 NUMERIC(6,2),
  image_url TEXT, -- مصغرة الوجبة
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_day ON public.food_logs(user_id, day_date);


-- (د) جدول تسجيل الوزن ومتابعة التطور (Weight Logs)
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_date_weight UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, date);


-- (هـ) جدول تسجيل شرب الماء اليومي (Water Logs)
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  day_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_day ON public.water_logs(user_id, day_date);


-- (و) جدول سجل التمارين الرياضية (Workouts)
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  duration_min INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, date);


-- (ز) جدول الوجبات المفضلة والمحفوظة (Saved Meals)
CREATE TABLE IF NOT EXISTS public.saved_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_saved_meals_user ON public.saved_meals(user_id);


-- (ح) جدول متابعة حد المسح اليومي للذكاء الاصطناعي (Scan Usage Rate Limit)
CREATE TABLE IF NOT EXISTS public.scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_day_scan UNIQUE (user_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_scan_usage_user_day ON public.scan_usage(user_id, day_date);

DROP TRIGGER IF EXISTS update_scan_usage_updated_at ON public.scan_usage;
CREATE TRIGGER update_scan_usage_updated_at
BEFORE UPDATE ON public.scan_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ==============================================================================
-- 3. تفعيل أمان مستوى الصف (Row Level Security - RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 4. سياسات الوصول (RLS Policies)
-- ==============================================================================

-- 1. سياسات profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. سياسات foods
DROP POLICY IF EXISTS "Users can manage own foods" ON public.foods;
CREATE POLICY "Users can manage own foods" 
ON public.foods FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. سياسات food_logs
DROP POLICY IF EXISTS "Users can manage own food logs" ON public.food_logs;
CREATE POLICY "Users can manage own food logs" 
ON public.food_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. سياسات weight_logs
DROP POLICY IF EXISTS "Users can manage own weight logs" ON public.weight_logs;
CREATE POLICY "Users can manage own weight logs" 
ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. سياسات water_logs
DROP POLICY IF EXISTS "Users can manage own water logs" ON public.water_logs;
CREATE POLICY "Users can manage own water logs" 
ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. سياسات workouts
DROP POLICY IF EXISTS "Users can manage own workouts" ON public.workouts;
CREATE POLICY "Users can manage own workouts" 
ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. سياسات saved_meals
DROP POLICY IF EXISTS "Users can manage own saved meals" ON public.saved_meals;
CREATE POLICY "Users can manage own saved meals" 
ON public.saved_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. سياسات scan_usage
DROP POLICY IF EXISTS "Users can manage own scan usage" ON public.scan_usage;
CREATE POLICY "Users can manage own scan usage" 
ON public.scan_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
