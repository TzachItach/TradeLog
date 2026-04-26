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
supabase/
  functions/
    broker-oauth/index.ts    — Edge Function: מאמת API key מול ProjectX, שומר credentials ב-broker_connections
    topstepx-sync/index.ts   — Edge Function: מאמת, מושך עסקאות (90 יום אחרונים / מ-last_synced_at), מכניס ל-trades
    tradovate-auth/index.ts  — Edge Function: מאמת username+password מול Tradovate (live/demo), שומר ב-broker_connections
    tradovate-sync/index.ts  — Edge Function: מושך execution reports, מזהה closing fills, resolves contractId→symbol, מכניס ל-trades
  migrations/
    topstepx_broker_connections.sql — הוספת עמודות + unique constraint + RLS ל-broker_connections
    business_manager.sql     — יצירת טבלאות prop_expenses + prop_payouts עם RLS
    tradovate_broker.sql     — הוספת tradovate_account_id + broker_env ל-broker_connections
  store.ts                 — Zustand store + Supabase sync
  i18n.ts                  — עברית/אנגלית (80+ מחרוזות)
  types.ts                 — TypeScript interfaces (כולל PropExpense, PropPayout, ExpenseFeeType)
  mockData.ts              — Demo data (כולל MOCK_EXPENSES, MOCK_PAYOUTS)
  index.css                — Dark/Light themes, RTL, mobile responsive
  lib/
    supabase.ts            — Client + DEMO_MODE
    db.ts                  — loadUserData, dbSave*, dbSeedNewUser, dbUploadTradeMedia, dbGetTradeMediaUrls,
                             dbSaveExpense, dbDeleteExpense, dbSavePayout, dbDeletePayout
    futures.ts             — 50+ חוזים עתידיים עם pointValue מדויק
    propfirm.ts            — calcPropFirmStats() → PropFirmStats interface
    business.ts            — calcBusinessStats() → BusinessStats interface (ניהול עסקי)
  components/
    Layout.tsx             — Shell: Sidebar + Header + Outlet
    Sidebar.tsx            — ניווט + mobile overlay
    Header.tsx             — Account tabs + hamburger + logo + ThemeToggle
    BottomNav.tsx          — Mobile bottom navigation (≤768px), 5 icons
    StatsBar.tsx           — 6 KPI cards
    CalendarView.tsx       — לוח שנה + WR pill + עמודת שבוע + יום ראשון מוקטן
    TradeModal.tsx         — טופס עסקה + RR Calculator + DailySummary + Media upload
    DailySummary.tsx       — Popup אחרי שמירה: P&L יומי + שבועי + best trade
    DailyGoalBar.tsx       — סרגל יעד יומי (רווח + הפסד מקסימלי)
    MiniEquityChart.tsx    — Canvas equity curve לחודש הנוכחי (ב-Dashboard)
    RecentTrades.tsx       — 5 עסקאות אחרונות עם לחיצה לעריכה (ב-Dashboard)
    PropFirmCard.tsx       — כרטיסי Prop Firm ב-Dashboard (מד drawdown + profit target)
    SymbolPicker.tsx       — Dropdown 50+ חוזים עם חיפוש וקטגוריות
    BrokerImport.tsx       — ייבוא CSV מ-Tradovate/TopstepX (עם פרסור fills)
    ProductTour.tsx        — סיור אינטראקטיבי Driver.js: 5 עמודים, spotlight + tooltips, setup modal
    AccessibilityWidget.tsx — קומפוננט ישן (לא בשימוש — הוחלף ב-Negishot)
  pages/
    Landing.tsx            — דף נחיתה שיווקי (route: /)
    Dashboard.tsx          — Stats + Calendar + MiniEquityChart + RecentTrades
    TradesList.tsx         — טבלה עם פילטרים
    Analytics.tsx          — 8 גרפים Canvas: Equity, Drawdown, ByDay, BySymbol,
                             Heatmap, Distribution, RR Scatter, Streaks
    PropFirm.tsx           — Prop Firm Tracker: כרטיסי חשבון עם מדים
    BusinessManager.tsx    — ניהול עסקי: הוצאות, משיכות, KPIs, גרף, מדד עסקי
    Reports.tsx            — Export PDF + CSV
    Settings.tsx           — חשבונות + אסטרטגיות + BrokerSection (TopstepX/Tradovate connect/sync) + logout + כפתורי "סנכרן" ו-"מדריך כניסה" (btn-ghost)
    AppLogo.tsx            — קומפוננטת לוגו responsive עם dark/light switching
    Auth.tsx               — Google OAuth בלבד
    Accessibility.tsx      — הצהרת נגישות עב/en (מתייחסת ל-Negishot)
    Terms.tsx / Privacy.tsx — דפים משפטיים עב/en
    RiskDisclosure.tsx     — גילוי סיכונים עב/en (route: /risk-disclosure)
    Guides.tsx             — מדריכים לשימוש עב (route: /guides)
    guides.css             — CSS מבודד לדף המדריכים
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

