# TradeLog — Project Memory for Claude

## מה זה
יומן מסחר SaaS מלא לטריידרים בחוזים עתידיים (Futures).
בעברית + אנגלית, dark/light mode, מובייל + דסקטופ.

---

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Zustand + React Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel → auto-deploy מ-GitHub
- **Repo**: github.com/TzachItach/TradeLog
- **Supabase project**: `mxzyfmuktsyazkfxglzb`
- **Live URL**: `https://trade-log-osxu.vercel.app`

---

## מבנה תיקיות
```
src/
  App.tsx                  — Router, AuthListener, AppEffects, SplashScreen
  store.ts                 — Zustand store + Supabase sync
  i18n.ts                  — עברית/אנגלית (80+ מחרוזות)
  types.ts                 — TypeScript interfaces
  mockData.ts              — Demo data
  index.css                — Dark/Light themes, RTL, mobile responsive
  lib/
    supabase.ts            — Client + DEMO_MODE
    db.ts                  — loadUserData, dbSave*, dbSeedNewUser, dbUploadTradeMedia, dbGetTradeMediaUrls
    futures.ts             — 50+ חוזים עתידיים עם pointValue מדויק
  components/
    Layout.tsx             — Shell: Sidebar + Header + Outlet
    Sidebar.tsx            — ניווט + mobile overlay
    Header.tsx             — Account tabs + hamburger + logo (קליקבילי)
    StatsBar.tsx           — 6 KPI cards
    CalendarView.tsx       — לוח שנה + WR pill + עמודת שבוע + יום ראשון מוקטן
    TradeModal.tsx         — טופס עסקה + RR Calculator + DailySummary
    DailySummary.tsx       — Popup אחרי שמירה: P&L יומי + שבועי + best trade
    SymbolPicker.tsx       — Dropdown 50+ חוזים עם חיפוש וקטגוריות
    BrokerImport.tsx       — ייבוא CSV מ-Tradovate/TopstepX (עם פרסור fills)
    AccessibilityWidget.tsx — קומפוננט ישן (לא בשימוש — הוחלף ב-Negishot)
  pages/
    Landing.tsx            — דף נחיתה שיווקי (route: /)
    Dashboard.tsx          — Stats + Calendar
    TradesList.tsx         — טבלה עם פילטרים
    Analytics.tsx          — 8 גרפים Canvas: Equity, Drawdown, ByDay, BySymbol,
                             Heatmap, Distribution, RR Scatter, Streaks
    Reports.tsx            — Export PDF + CSV
    Settings.tsx           — חשבונות + אסטרטגיות + CSV Import + logout
    Auth.tsx               — Google OAuth בלבד (Apple הוסר)
    Accessibility.tsx      — הצהרת נגישות עב/en (מתייחסת ל-Negishot)
    Terms.tsx / Privacy.tsx — דפים משפטיים עב/en
  pages/
    landing.css            — CSS מבודד עם namespace .lp-* לדף הנחיתה
```

---

## Auth & Data Flow
- **DEMO_MODE**: אם `VITE_SUPABASE_URL` לא מוגדר → demo data
- **Real user flow**:
  1. Google OAuth → `getSession()` timeout 3s → פתח מיד
  2. `loadDataInBackground(userId)` → Supabase async → update store
  3. `lastUserId` ב-localStorage מונע reset
- כל שמירה → localStorage + Supabase במקביל

---

## Database Schema
טבלאות: `profiles`, `accounts`, `strategies`, `strategy_fields`, `trades`, `trade_media`, `broker_connections`, `sync_log`

**חשוב**: כל `id` חייב להיות **UUID** (`crypto.randomUUID()`) — לא `t-${Date.now()}`!

