import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Trade, Strategy, Language, ModalState } from './types';
import { MOCK_ACCOUNTS, MOCK_TRADES, MOCK_STRATEGIES, TURTLE_SOUP_CHECKBOXES } from './mockData';
import {
  loadUserData, dbSaveAccount, dbDeleteAccount,
  dbSaveTrade, dbDeleteTrade, dbSaveStrategy, dbDeleteStrategy, dbSeedNewUser,
} from './lib/db';

const STRAT_ID = 's-turtle-soup';

export function createDefaultStrategies(): Strategy[] {
  return [{
    id: STRAT_ID,
    name: 'Turtle Soup',
    description: 'ICT Turtle Soup Setup',
    color: '#5b8fff',
    is_active: true,
    fields: [
      ...TURTLE_SOUP_CHECKBOXES.map((label, i) => ({
        id: `f-ts-cb-${i}`, strategy_id: STRAT_ID,
        field_type: 'checkbox' as const, label, is_required: false, sort_order: i + 1,
      })),
      { id: 'f-ts-htf', strategy_id: STRAT_ID, field_type: 'text' as const, label: 'HTF PD Array', placeholder: 'e.g. 4H FVG / 1D OB', is_required: false, sort_order: 11 },
      { id: 'f-ts-psy', strategy_id: STRAT_ID, field_type: 'text' as const, label: 'Psychology', placeholder: 'Focus, emotions...', is_required: false, sort_order: 12 },
    ],
  }];
}

export function createDefaultAccount(): Account {
  return { id: 'a-default', name: 'חשבון אישי', account_type: 'personal', broker: 'manual', initial_balance: 0, currency: 'USD', is_active: true };
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

  setDemo: (v: boolean) => void;
  setUser: (u: AppState['user']) => void;
  setLang: (l: Language) => void;
  setSelectedAccount: (id: string) => void;
  setCurrentDate: (year: number, month: number) => void;
  setModal: (m: ModalState | null) => void;
  setActiveView: (v: string) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;

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

      setDemo: (v) => set({ isDemo: v }),
      setUser: (u) => set({ user: u }),
      setLang: (l) => set({ lang: l }),
      setSelectedAccount: (id) => set({ selectedAccount: id }),
      setCurrentDate: (year, month) => set({ currentYear: year, currentMonth: month }),
      setModal: (m) => set({ modal: m }),
      setActiveView: (v) => set({ activeView: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setDarkMode: (v) => set({ darkMode: v }),

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

        try {
          const { accounts, strategies, trades } = await loadUserData(userId);
          const isNewUser = accounts.length === 0 && strategies.length === 0;

          if (isNewUser) {
            // משתמש חדש — צור ברירות מחדל ב-Supabase
            const defAccount = createDefaultAccount();
            const defStrategies = createDefaultStrategies();
            await dbSeedNewUser(userId, defAccount, defStrategies);
            set({
              accounts: [defAccount],
              strategies: defStrategies,
              trades: [],
              lastUserId: userId,
              selectedAccount: 'all',
              dataLoading: false,
            });
          } else {
            // משתמש קיים — טען את כל הנתונים שלו
            set({
              accounts,
              strategies,
              trades,
              lastUserId: userId,
              selectedAccount: 'all',
              dataLoading: false,
            });
          }
        } catch (err) {
          console.error('Failed to load user data:', err);
          set({ dataLoading: false });
        }
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
      partialize: (s) => ({
        lang: s.lang, fontSize: s.fontSize, highContrast: s.highContrast,
        grayscale: s.grayscale, readableFont: s.readableFont,
        sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode,
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