### הגנות חשובות ב-loadDataInBackground
- אם שאילתת `accounts` נכשלת ב-Supabase → **throw** (לא מחזיר [] בשקט) → `.catch()` שומר cache
- `isNewUser` נבדק רק אם `lastUserId !== userId` — משתמש מוכר **לעולם לא** מקבל seeding מחדש
- עדכון state רק כשחזרו נתונים אמיתיים (`accounts.length > 0`)
- מאפס `selectedAccount: 'all'` בכל טעינה מוצלחת — פילטר חשבון לא מסתיר עסקאות
- כפתור **"סנכרן"** ב-Settings → `reloadFromCloud()` — טעינה מחדש בלי רענון דף

---

## Database Schema
טבלאות: `profiles`, `accounts`, `strategies`, `strategy_fields`, `trades`, `trade_media`, `broker_connections`, `sync_log`, `prop_expenses`, `prop_payouts`

**`broker_connections`** — עמודות:
```
id, user_id, account_id, broker,
api_username (text),          -- email (TopstepX + Tradovate)
api_key (text),               -- API key (TopstepX) / password (Tradovate)
projectx_account_id (int),    -- numeric ID מה-ProjectX API (TopstepX)
tradovate_account_id (int),   -- numeric ID מה-Tradovate API
broker_env (text),            -- 'live' | 'demo' (Tradovate בלבד)
is_active (bool),
last_synced_at (timestamptz)  -- נקודת התחלה לסנכרון הבא
UNIQUE (user_id, account_id, broker)
```

**חשוב**: כל `id` חייב להיות **UUID** (`crypto.randomUUID()`) — לא `t-${Date.now()}`!

RLS: כל טבלה עם `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

---

## פיצ'רים שנבנו

### Dashboard (`/dashboard`)
- **StatsBar**: 6 KPI cards
- **DailyGoalBar**: סרגל יעד יומי (רווח + הפסד מקסימלי)
- **CalendarView**: לוח שנה חודשי
- **Bottom Row**:
  - **MiniEquityChart**: Canvas equity curve לחודש הנוכחי — P&L מצטבר לפי יום, קו ירוק/אדום + gradient fill + נקודה בקצה + labels תאריכים + ResizeObserver
  - **AIInsightsCard**: מתחת ל-MiniEquityChart, בתוך עמודת עקומת ההון. תובנות rule-based (ללא AI API): יום חזק/חלש, סמל טוב/גרוע, רצף ניצחונות/הפסדים, מסחר יתר, מגמת WR, R:R, השוואת שבועות. לוגיקה ב-`src/lib/insights.ts`
  - **RecentTrades**: 5 עסקאות אחרונות — symbol icon (ירוק=long, אדום=short), תאריך, P&L; לחיצה → פתיחת modal עריכה; "הכל" → `/trades`
  - Layout: `grid-template-columns: 1fr 320px` בדסקטופ, עמודה אחת במובייל

### Landing Page (`/`)
- דף נחיתה **דו-לשוני** (עברית RTL / אנגלית LTR) עם CSS מבודד `.lp-*`
- **כפתור שפה** `עב / EN` ב-Nav → `setLang` → `dir` משתנה על `.lp` div
- סקציות: Nav, Hero + mockup, Social Proof, Features Bento, Pricing, Testimonials (3 כרטיסים), FAQ (5 שאלות `<details>`), CTA, Footer
- תמחור: NIS (שקלים) — ₪69/חודש | ₪699/שנה (חיסכון 16%) — אין תוכנית lifetime
- כפתורים: "התחל עכשיו" → `/auth`, "Live Demo" → demo data + `/dashboard`
- Route `*` מפנה ל-`/` (לא ל-`/dashboard`)
- **לוגואים**: Nav=56px, Footer=52px, Mockup sidebar=36px — כולם `/logo.png` עם `mix-blend-mode:screen` inline
- **Mockup**: משתמש ב-`/logo.png` (לא `/logo-icon.png` שלא קיים)
- Social section: `justify-content: center`
- Pricing + CTA: תמיד `dir="ltr"` (לא מושפעים מהשפה)

#### Footer — מבנה
- **3 עמודות** (`.lp-footer-cols`): קישורים מהירים | קישורים שימושיים | צור קשר
  - קישורים מהירים: פיצ'רים, פלטפורמות, מחירים, שאלות ותשובות
  - קישורים שימושיים: מדריכים (`/guides`), שאלות נפוצות, תנאי שימוש, מדיניות פרטיות, Risk Disclosure (`/risk-disclosure`)
  - צור קשר: `tradelogisr@gmail.com` (אימייל בלבד — ללא טלפון)
- **Bottom bar** (`.lp-footer-bottom`): לוגו + copyright + לינקים משפטיים
- direction: rtl, background: `#0d0d0d`

