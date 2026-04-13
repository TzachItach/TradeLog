import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, Trade, Strategy, Language, ModalState } from './types';
import { MOCK_ACCOUNTS, MOCK_TRADES, MOCK_STRATEGIES } from './mockData';

interface AppState {
  isDemo: boolean;
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

  setDemo: (v: boolean) => void;
  setUser: (u: AppState['user']) => void;
  setLang: (l: Language) => void;
  setSelectedAccount: (id: string) => void;
  setCurrentDate: (year: number, month: number) => void;
  setModal: (m: ModalState | null) => void;
  setActiveView: (v: string) => void;
  setSidebarCollapsed: (v: boolean) => void;

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
  getFilteredTrades: () => Trade[];
  getStats: () => {
    totalPnL: number; winRate: number; totalTrades: number;
    avgWin: number; avgLoss: number; profitFactor: number;
  };
}

const now = new Date();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDemo: true,
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

      setDemo: (v) => set({ isDemo: v }),
      setUser: (u) => set({ user: u }),
      setLang: (l) => set({ lang: l }),
      setSelectedAccount: (id) => set({ selectedAccount: id }),
      setCurrentDate: (year, month) => set({ currentYear: year, currentMonth: month }),
      setModal: (m) => set({ modal: m }),
      setActiveView: (v) => set({ activeView: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      addTrade: (t) => set((s) => ({ trades: [...s.trades, t] })),
      updateTrade: (t) => set((s) => ({ trades: s.trades.map((x) => (x.id === t.id ? t : x)) })),
      deleteTrade: (id) => set((s) => ({ trades: s.trades.filter((x) => x.id !== id) })),

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, a] })),
      updateAccount: (a) => set((s) => ({ accounts: s.accounts.map((x) => (x.id === a.id ? a : x)) })),
      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((x) => x.id !== id),
          trades: s.trades.filter((x) => x.account_id !== id),
          selectedAccount: s.selectedAccount === id ? 'all' : s.selectedAccount,
        })),

      addStrategy: (s) => set((st) => ({ strategies: [...st.strategies, s] })),
      updateStrategy: (s) => set((st) => ({ strategies: st.strategies.map((x) => (x.id === s.id ? s : x)) })),
      deleteStrategy: (id) => set((st) => ({ strategies: st.strategies.filter((x) => x.id !== id) })),

      setFontSize: (v) => set({ fontSize: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setGrayscale: (v) => set({ grayscale: v }),
      setReadableFont: (v) => set({ readableFont: v }),

      loadDemoData: () =>
        set({
          accounts: MOCK_ACCOUNTS,
          trades: MOCK_TRADES,
          strategies: MOCK_STRATEGIES,
          isDemo: true,
          user: { id: 'demo', name: 'Demo User', email: 'demo@tradelog.app' },
        }),

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
        const profitFactor =
          losses.length && avgLoss !== 0
            ? Math.abs((avgWin * wins.length) / (avgLoss * losses.length))
            : 0;
        return {
          totalPnL,
          winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
          totalTrades: trades.length,
          avgWin,
          avgLoss,
          profitFactor,
        };
      },
    }),
    {
      name: 'tradelog-storage',
      partialize: (s) => ({
        lang: s.lang,
        fontSize: s.fontSize,
        highContrast: s.highContrast,
        grayscale: s.grayscale,
        readableFont: s.readableFont,
        sidebarCollapsed: s.sidebarCollapsed,
        accounts: s.accounts,
        trades: s.trades,
        strategies: s.strategies,
        selectedAccount: s.selectedAccount,
        isDemo: s.isDemo,
        user: s.user,
      }),
    },
  ),
);

export function formatPnL(pnl: number): string {
  const abs = Math.abs(Math.round(pnl)).toLocaleString('en-US');
  return (pnl >= 0 ? '+' : '-') + '$' + abs;
}
