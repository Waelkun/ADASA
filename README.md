# عدسة (Adasa) — تطبيق تتبع السعرات والتغذية الذكي

«عدسة» هو تطبيق ويب متطور وشامل لتتبع السعرات الحرارية، الماكروز، استهلاك الماء، والتمارين الرياضية، مع ميزة التحليل الذكي للوجبات والملصقات الغذائية عبر الرؤية الحاسوبية ونماذج الذكاء الاصطناعي (NVIDIA Vision AI).

تمت إعادة بناء التطبيق بالكامل وفق أحدث معايير الأمان وقواعد البيانات السحابية (Supabase Postgres + Row Level Security + Supabase Auth) ليعمل كمنصة سحابية متكاملة متعددة المستخدمين وجاهزة للنشر المباشر على **Vercel** و **GitHub**.

---

## 🛠 التقنيات المستخدمة (Tech Stack)

- **إطار العمل (Framework):** Next.js 16 (App Router) مع React 19 و TypeScript 5.
- **التصميم والواجهة:** Tailwind CSS v4، أيقونات Lucide React، ونظام تصميم iOS متوافق تماماً مع اللغة العربية (RTL) والوضع الليلي/النهاري (Dark/Light Mode).
- **إدارة الحالة:** Zustand للواجهات المحلية + TanStack React Query v5 للمزامنة اللحظية والبيانات السحابية.
- **قاعدة البيانات والمصادقة:** Supabase (PostgreSQL 15+ مع تفعيل أمان مستوى الصف RLS وسياسات العزل الكاملة لكل مستخدم).
- **المصادقة (Auth):** Supabase Auth عبر البريد الإلكتروني وكلمة المرور + تسجيل الدخول السريع بحساب Google (OAuth PKCE).
- **الذكاء الاصطناعي (Vision AI):** NVIDIA Vision API (OpenAI-Compatible Endpoint) عبر السيرفر حصراً (`/api/scan`)، مدعوماً بحد استخدام يومي ومكافحة استهلاك الموارد.
- **الاستضافة والنشر:** مهيأ بالكامل للنشر بنقرة واحدة على **Vercel**.

---

## 📋 متطلبات التشغيل ومتغيرات البيئة (Environment Variables)

للتشغيل محلياً أو على Vercel، يتطلب المشروع ضبط المتغيرات التالية داخل ملف `.env.local`:

```env
# إعدادات Supabase (قاعدة البيانات والمصادقة)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# مفتاح ونموذج الذكاء الاصطناعي من NVIDIA (استدعاء من السيرفر فقط)
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning

# الحد الأقصى اليومي للمسح الذكي لكل مستخدم (افتراضياً 30)
SCAN_DAILY_LIMIT=30
```

> **ملاحظة أمنية:** لا تقم أبداً بوضع المفتاح السري `SUPABASE_SERVICE_ROLE_KEY` أو كلمة مرور قاعدة البيانات في أي مكان داخل التطبيق. التطبيق مصمم بالكامل ليعمل بأمان تام عبر مفتاح الـ `anon` وسياسات الأمان RLS المدمجة في Postgres.

---

## 🗄️ مخطط قاعدة البيانات (Supabase Schema)

تم إنشاء وتأمين جداول المشروع بالكامل داخل Supabase في ملف SQL مستقل:
[`supabase/schema.sql`](supabase/schema.sql)

### الجداول الأساسية:
1. `profiles`: الملفات الشخصية للمستخدمين، أهداف السعرات، نسب الماكروز، هدف شرب الماء، والوحدات.
2. `foods`: قاعدة بيانات الأطعمة المخصصة للمستخدم مع إمكانية التفضيل (Favorites).
3. `food_logs`: السجل اليومي للوجبات مع السعرات والماكروز والصور المصغرة للوجبة (Thumbnail).
4. `weight_logs`: سجل قياسات الوزن مع التحويل التلقائي الدقيق بين الكيلوجرام والباوند.
5. `water_logs`: سجل شرب الماء اليومي بالمليلتر.
6. `workouts`: سجل التمارين ومجموعات العضلات والمدة المستغرقة.
7. `saved_meals`: الوجبات المجمعة المحفوظة مسبقاً لإعادة إضافتها بنقرة واحدة.
8. `scan_usage`: جدول تتبع استخدام المسح الذكي لضبط حدود الاستخدام اليومية لكل مستخدم ومنع استنزاف الموارد.

---

## 🚀 التشغيل المحلي (Local Development)

1. **تثبيت الحزم:**
   ```bash
   npm install
   ```

2. **تهيئة ملف البيئة:**
   انسخ ملف `.env.example` إلى `.env.local` وضع فيه مفاتيح Supabase و NVIDIA الخاصة بك:
   ```bash
   cp .env.example .env.local
   ```

3. **تشغيل سيرفر التطوير:**
   ```bash
   npm run dev
   ```
   افتح المتصفح على: `http://localhost:3000`

4. **التحقق من سلامة البناء:**
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 🌐 خطوات النشر على GitHub و Vercel

### الخطوة 1: الرفع إلى مستودع GitHub
```bash
git add .
git commit -m "feat: complete supabase & nvidia vision integration"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### الخطوة 2: النشر على منصة Vercel
1. سجّل الدخول إلى [Vercel](https://vercel.com) واضغط **"Add New Project"**.
2. اختر مستودع المشروع من حسابك على GitHub.
3. الإعدادات الافتراضية لـ Next.js معتمدة تلقائياً (`Framework Preset: Next.js`).
4. في قسم **Environment Variables**، أضف المتغيرات الخمسة الموضحة أعلاه:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL`
   - `SCAN_DAILY_LIMIT`
5. اضغط **Deploy**.

### الخطوة 3: تفعيل نطاق Vercel في Supabase Auth
بعد إتمام النشر على Vercel وحصولك على الرابط (مثلاً: `https://my-adasa.vercel.app`):
1. افتح لوحة تحكم [Supabase Dashboard](https://supabase.com/dashboard).
2. توجّه إلى **Authentication** -> **URL Configuration**.
3. في حقل **Site URL**، ضع رابط تطبيقك على Vercel.
4. في قسم **Redirect URLs**، أضف:
   - `https://my-adasa.vercel.app/**`
   - `https://my-adasa.vercel.app/auth/callback`
   - `http://localhost:3000/**` (للتطوير المحلي)
5. اضغط **Save**.

---

## ✨ المميزات الرئيسية للمشروع

- **دقة الحسابات الغذائية:** معادلات Mifflin-St Jeor، خطة السعرات المتعرجة (Zigzag Diet)، ومزامنة حقيقية بين غرامات الماكروز والسعرات الناتجة.
- **دعم وحدات القياس العالمية:** تحويل دقيق ومرن بين النظام المتري (kg) والنظام الإمبراطوري (lb) دون أي تكرار أو أخطاء حسابية.
- **واجهة مستخدم غنية وسريعة:** تصميم مستوحى من تطبيقات Apple الصحية مع دعم السحب والتنقل السلس عبر الأيام السابقة ومتابعة مؤشرات التقدم الأسبوعية والشهرية.