### CalendarView
- Grid: `32px (ראשון מוקטן + מעומעם) + repeat(6,1fr) + 100px (שבוע)`
- כל תא: WR pill צבעוני (ירוק ≥60%, כתום 40-60%, אדום <40%) + P&L + symbol badges **אופקיים** (flex-wrap)
- עמודת שבוע: P&L + WR% pill + W/L count, גבול ירוק/אדום
- יום ראשון: opacity 0.45, מוקטן (שוק סגור)

### TradeModal
- **SymbolPicker**: dropdown 50+ חוזים עם חיפוש וקטגוריות
- **R:R Calculator**: מחושב מ-futures.ts pointValue המדויק לכל סמל
- **DailySummary popup**: מוצג 8 שניות אחרי שמירה עם progress bar
- **Media**: drag & drop → Supabase Storage `trade-media` bucket → gallery + lightbox

### Prop Firm Tracker (`/dashboard/prop-firm`)
- קובץ לוגיקה: `src/lib/propfirm.ts` → `calcPropFirmStats(account, trades): PropFirmStats`
- **PropFirmStats** כולל:
  - `currentBalance`, `trailingFloor`, `highWaterMark`
  - `drawdownUsed`, `drawdownRemaining`, `drawdownPct`
  - `todayPnL`, `dailyLimitUsed`, `dailyLimitRemaining`, `dailyLimitPct`
  - `profitPnL`, `profitPct`, `profitRemaining`, `profitTargetBalance`
  - `daysTraded`, `daysSinceStart`, `daysRemaining`
  - `status: 'safe' | 'warning' | 'danger' | 'breached' | 'passed'`
- **KPI boxes** (challenge עם יעד): יתרה | רצפה | יעד | נותר ליעד | P&L היום
  - Grid: `auto-fill, minmax(120px, 1fr)` — responsive (2 עמודות במובייל, 4-5 בדסקטופ)
- **Meter bars**: Drawdown + Daily Limit + Profit Target
  - שורות: `flexWrap: wrap` + `gap` — לא גולשות במובייל
- **Alerts**: `breached` → banner אדום; `passed` → banner ירוק
- גם מוצג ב-Dashboard דרך `PropFirmCard.tsx` (mini version)

### Business Manager (`/dashboard/business`)
- קובץ לוגיקה: `src/lib/business.ts` → `calcBusinessStats(accounts, trades, expenses, payouts): BusinessStats`
- **BusinessStats** כולל:
  - `totalExpenses`, `totalPayouts`, `netProfit`
  - `cpa` (Cost Per Account = totalExpenses / max(fundedAccounts, payoutCycles))
  - `avgBurnDays`, `fundedAccountCount`
  - `gamblingMeterScore` (0–100 = min(100, payouts/expenses/2 * 100))
  - `breakEvenProgress`, `currentMonthExpenses`, `currentMonthPayouts`
  - `tiltAlert` (≥2 evaluations ב-48h), `payoutPending`, `sizeOptimizationTip`
  - `monthly: MonthlySnapshot[]` — 12 חודשים אחרונים לגרף
