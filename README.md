# TradeLog — יומן מסחר מקצועי

מוצר SaaS מסחרי לניהול יומן מסחר רב-חשבוני, עם תמיכה מלאה בעברית ואנגלית.

---

## תכונות עיקריות

- **לוח שנה אינטראקטיבי** — עם תצוגת P&L, צביעה מותנית (ירוק/אדום), ו-"+X עוד"
- **ניהול רב-חשבוני** — Personal, Prop Firm 1, Prop Firm 2, ועוד
- **אסטרטגיות מותאמות אישית** — מחק את Turtle Soup, צור משלך עם checkbox מותאמים
- **ייצוא PDF ו-CSV** — דוחות מקצועיים לכל טווח תאריכים
- **עברית RTL / אנגלית LTR** — toggle בכל מסך
- **נגישות WCAG 2.1 AA** — גודל טקסט, ניגודיות גבוהה, גווני אפור
- **PWA** — מותקן על הטלפון כאפליקציה
- **מצב Demo** — עובד מיד ללא Supabase

---

## התקנה מהירה (5 דקות)

```bash
# 1. פתח את הקובץ המצורף
unzip tradelog.zip && cd tradelog

# 2. התקן תלויות
npm install

# 3. העתק קובץ סביבה
cp .env.example .env.local

# 4. הפעל בפיתוח
npm run dev
# → http://localhost:3000
```

האפליקציה תעלה **במצב Demo** עם נתוני דוגמה. לחץ "מצב הדגמה" בדף הכניסה.

---

## חיבור Supabase (ייצור)

### שלב 1 — צור פרויקט Supabase
1. https://supabase.com → New Project
2. בחר region: `eu-central-1` (Frankfurt) — קרוב לישראל
3. שמור: **Project URL** ו-**anon key**

### שלב 2 — הפעל את ה-Schema
```bash
# העתק את schema.sql לתוך Supabase → SQL Editor → Run
```
(הקובץ `schema.sql` מסופק בנפרד)

### שלב 3 — הגדר Google OAuth
1. Supabase → Authentication → Providers → Google
2. הזן Client ID ו-Secret מ-Google Cloud Console
3. הוסף Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### שלב 4 — עדכן .env.local
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## פריסה ל-Vercel (חינם)

```bash
# 1. דחוף ל-GitHub
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR/tradelog.git
git push -u origin main

# 2. חבר ל-Vercel
# vercel.com → New Project → Import from GitHub

# 3. הוסף Environment Variables ב-Vercel Dashboard:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# 4. Deploy!
```

---

## פריסה ל-Netlify

```bash
npm run build
# גרור את תיקיית dist/ ל-netlify.com/drop
```

---

## מבנה הקוד

```
src/
├── lib/
│   └── supabase.ts       ← Supabase client + auth functions
├── components/
│   ├── Layout.tsx         ← Shell: Sidebar + Header + Outlet
│   ├── Sidebar.tsx        ← ניווט + accessibility widget
│   ├── Header.tsx         ← Account tabs + language toggle
│   ├── StatsBar.tsx       ← 6 KPI cards
│   ├── CalendarView.tsx   ← לוח שנה אינטראקטיבי ← עיקרי
│   ├── TradeModal.tsx     ← טופס הוספה/עריכה עסקה
│   └── AccessibilityWidget.tsx
├── pages/
│   ├── Dashboard.tsx      ← Stats + Calendar
│   ├── TradesList.tsx     ← טבלת עסקאות עם סינון
│   ├── Reports.tsx        ← ייצוא PDF/CSV
│   ├── Settings.tsx       ← ניהול חשבונות ואסטרטגיות
│   ├── Auth.tsx           ← Google + Apple + Demo login
│   ├── Terms.tsx          ← תנאי שימוש (עב/en)
│   └── Privacy.tsx        ← מדיניות פרטיות (עב/en)
├── store.ts               ← Zustand state + persistence
├── i18n.ts                ← תרגומים עב/en
├── types.ts               ← TypeScript interfaces
├── mockData.ts            ← Demo data
├── App.tsx                ← Router + effects
├── main.tsx               ← Entry point
└── index.css              ← All styles (dark fintech theme)
```

---

## חיבור ברוקרים (Tradovate / TopstepX)

חיבור הברוקרים דורש Supabase Edge Functions. לאחר הגדרת Supabase:

```bash
# התקן Supabase CLI
npm install -g supabase

# הפעל Edge Function לסנכרון Tradovate
supabase functions deploy tradovate-sync
supabase functions deploy topstepx-sync

# הגדר secrets
supabase secrets set TRADOVATE_CLIENT_ID=...
supabase secrets set TRADOVATE_CLIENT_SECRET=...
```

קבצי Edge Functions זמינים בתיקיית `supabase/functions/` (מסופקת בנפרד).

---

## ציות לחוק הישראלי

- ✅ דף תנאי שימוש בעברית
- ✅ מדיניות פרטיות (חוק הגנת הפרטיות תשמ"א-1981)
- ✅ כפתור נגישות (WCAG 2.1 Level AA)
- ✅ כתב ויתור סיכון מסחר בכל מסך פיננסי
- ✅ אין שיתוף נתונים עם צד שלישי
- ✅ RLS — בידוד נתונים ברמת מסד הנתונים

---

## תמיכה

support@tradelog.app

---

**TradeLog © 2025 — All rights reserved**