RLS: כל טבלה עם `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

---

## פיצ'רים שנבנו

### Landing Page (`/`)
- דף נחיתה שיווקי בעברית (RTL) עם CSS מבודד `.lp-*`
- סקציות: Nav, Hero + mockup, Social Proof, Features Bento, Pricing, CTA, Footer
- Mockup: sidebar + KPI cards + SVG equity curve + calendar heatmap + trade rows
- תמחור: ₪69/חודש | ₪590/שנה (עדיין ללא Stripe — UI בלבד)
- כפתורים: "התחל עכשיו" → `/auth`, "נסה דמו" → demo data + `/dashboard`
- Route `*` מפנה ל-`/` (לא ל-`/dashboard`)

### CalendarView
- Grid: `32px (ראשון מוקטן + מעומעם) + repeat(6,1fr) + 100px (שבוע)`
- כל תא: WR pill צבעוני (ירוק ≥60%, כתום 40-60%, אדום <40%) + P&L + symbol badges **אופקיים** (flex-wrap)
- עמודת שבוע: P&L + WR% pill + W/L count, גבול ירוק/אדום
- יום ראשון: opacity 0.45, מוקטן (שוק סגור)

### TradeModal
- **SymbolPicker**: dropdown 50+ חוזים עם חיפוש וקטגוריות
- **R:R Calculator**: מחושב מ-futures.ts pointValue המדויק לכל סמל
  - `estWin = TP × size × pointValue`
  - `estLoss = SL × size × pointValue`
  - `minWR = 1 / (1 + RR)`
- **DailySummary popup**: מוצג 8 שניות אחרי שמירה עם progress bar
  - P&L יומי + WR יומי + best trade + סיכום שבוע
- **Media (צילומי מסך)**:
  - העלאה: drag & drop או click, מרובה תמונות
  - שמירה: `dbUploadTradeMedia(tradeId, userId, files)` → Supabase Storage bucket `trade-media` (נתיב: `{userId}/{tradeId}/{uuid}.ext`) + שורה ב-`trade_media`
  - טעינה: `loadUserData` עושה `select('*, trade_media(*)')` ומאכלס `trade.media`
  - הצגה בעריכה: `dbGetTradeMediaUrls` מייצר Signed URLs (שעה) ומציג בגלריה
  - תמונות: רוחב מלא (`max-height: 320px`, `object-fit: contain`)
  - לחיצה על תמונה → Lightbox fullscreen (95vw × 92vh)

### Analytics (8 גרפים Canvas — ללא ספריות)
Tabs: Equity Curve | Drawdown | P&L by Day | P&L by Symbol | Monthly Heatmap | Distribution | Risk/Reward Scatter | Streak Analysis

#### ByDayChart — נקודות חשובות
- `pT = 32` (לא 20) — מרווח עליון מספיק
- לייבל P&L **בתוך** העמודה (טקסט לבן, near open end): עמודה חיובית → `bY + 13`, שלילית → `bY + bH - 4`
- עמודה קצרה (<18px) → לייבל מחוץ, נועל בתוך גבולות הגרף עם `Math.max/min`

### BrokerImport
- **Tradovate Performance CSV**: פורמט מיוחד
  - P&L: `$(110.00)` = שלילי, `$470.00` = חיובי
  - שורות fills בודדות → מאוחד לפי `buyFillId`
  - כיוון: buyPrice ≤ sellPrice = long, אחרת short
  - נרמול סמל: `MNQM6` → `MNQ`
- **TopstepX**: API Token (לא OAuth)
- מניעת כפילויות לפי `broker_trade_id`

### futures.ts
50+ חוזים עם `pointValue` מדויק:
```
NQ=$20, MNQ=$2, ES=$50, MES=$5, CL=$1000, GC=$100, SI=$5000...
```

---

## עיצוב וצבעים (Design System — Stitch)

### CSS Variables (index.css)
```css
--b: #3fe56c     /* ירוק ראשי (שונה מ-#5b8fff כחול) */
--b2: #00c853    /* ירוק כהה */
--b-bg: rgba(63,229,108,.08)
--b-bd: rgba(63,229,108,.30)
--g: #00e0a8     /* ירוק רווח */
--r: #ff4060     /* אדום הפסד */
--o: #ffaa44     /* כתום אזהרה */
--t1/t2/t3       /* טקסט ראשי/משני/hint */
--s1/s2          /* רקעים */
--bd/bd2         /* גבולות */
```

### btn-primary
```css
background: linear-gradient(135deg, #3fe56c, #00c853);
color: #002e0f;
```

### לוגו (בכל המקומות)
- אייקון SVG: `background: var(--b)` (ירוק), `stroke="#003912"`
- טקסט "TradeLog": `color: var(--t1)` — **לא** `var(--b)`, לא כחול, לא ירוק
- SplashScreen ב-App.tsx: אייקון `#3fe56c`, spinner `#3fe56c`
- Analytics canvas: `const B = '#3fe56c'`
- PDF export logo: `background:#3fe56c`, `stroke="#003912"`
- Default strategy color: `'#3fe56c'`

---

## נגישות
- **תוסף**: Negishot (`https://negishot.co.il/cdn/widget.php?code=NGS_66308FB7ECE1`)
- נטען ב-`index.html` כ-`<script src="...">`
- פיצ'רים: הגדלת טקסט, ניגודיות גבוהה, ניווט מקלדת, הקראת טקסט (TTS), התאמת צבעים, התאמת גדלים
- הצהרת נגישות: `src/pages/Accessibility.tsx` — עב/en, מתייחסת ל-Negishot
- **לא** להשתמש ב-`AccessibilityWidget.tsx` — הוחלף בתוסף חיצוני

---

## Vercel Env Vars
```
VITE_SUPABASE_URL=https://mxzyfmuktsyazkfxglzb.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Supabase Auth Settings
- Site URL: `https://trade-log-osxu.vercel.app`
- Redirect URLs: `https://trade-log-osxu.vercel.app/**`
- Google OAuth: מוגדר ועובד

---

## דברים חשובים לזכור
1. **UUID בכל מקום** — אף פעם לא `Date.now()` כ-ID
2. **ResizeObserver** על canvas ב-Analytics — עובד במובייל ובין tabs
3. **loadDataInBackground** — פותח UI מיד, Supabase ברקע
4. **RTL**: `dir={lang === 'he' ? 'rtl' : 'ltr'}` על כל modal; דף נחיתה: `dir="rtl"` על wrapper, `dir="ltr"` על `<header>`
5. **Sidebar**: מוסתר במובייל, hamburger + overlay
6. **לוגו קליקבילי** בכל מקום → `/dashboard`
7. **Landing CSS**: namespace `.lp-*` מבודד — אין קונפליקט עם CSS של האפליקציה
8. **Trade Media**: bucket בשם `trade-media` ב-Supabase Storage (private). RLS על storage.objects לפי `(storage.foldername(name))[1] = auth.uid()::text`. טבלת `trade_media` עם עמודות: `id, trade_id, user_id, storage_path, label, created_at`

---

## מה עוד דיברנו לבנות (לא הושלם)
- **מנויים בתשלום**: ₪69/חודש + ₪590/שנה + 14 יום ניסיון חינם
  - **פלטפורמת תשלום**: Lemon Squeezy (לא Stripe) — פועל כ-Merchant of Record, מתאים לעוסק פטור לא רשמי, מטפל במע"מ וחשבוניות
  - נדרש: Supabase `profiles` schema (`subscription_status`, `trial_ends_at`, `lemonsqueezy_customer_id`), webhook handler, `useSubscription` hook, Paywall UI, email reminders
- Push notifications במובייל
- התראות יעד יומי (יעד רווח / יעד הפסד)
- השוואה שבוע/חודש ב-StatsBar (חץ ↑↓ ליד כל מספר)
- Keyboard shortcuts (N=עסקה חדשה, Esc=סגור)
- Onboarding wizard למשתמש חדש
- שינוי עיצוב כללי (דוגמאות הוצגו: TraderSync Dark Pro, Bloomberg Terminal, Bento Box...)