- **UI** (הכל ב-`BusinessManager.tsx`):
  - 5 KPI cards: Revenue | Expenses | Net Profit | CPA | Avg Account Life
  - Break-even progress bar לחודש הנוכחי
  - GamblingMeter: גרדיאנט אדום→ירוק + מחוג + status text
    - **חשוב**: `dir="ltr"` על שורת הלייבלים — מונע היפוך בRTL
  - Revenue vs Expenses bar chart (Canvas) — effect אחד עם `[monthly, isHe, hasAnyData]` deps
    - `hasAnyData = expenses.length > 0 || payouts.length > 0` (לא תלוי ב-12 חודשים)
  - Smart Insights: Tilt Alert | Low-Risk Mode | Size Optimization | Break-Even tip
  - LogsSection עם tabs: הוצאות / משיכות + עריכה/מחיקה
  - EntryModal: הוצאה (firm, size, fee_type, amount, date, notes) | משיכה (firm, amount, date, notes)
- **DB**: `prop_expenses` + `prop_payouts` — migration ב-`supabase/migrations/business_manager.sql`
- **Store**: `expenses[]`, `payouts[]` + 6 CRUD actions: `addExpense`, `updateExpense`, `deleteExpense`, `addPayout`, `updatePayout`, `deletePayout`
- **מינוח בעברית**: הוצאה = expense, **משיכה** = payout (לא "תשלום")
- **כותרת הדף**: `'ניהול עסקי'` (עברית) / `'Business Manager'` (אנגלית)

### Product Tour (`ProductTour.tsx`)
- **ספרייה**: `driver.js` (MIT) — spotlight + tooltips
- **טריגר**: משתמש חדש (`!onboardingDone`) + כפתור "מדריך כניסה" ב-Settings
- **כפתור "מדריך כניסה"**: מנווט ל-`/dashboard` ואז מאפס `onboardingDone: false`
- **שלבים**:
  1. **Setup modal** — שם חשבון, סוג, יתרה, יעד יומי + מקסימום הפסד (אופציונלי, ניתן לדלג)
  2. **Dashboard** — 5 spotlights: `#tour-statsbar`, `#tour-daily-goal`, `#tour-calendar`, `#tour-equity-chart`, `#tour-new-trade`
  3. **Bridge modal** → navigate ל-Analytics
  4. **Analytics** — spotlight: `#tour-analytics-tabs`
  5. **Bridge modal** → navigate ל-Prop Firm
  6. **PropFirm** — spotlight: `#tour-propfirm`
  7. **Bridge modal** → navigate ל-Business Manager
  8. **Business Manager** — 2 spotlights: `#tour-business-kpis`, `#tour-gambling-meter`
  9. **Bridge modal** → navigate ל-Settings
  10. **Settings** — 2 spotlights: `#tour-strategy-section` (צור אסטרטגיה), `#tour-broker-section` (חבר ברוקר)
  11. **Done screen** — 3 אפשרויות: הוסף עסקה / ייבא / dashboard
- **Skip button**: צף בפינה בכל שלב של Driver.js
- **IDs שנוספו לקומפוננטות**: `#tour-statsbar` (StatsBar), `#tour-daily-goal` (DailyGoalBar), `#tour-calendar` (CalendarView), `#tour-equity-chart` (Dashboard), `#tour-new-trade` (Header), `#tour-analytics-tabs` (Analytics), `#tour-propfirm` (PropFirm), `#tour-business-kpis` + `#tour-gambling-meter` (BusinessManager), `#tour-strategy-section` + `#tour-broker-section` (Settings)
- **store**: `onboardingDone: boolean` — ללא `onboardingVariant` (הוסר לאחר A/B testing)

### Risk Disclosure (`/risk-disclosure`)
- דף משפטי עב/en עם מתג שפה, בסגנון זהה ל-Terms/Privacy
- 7 סקשנים: אין ייעוץ השקעות | סיכון אובדן הון | ביצועי עבר | אחריות מוגבלת | התאמה אישית | תאימות רגולטורית | דיוק הנתונים
- **גלילה**: כמו Terms — `overflowY: 'auto'` על ה-div הראשי (body overflow:hidden גלובלי)

