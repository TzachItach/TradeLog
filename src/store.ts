import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Trade, Strategy, Language, ModalState } from './types';
import { MOCK_ACCOUNTS, MOCK_TRADES, MOCK_STRATEGIES, TURTLE_SOUP_CHECKBOXES } from './mockData';
import {
  loadUserData, dbSaveAccount, dbDeleteAccount,
  dbSaveTrade, dbDeleteTrade, dbSaveStrategy, dbDeleteStrategy, dbSeedNewUser,
  dbSaveProfile,
} from './lib/db';

export function createDefaultStrategies(): Strategy[] {
  const stratId = crypto.randomUUID();
  return [{
    id: stratId,
    name: 'Turtle Soup',
    description: 'ICT Turtle Soup Setup',
    color: '#1DB954',
    is_active: true,
    fields: [
      ...TURTLE_SOUP_CHECKBOXES.map((label, i) => ({
        id: crypto.randomUUID(), strategy_id: stratId,
        field_type: 'checkbox' as const, label, is_required: false, sort_order: i + 1,
      })),
      { id: crypto.randomUUID(), strategy_id: stratId, field_type: 'text' as const, label: 'HTF PD Array', placeholder: 'e.g. 4H FVG / 1D OB', is_required: false, sort_order: 11 },
      { id: crypto.randomUUID(), strategy_id: stratId, field_type: 'text' as const, label: 'Psychology', placeholder: 'Focus, emotions...', is_required: false, sort_order: 12 },
    ],
  }];
}

export function createDefaultAccount(): Account {
  return { id: crypto.randomUUID(), name: 'חשבון אישי', account_type: 'personal', broker: 'manual', initial_balance: 0, currency: 'USD', is_active: true };
}

interface AppState {
  isDemo: boolean;
  lastUserId: string | null;
  user: { id: string; email?: string; name?: string } | null;
  accounts: Account[];
  trades: Trade[];
  strategies: Strategy[];
  lang: Language;
  selectedAccount: string;
  currentYear: number;
  currentMonth: number;
  modal: ModalState | null;
  activeView: string;
  fontSize: number;
  highContrast: boolean;
  grayscale: boolean;
  readableFont: boolean;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  dataLoading: boolean;
  dailyGoalTarget: number;
  dailyMaxLoss: number;

  setDemo: (v: boolean) => void;
  setUser: (u: AppState['user']) => void;
  setLang: (l: Language) => void;
  setSelectedAccount: (id: string) => void;
  setCurrentDate: (year: number, month: number) => void;
  setModal: (m: ModalState | null) => void;
  setActiveView: (v: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setDailyGoalTarget: (v: number) => void;
  setDailyMaxLoss: (v: number) => void;

  addTrade: (t: Trade) => void;
  updateTrade: (t: Trade) => void;
  deleteTrade: (id: string) => void;

  addAccount: (a: Account) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;

  addStrategy: (s: Strategy) => void;
  updateStrategy: (s: Strategy) => void;
  deleteStrategy: (id: string) => void;

  setFontSize: (v: number) => void;
  setHighContrast: (v: boolean) => void;
  setGrayscale: (v: boolean) => void;
  setReadableFont: (v: boolean) => void;

  loadDemoData: () => void;
  initRealUser: (userId: string, name: string, email: string) => Promise<void>;
  loadDataInBackground: (userId: string, name: string, email: string) => void;
  getFilteredTrades: () => Trade[];
  getStats: () => { totalPnL: number; winRate: number; totalTrades: number; avgWin: number; avgLoss: number; profitFactor: number };
}

const now = new Date();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDemo: true,
      lastUserId: null,
      user: null,
      accounts: [],
      trades: [],
      strategies: [],
      lang: 'he',
      selectedAccount: 'all',
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth(),
      modal: null,
      activeView: 'calendar',
      fontSize: 100,
      highContrast: false,
      grayscale: false,
      readableFont: false,
      sidebarCollapsed: false,
      darkMode: true,
      dataLoading: false,
      dailyGoalTarget: 0,
      dailyMaxLoss: 0,

