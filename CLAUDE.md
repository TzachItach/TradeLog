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
    propfirm.ts            — calcPropFirmStats() → PropFirmStats interface
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
    AccessibilityWidget.tsx — קומפוננט ישן (לא בשימוש — הוחלף ב-Negishot)
  pages/
    Landing.tsx            — דף נחיתה שיווקי (route: /)
    Dashboard.tsx          — Stats + Calendar + MiniEquityChart + RecentTrades
    TradesList.tsx         — טבלה עם פילטרים
    Analytics.tsx          — 8 גרפים Canvas: Equity, Drawdown, ByDay, BySymbol,
                             Heatmap, Distribution, RR Scatter, Streaks
    PropFirm.tsx           — Prop Firm Tracker: כרטיסי חשבון עם מדים
    Reports.tsx            — Export PDF + CSV
    Settings.tsx           — חשבונות + אסטרטגיות + CSV Import + logout
    Auth.tsx               — Google OAuth בלבד
    Accessibility.tsx      — הצהרת נגישות עב/en (מתייחסת ל-Negishot)
    Terms.tsx / Privacy.tsx — דפים משפטיים עב/en
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

### Dashboard (`/dashboard`)
- **StatsBar**: 6 KPI cards
- **DailyGoalBar**: סרגל יעד יומי (רווח + הפסד מקסימלי)
- **CalendarView**: לוח שנה חודשי
- **Bottom Row** (חדש):
  - **MiniEquityChart**: Canvas equity curve לחודש הנוכחי — P&L מצטבר לפי יום, קו ירוק/אדום + gradient fill + נקודה בקצה + labels תאריכים + ResizeObserver
  - **RecentTrades**: 5 עסקאות אחרונות — symbol icon (ירוק=long, אדום=short), תאריך, P&L; לחיצה → פתיחת modal עריכה; "הכל" → `/trades`
  - Layout: `grid-template-columns: 1fr 320px` בדסקטופ, עמודה אחת במובייל

### Landing Page (`/`)
- דף נחיתה שיווקי בעברית (RTL) עם CSS מבודד `.lp-*`
- סקציות: Nav, Hero + mockup, Social Proof, Features Bento, Pricing, CTA, Footer
- תמחור: USD (לא ₪) — $19/mo | $159/yr | $349 lifetime
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

### Analytics (8 גרפים Canvas — ללא ספריות)
Tabs: Equity Curve | Drawdown | P&L by Day | P&L by Symbol | Monthly Heatmap | Distribution | Risk/Reward Scatter | Streak Analysis

#### ByDayChart — נקודות חשובות
- `pT = 32` (לא 20) — מרווח עליון מספיק
- לייבל P&L **בתוך** העמודה: חיובית → `bY + 13`, שלילית → `bY + bH - 4`
- עמודה קצרה (<18px) → לייבל מחוץ, נועל בתוך גבולות הגרף עם `Math.max/min`

### BrokerImport
- **Tradovate Performance CSV**: P&L: `$(110.00)` = שלילי; fills → מאוחד לפי `buyFillId`; נרמול סמל `MNQM6` → `MNQ`
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
- store `version: 3` + migrate מאפס darkMode ל-`true`

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
```

### לוגו (בכל המקומות)
- עיגול: `background: var(--g)` (#1DB954), SVG chart icon, `stroke="#000000"`
- טקסט "TradeLog": `color: var(--t1)`
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
- לוגו: `position: absolute; left: 50%; transform: translateX(-50%)`
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
2. **ResizeObserver** על כל canvas — Analytics + MiniEquityChart
3. **loadDataInBackground** — פותח UI מיד, Supabase ברקע
4. **RTL**: `dir={lang === 'he' ? 'rtl' : 'ltr'}` על כל modal
5. **Sidebar**: מוסתר במובייל, hamburger + overlay
6. **לוגו קליקבילי** בכל מקום → `/dashboard`
7. **Landing CSS**: namespace `.lp-*` מבודד — אין קונפליקט עם CSS של האפליקציה
8. **Trade Media**: bucket `trade-media` ב-Supabase Storage (private). טבלת `trade_media`: `id, trade_id, user_id, storage_path, label, created_at`
9. **Currency**: USD בלבד — `formatPnL()` משתמש ב-`$`. אין ₪ בשום מקום
10. **Design**: Spotify Dark — אין #0071e3, אין Apple Light. Accent = `#1DB954`

---

## מה עוד דיברנו לבנות (לא הושלם)
- **מנויים בתשלום**: $19/mo + $159/yr + $349 lifetime
  - **פלטפורמת תשלום**: Lemon Squeezy — פועל כ-Merchant of Record, מטפל במע"מ וחשבוניות
  - נדרש: `profiles` schema (`subscription_status`, `trial_ends_at`, `lemonsqueezy_customer_id`), webhook handler, `useSubscription` hook, Paywall UI
- Push notifications במובייל
- ~~התראות יעד יומי~~ — DailyGoalBar **הושלם** (bar ב-Dashboard)
- השוואה שבוע/חודש ב-StatsBar (חץ ↑↓ ליד כל מספר)
- Keyboard shortcuts (N=עסקה חדשה, Esc=סגור)
- Onboarding wizard למשתמש חדש
