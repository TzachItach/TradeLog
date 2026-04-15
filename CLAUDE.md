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
  App.tsx                  — Router, AuthListener, AppEffects
  store.ts                 — Zustand store + Supabase sync
  i18n.ts                  — עברית/אנגלית (80+ מחרוזות)
  types.ts                 — TypeScript interfaces
  mockData.ts              — Demo data
  index.css                — Dark/Light themes, RTL, mobile responsive
  lib/
    supabase.ts            — Client + DEMO_MODE
    db.ts                  — loadUserData, dbSave*, dbSeedNewUser
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
    AccessibilityWidget.tsx — font size, contrast, grayscale, dark/light
  pages/
    Dashboard.tsx          — Stats + Calendar
    TradesList.tsx         — טבלה עם פילטרים
    Analytics.tsx          — 8 גרפים Canvas: Equity, Drawdown, ByDay, BySymbol,
                             Heatmap, Distribution, RR Scatter, Streaks
    Reports.tsx            — Export PDF + CSV
    Settings.tsx           — חשבונות + אסטרטגיות + CSV Import + logout
    Auth.tsx               — Google OAuth בלבד (Apple הוסר)
    Terms.tsx / Privacy.tsx — דפים משפטיים עב/en
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

### Analytics (8 גרפים Canvas — ללא ספריות)
Tabs: Equity Curve | Drawdown | P&L by Day | P&L by Symbol | Monthly Heatmap | Distribution | Risk/Reward Scatter | Streak Analysis

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

## CSS Variables (index.css)
```css
--b: #5b8fff    /* כחול ראשי */
--g: #00e0a8    /* ירוק רווח */
--r: #ff4060    /* אדום הפסד */
--o: #ffaa44    /* כתום אזהרה */
--t1/t2/t3      /* טקסט ראשי/משני/hint */
--s1/s2         /* רקעים */
--bd/bd2        /* גבולות */
--b-bg/b-bd     /* כחול background/border */
```

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
4. **RTL**: `dir={lang === 'he' ? 'rtl' : 'ltr'}` על כל modal
5. **Sidebar**: מוסתר במובייל, hamburger + overlay
6. **לוגו קליקבילי** בכל מקום → `/dashboard`

---

## מה עוד דיברנו לבנות (לא הושלם)
- Push notifications במובייל
- התראות יעד יומי (יעד רווח / יעד הפסד)
- השוואה שבוע/חודש ב-StatsBar (חץ ↑↓ ליד כל מספר)
- Keyboard shortcuts (N=עסקה חדשה, Esc=סגור)
- Onboarding wizard למשתמש חדש
- שינוי עיצוב כללי (דוגמאות הוצגו: TraderSync Dark Pro, Bloomberg Terminal, Bento Box...)