      setDemo: (v) => set({ isDemo: v }),
      setUser: (u) => set({ user: u }),
      setLang: (l) => set({ lang: l }),
      setSelectedAccount: (id) => set({ selectedAccount: id }),
      setCurrentDate: (year, month) => set({ currentYear: year, currentMonth: month }),
      setModal: (m) => set({ modal: m }),
      setActiveView: (v) => set({ activeView: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setDarkMode: (v) => set({ darkMode: v }),
      setDailyGoalTarget: (v) => {
        set({ dailyGoalTarget: v });
        const userId = get().user?.id;
        if (userId) dbSaveProfile(userId, { dailyGoalTarget: v, dailyMaxLoss: get().dailyMaxLoss });
      },
      setDailyMaxLoss: (v) => {
        set({ dailyMaxLoss: v });
        const userId = get().user?.id;
        if (userId) dbSaveProfile(userId, { dailyGoalTarget: get().dailyGoalTarget, dailyMaxLoss: v });
      },

      // ── עסקאות — שמור גם ב-Supabase ──
      addTrade: (t) => {
        set((s) => ({ trades: [t, ...s.trades] }));
        const userId = get().user?.id;
        if (userId) dbSaveTrade(t, userId);
      },
      updateTrade: (t) => {
        set((s) => ({ trades: s.trades.map((x) => (x.id === t.id ? t : x)) }));
        const userId = get().user?.id;
        if (userId) dbSaveTrade(t, userId);
      },
      deleteTrade: (id) => {
        set((s) => ({ trades: s.trades.filter((x) => x.id !== id) }));
        dbDeleteTrade(id);
      },

      // ── חשבונות — שמור גם ב-Supabase ──
      addAccount: (a) => {
        set((s) => ({ accounts: [...s.accounts, a] }));
        const userId = get().user?.id;
        if (userId) dbSaveAccount(a, userId);
      },
      updateAccount: (a) => {
        set((s) => ({ accounts: s.accounts.map((x) => (x.id === a.id ? a : x)) }));
        const userId = get().user?.id;
        if (userId) dbSaveAccount(a, userId);
      },
      deleteAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((x) => x.id !== id),
          trades: s.trades.filter((x) => x.account_id !== id),
          selectedAccount: s.selectedAccount === id ? 'all' : s.selectedAccount,
        }));
        dbDeleteAccount(id);
      },

      // ── אסטרטגיות — שמור גם ב-Supabase ──
      addStrategy: (s) => {
        set((st) => ({ strategies: [...st.strategies, s] }));
        const userId = get().user?.id;
        if (userId) dbSaveStrategy(s, userId);
      },
      updateStrategy: (s) => {
        set((st) => ({ strategies: st.strategies.map((x) => (x.id === s.id ? s : x)) }));
        const userId = get().user?.id;
        if (userId) dbSaveStrategy(s, userId);
      },
      deleteStrategy: (id) => {
        set((st) => ({ strategies: st.strategies.filter((x) => x.id !== id) }));
        dbDeleteStrategy(id);
      },

      setFontSize: (v) => set({ fontSize: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setGrayscale: (v) => set({ grayscale: v }),
      setReadableFont: (v) => set({ readableFont: v }),

      loadDemoData: () => set({
        accounts: MOCK_ACCOUNTS, trades: MOCK_TRADES, strategies: MOCK_STRATEGIES,
        isDemo: true, lastUserId: null,
        user: { id: 'demo', name: 'Demo User', email: 'demo@tradelog.app' },
      }),

      // ── התחברות משתמש אמיתי — טעינה מ-Supabase ──
      initRealUser: async (userId, name, email) => {
        set({ dataLoading: true, isDemo: false, user: { id: userId, name, email } });

        // timeout — אם Supabase לא מגיב תוך 8 שניות, פתח בכל זאת
        const timeout = setTimeout(() => {
          console.warn('loadUserData timeout — opening with empty state');
          set({ dataLoading: false });
        }, 8000);

        try {
          const { accounts, strategies, trades, dailyGoalTarget, dailyMaxLoss } = await loadUserData(userId);
          clearTimeout(timeout);
          const isNewUser = accounts.length === 0 && strategies.length === 0;

          if (isNewUser) {
            const defAccount = createDefaultAccount();
            const defStrategies = createDefaultStrategies();
            await dbSeedNewUser(userId, defAccount, defStrategies);
            set({ accounts: [defAccount], strategies: defStrategies, trades: [], lastUserId: userId, selectedAccount: 'all' });
          } else {
            set({ accounts, strategies, trades, dailyGoalTarget, dailyMaxLoss, lastUserId: userId, selectedAccount: 'all' });
          }
        } catch (err) {
          clearTimeout(timeout);
          console.error('initRealUser error:', err);
          const defAccount = createDefaultAccount();
          const defStrategies = createDefaultStrategies();
          set({ accounts: [defAccount], strategies: defStrategies, trades: [], lastUserId: userId, selectedAccount: 'all' });
        } finally {
          set({ dataLoading: false });
        }
      },

      // טעינת נתונים ברקע — לא חוסם את הממשק
      loadDataInBackground: (userId, name, email) => {
        set({ user: { id: userId, name, email }, isDemo: false });
        loadUserData(userId).then(({ accounts, strategies, trades, dailyGoalTarget, dailyMaxLoss }) => {
          // Guard: never treat empty Supabase response as "new user" if we've seen this
          // userId before — empty data likely means an RLS / session issue, not a new user.
          const isKnownUser = get().lastUserId === userId;
          const isNewUser = !isKnownUser && accounts.length === 0 && strategies.length === 0;

          if (isNewUser) {
            const defAccount = createDefaultAccount();
            const defStrategies = createDefaultStrategies();
            dbSeedNewUser(userId, defAccount, defStrategies);
            set({ accounts: [defAccount], strategies: defStrategies, trades: [], lastUserId: userId });
          } else if (accounts.length > 0) {
            // Only overwrite state when Supabase actually returned data
            set({ accounts, strategies, trades, dailyGoalTarget, dailyMaxLoss, lastUserId: userId });
          } else {
            // Known user but got 0 accounts — keep localStorage cache
            console.warn('[Store] Known user returned 0 accounts — keeping cache');
          }
        }).catch((err) => {
          console.warn('[Store] Background load failed, using cache:', err);
          // נשאר עם הנתונים מה-localStorage
        });
      },

      getFilteredTrades: () => {
        const { trades, selectedAccount } = get();
        if (selectedAccount === 'all') return trades;
        return trades.filter((t) => t.account_id === selectedAccount);
      },

      getStats: () => {
        const trades = get().getFilteredTrades();
        const wins = trades.filter((t) => t.pnl > 0);
        const losses = trades.filter((t) => t.pnl < 0);
        const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
        const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
        const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
        const profitFactor = losses.length && avgLoss !== 0 ? Math.abs((avgWin * wins.length) / (avgLoss * losses.length)) : 0;
        return {
          totalPnL,
          winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
          totalTrades: trades.length, avgWin, avgLoss, profitFactor,
        };
      },
    }),
    {
      name: 'tradelog-storage',
      version: 3,
      migrate: (persisted: unknown) => {
        // v1/v2 → v3: reset darkMode to true (Spotify dark-first redesign)
        const state = persisted as Record<string, unknown>;
        return { ...state, darkMode: true };
      },
      partialize: (s) => ({
        lang: s.lang, fontSize: s.fontSize, highContrast: s.highContrast,
        grayscale: s.grayscale, readableFont: s.readableFont,
        sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode,
        dailyGoalTarget: s.dailyGoalTarget, dailyMaxLoss: s.dailyMaxLoss,
        // שמור נתונים ב-localStorage רק כ-cache — Supabase הוא source of truth
        accounts: s.accounts, trades: s.trades, strategies: s.strategies,
        selectedAccount: s.selectedAccount, isDemo: s.isDemo,
        lastUserId: s.lastUserId, user: s.user,
      }),
    },
  ),
);

export function formatPnL(pnl: number): string {
  const abs = Math.abs(Math.round(pnl)).toLocaleString('en-US');
  return (pnl >= 0 ? '+' : '-') + '$' + abs;
}