### Guides (`/guides`)
- **מדריכים לשימוש** בעברית — דף standalone (לא בתוך Layout)
- 6 מדריכים: התחלה מהירה | הוספת עסקה | ייבוא אוטומטי | דשבורד ולוח שנה | אנליטיקס | Prop Firm Tracker
- כל מדריך: צעדים ממוספרים + tips/warnings + **CSS mockup** (מדמה את ה-UI האמיתי)
- **TOC צמוד** (desktop): `position: sticky; top: 72px`, מדגיש סקשן נוכחי עם IntersectionObserver (`rootMargin: '-15% 0px -75% 0px'`)
- **כפתורי הקודם/הבא** בתחתית כל מדריך (`GuideNav` component)
- **כרטיסי ניווט במובייל**: horizontal scroll chips (`overflow-x: auto; flex-wrap: nowrap`), ללא scrollbar, כל chip 130px (אימוג׳ + כותרת בלבד)
- **גלילה**: `height: 100vh; overflow-y: auto` על `.guides-page` (פותר חסימת body overflow:hidden)
- **חזור**: לינק `href="/"` (לא `navigate(-1)` שלא עובד בכניסה ישירה)
- CSS: `src/pages/guides.css` — מבודד, ללא קונפליקט עם styles של האפליקציה

#### ⚠️ דפים standalone (לא בתוך Layout) — חובה לגלילה
כל דף שאינו בתוך `.app-shell` (כמו Guides, Terms, Privacy, RiskDisclosure) חייב `overflowY: 'auto'` (או `height: 100vh; overflow-y: auto` ב-CSS) כי `html, body { overflow: hidden }` בשורה 77 ב-index.css חוסם גלילה.

### Analytics (8 גרפים Canvas — ללא ספריות)
Tabs: Equity Curve | Drawdown | P&L by Day | P&L by Symbol | Monthly Heatmap | Distribution | Risk/Reward Scatter | Streak Analysis

#### ByDayChart — נקודות חשובות
- `pT = 32` (לא 20) — מרווח עליון מספיק
- לייבל P&L **בתוך** העמודה: חיובית → `bY + 13`, שלילית → `bY + bH - 4`
- עמודה קצרה (<18px) → לייבל מחוץ, נועל בתוך גבולות הגרף עם `Math.max/min`

### BrokerImport
- **Tradovate Performance CSV**: פורמט עמודות: `symbol, buyFillId, sellFillId, qty, buyPrice, sellPrice, pnl, boughtTimestamp, soldTimestamp, duration`
  - P&L: `$(110.00)` = שלילי, `$470.00` = חיובי (כולל `"$(1,200.00)"` עם פסיק)
  - **כיוון per-row**: `boughtTimestamp ≤ soldTimestamp` = long, אחרת short (פורמט `MM/DD/YYYY HH:MM:SS` — string comparison עובד)
  - **גיווס**: long → לפי `buyFillId` (fill פותח), short → לפי `sellFillId` (fill פותח)
    - ⚠️ לפני התיקון: גיווס לפי `buyFillId` בלבד — שורטים התפצלו לכמה עסקאות במקום אחת, ולונגים מפסידים סומנו כשורט
  - נרמול סמל: `MNQM6` → `MNQ`
- **TopstepX**: API Token
- מניעת כפילויות לפי `broker_trade_id`

### futures.ts
50+ חוזים עם `pointValue` מדויק:
```
NQ=$20, MNQ=$2, ES=$50, MES=$5, CL=$1000, GC=$100, SI=$5000...
```

---

## עיצוב וצבעים (Design System — Spotify Dark)

### עקרון ראשי
**Dark-first**: `darkMode: true` כברירת מחדל. `:root` = light, `body.dark` = dark.
- `body.classList.toggle('dark', darkMode)` ב-AppEffects
- store `version: 4` + migrate: darkMode → `true`, `onboardingDone` → `true` למשתמשים קיימים (עם נתונים)

### CSS Variables (index.css)
```css
/* :root — Light */
--bg:   #FFFFFF;  --s1: #FAFAFA;  --s2: #F3F3F3;  --s3: #E8E8E8;
--bd:   rgba(0,0,0,.08);  --bd2: rgba(0,0,0,.14);
--t1:   #000000;  --t2: rgba(0,0,0,.70);  --t3: #6A6A6A;
--g:    #1DB954;  --r: #E91429;  --b: #1DB954;  --o: #F59B23;
--rad: 8px;  --rad-l: 12px;  --rad-pill: 999px;

/* body.dark — Dark */
--bg:   #121212;  --s1: #181818;  --s2: #282828;  --s3: #333333;
--bd:   rgba(255,255,255,.06);  --bd2: rgba(255,255,255,.12);
--t1:   #FFFFFF;  --t2: #B3B3B3;  --t3: #737373;
--g:    #1DB954;  --r: #ff4d60;  --o: #F59B23;
```

### Sidebar
```css
.sidebar { background: #000000; }  /* תמיד שחור — גם ב-light mode */
```

### Buttons
```css
.btn-primary { background: var(--g); color: #000000; border-radius: var(--rad-pill); }
.btn-ghost   { background: transparent; border: 1.5px solid var(--bd2); color: var(--t2); padding: 8px 16px; border-radius: var(--rad-pill); }
.btn-ghost:hover { border-color: var(--t1); color: var(--t1); }  /* hover effect */
.btn-danger  { background: rgba(233,20,41,.10); color: var(--r); border: 1.5px solid rgba(233,20,41,.28); border-radius: var(--rad-pill); }
```
- כפתורים ניטרליים (סנכרן, מדריך כניסה וכו') → **`btn-ghost`** — לא inline style

### לוגו (`AppLogo.tsx`)
- קבצים: `public/logo.png` (לבן על שחור — dark mode), `public/logo-light.png` (שחור על לבן — light mode)
- קומפוננטה: `<AppLogo size="md|lg" forceLight? onClick? />`
  - `forceLight=true` → תמיד `logo.png` (ל-sidebar שתמיד שחור)
  - `size="md"` → 48px desktop / 52px mobile + border-radius 10px
  - `size="lg"` → 160px (ב-sidebar)
- **Mix-blend-mode** (מוחק רקע מוצק):
  ```css
  body.dark .app-logo        { mix-blend-mode: screen; }   /* מוחק שחור */
  body:not(.dark) .app-logo  { mix-blend-mode: multiply; } /* מוחק לבן */
  .sidebar .app-logo         { mix-blend-mode: normal !important; } /* sidebar=#000, אין צורך */
  ```
  - **שים לב**: `body:not(.dark) .app-logo` specificity = 0,2,1 (כולל element) → חייב `!important` לסידבר
- **Landing page**: לוגואים עם `mix-blend-mode: screen` (inline) — הרקע תמיד `#121212`
- SplashScreen: `background: #121212`, spinner `#1DB954`

### Analytics Canvas Colors
```tsx
const G = '#1DB954';  const R = '#E91429';  const B = '#1DB954';  const O = '#F59B23';
```
`isDark` detection: `document.body.classList.contains('dark')`

### Theme Toggle
- `ThemeToggle` ב-Header.tsx — עיגול חצוי: שמאל שחור / ימין לבן
- נמצא ב-header בכל מסך

### Landing Page
- תמיד dark: `.lp { background: #121212; }`
- `.lp-btn-primary { background: #1DB954; color: #000; border-radius: 999px; }`

---

## Mobile UX

### Breakpoints
- `≤768px` — bottom nav מופיע, sidebar נסתר
- `≤480px` — single-column grids, smaller calendar

### Bottom Navigation (`BottomNav.tsx`)
- 5 פריטים: Calendar | Trades | **+ ירוק (48px)** | Analytics | Settings
- `position: fixed; bottom: 0; height: 60px`
- Content: `padding-bottom: 60px`

### Header במובייל
- לוגו: `position: absolute; left: 50%; transform: translateX(-50%)`, 52px + border-radius 10px
- כפתור "+ New Trade": מוסתר (`.header-new-trade-btn { display: none }`)

### Negishot Accessibility Widget
- ID: `#negishot-widget`, CSS override ב-mobile: `bottom: 70px !important`

---

## נגישות
- **תוסף**: Negishot (`https://negishot.co.il/cdn/widget.php?code=NGS_66308FB7ECE1`)
- נטען ב-`index.html` כ-`<script src="...">`
- הצהרת נגישות: `src/pages/Accessibility.tsx`
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
2. **ResizeObserver** על כל canvas — Analytics + MiniEquityChart + BusinessManager chart
3. **loadDataInBackground** — פותח UI מיד, Supabase ברקע
4. **RTL**: `dir={lang === 'he' ? 'rtl' : 'ltr'}` על כל modal
5. **Sidebar**: מוסתר במובייל, hamburger + overlay
6. **לוגו קליקבילי** בכל מקום → `/dashboard`
7. **Landing CSS**: namespace `.lp-*` מבודד — אין קונפליקט עם CSS של האפליקציה
8. **Trade Media**: bucket `trade-media` ב-Supabase Storage (private). טבלת `trade_media`: `id, trade_id, user_id, storage_path, label, created_at`
9. **Currency**: P&L ועסקאות — USD בלבד (`formatPnL()` = `$`). **מחירי מנויים** — ₪ בלבד (Landing page pricing)
10. **Design**: Spotify Dark — אין #0071e3, אין Apple Light. Accent = `#1DB954`

---

### TopstepX Auto Import (ProjectX Gateway API)
- **API Base**: `https://api.topstepx.projectx.com` (env var `TOPSTEPX_BASE_URL`)
- **Auth endpoint**: `POST /api/Auth/loginKey` → `{userName, apiKey}` → `{token}`
- **Accounts**: `POST /api/Account/search` → `{onlyActiveAccounts: true}` → `{accounts[].id}`
- **Trades**: `POST /api/Trade/search` → `{accountId, startTimestamp, endTimestamp}` → `{trades[]}`
  - `profitAndLoss === null` = half-turn (לא עסקה שלמה) — מדלגים
  - `voided === true` — מדלגים
  - `side: 0` (sell=סגר long) → `direction: 'long'` | `side: 1` (buy=סגר short) → `direction: 'short'`
  - `contractId` נורמלי: `CON.F.US.MNQ.M25` → `MNQ` | `MNQM5` → `MNQ`
  - `pnl = profitAndLoss - fees`
  - `broker_trade_id = topstepx-{id}`
- **Flow בSettings**: Enter API Key → Connect (קורא `broker-oauth`) → Sync Now (קורא `topstepx-sync`)
- **Deployed**: פרוס ב-Supabase project `mxzyfmuktsyazkfxglzb`

---

### Tradovate Auto Import (Tradovate REST API)
- **API Base**: `https://live.tradovateapi.com/v1` (live) | `https://demo.tradovateapi.com/v1` (eval/demo)
  - ⚠️ Domain ישן `tradovate.com` → **לא עובד** (Supabase IPs חסומות + domain שינה)
- **Auth מבוצע דרך Vercel Serverless Function** (`api/tradovate-auth.ts`) — לא Supabase Edge Function
  - הסיבה: Supabase IPs חסומות ע"י Tradovate; Vercel IPs עוברות
  - פורמט: Node.js `IncomingMessage/ServerResponse` (לא Web API `Request/Response`)
  - Settings.tsx קורא ל-`/api/tradovate-auth` (לא ל-Supabase function)
- **Auth endpoint**: `POST /auth/accesstokenrequest` → `{name, password, appId, appVersion, deviceId, cid:0, sec:""}` → `{accessToken}`
- **Accounts**: `GET /account/list` → `{accounts[].id}`
- **Trades**: `GET /executionReport/list` → סינון closing fills (grossPL !== 0)
  - `side: "Sell"` (סגר long) → `direction: 'long'` | `side: "Buy"` (סגר short) → `direction: 'short'`
  - `pnl = grossPL - commission`
  - contractId נומרי → `GET /contract/item?id={id}` → `name` → normalizeSymbol (parallel)
  - `broker_trade_id = tradovate-{id}`
- **Env vars** (Supabase Secrets, אופציונלי — cid:0 עובד ל-read-only):
  `TRADOVATE_APP_ID`, `TRADOVATE_CID`, `TRADOVATE_SEC`
- **Flow בSettings**: בחר Live/Demo → הכנס email+password → Connect (קורא `tradovate-auth`) → Sync Now (קורא `tradovate-sync`)
- **Demo/Eval accounts**: toggle "Demo / תיק מבחן" שולח לדמו URL — שומר `broker_env='demo'` ב-DB
- **Deployed**: פרוס ב-Supabase project `mxzyfmuktsyazkfxglzb`

---

## שיפורים שנעשו (אפריל 2026 — גל 2)

### דפים משפטיים ומדריכים
- **Risk Disclosure** (`/risk-disclosure`): דף גילוי סיכונים מלא עב/en עם 7 סקשנים חוקיים
- **Guides** (`/guides`): דף מדריכים עם 6 נושאים, TOC צמוד, ניווט הקודם/הבא, מובייל swipeable
- **Footer Landing**: שדרוג ל-3 עמודות + bottom bar; אימייל: `tradelogisr@gmail.com` בלבד

---

## שיפורים שנעשו (אפריל 2026)

### Expense Prompt בהוספת חשבון Prop Firm (`Settings.tsx`)
- כשיוצרים חשבון חדש מסוג `prop_firm` → popup שואל "הוסף לניהול עסקי?"
- שדות: עלות ($) + סוג (challenge/reset/activation/data_fee/other)
- אישור → יוצר `PropExpense` עם `account_id` + מוסיף ל-Business Manager
- דלג / לחיצה מחוץ → סוגר בלי לשמור

### Landing Page — Business Manager section
- סקשן חדש בין Advanced לPricing עם mockup: KPI cards + GamblingMeter + expense log
- דו-לשוני, badge כתום "חדש / New"

### Landing Page — שיפורים נוספים
- Nav: נוספו קישורים להמלצות (`#testimonials`) ושאלות (`#faq`)
- תנאי שימוש: כתובת "יהודה הלוי 21" (ללא עיר)

---

## מה עוד דיברנו לבנות (לא הושלם)
- **מנויים בתשלום**: ₪69/חודש + ₪699/שנה (ישראל בלבד — שקלים)
  - **פלטפורמת תשלום**: Cardcom (ישראלי, recurring billing, חשבוניות אוטומטיות) — או Stripe + iCount אם פותחים לבינלאומי
  - נדרש: `profiles` schema (`subscription_status`, `trial_ends_at`, `lemonsqueezy_customer_id`), webhook handler, `useSubscription` hook, Paywall UI
- Push notifications במובייל
- ~~התראות יעד יומי~~ — DailyGoalBar **הושלם** (bar ב-Dashboard)
- ~~Business Manager~~ — **הושלם** (`/dashboard/business`)
- השוואה שבוע/חודש ב-StatsBar (חץ ↑↓ ליד כל מספר)
- Keyboard shortcuts (N=עסקה חדשה, Esc=סגור)
- ~~Onboarding wizard למשתמש חדש~~ — **הושלם והוחלף** ב-`ProductTour.tsx` (ראה פרטים בסעיף Product Tour)

---

### SEO (אפריל 2026)
- **`index.html`**: title, description, canonical, OG tags (og:title/description/image/type), Twitter Card `summary_large_image`, JSON-LD `SoftwareApplication` schema
- **`public/robots.txt`**: Allow `/`, Disallow `/dashboard /auth /api/`, Sitemap pointer
- **`public/sitemap.xml`**: 5 URLs (/, /auth, /terms, /privacy, /accessibility) עם priority + changefreq
- **`public/og-image.png`**: 1200×630 — נוצר מ-`scripts/og-image.html` דרך Chrome headless
- **`public/googlefe5303f75b23b4bb.html`**: קובץ אימות Google Search Console
- **`vercel.json`**: Cache-Control headers לassets/images, rewrite מכסה את כל הנתיבים מחוץ ל-`/api/`
- **Sitemap הוגש** ל-Google Search Console לאחר אימות הדומיין

### Google Analytics + Facebook Pixel (ממתין ל-IDs)
- נדרש: `VITE_GA_MEASUREMENT_ID` (G-XXXXXXXXXX) + `VITE_FB_PIXEL_ID`
- יש לממש: טעינה **רק אחרי הסכמת cookies**, באנר cookies עם קבל/דחה, שמירה ב-localStorage
- חובה חוקית (GDPR): cookies אנליטיקס/פרסום דורשים הסכמה מפורשת

---

## פיצ'רים שנוסו ובוטלו
- **גרף עסקה (Trade Chart)** — נבנה ובוטל (אפריל 2026)
  - נוסה: `lightweight-charts` + סימולציה מבוססת נתוני עסקה + Polygon.io API
  - הבעיה: גרף סימולציה לא קשור מספיק לעסקה האמיתית, לא סיפר את הסיפור הנכון
  - **לא לנסות שוב** אלא אם יש גישה לנתוני OHLC אמיתיים לפיוצ'רס (Tradovate historical API / Databento)
