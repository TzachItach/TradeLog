export interface FuturesContract {
  symbol: string;
  name: string;
  pointValue: number;
  exchange: string;
  category: string;
}

export const FUTURES: FuturesContract[] = [
  // ── Equity Index ─────────────────────────────────────────
  { symbol: 'NQ',   name: 'Nasdaq 100',          pointValue: 20,    exchange: 'CME',   category: 'Equity' },
  { symbol: 'MNQ',  name: 'Micro Nasdaq 100',     pointValue: 2,     exchange: 'CME',   category: 'Equity' },
  { symbol: 'ES',   name: 'S&P 500',              pointValue: 50,    exchange: 'CME',   category: 'Equity' },
  { symbol: 'MES',  name: 'Micro S&P 500',        pointValue: 5,     exchange: 'CME',   category: 'Equity' },
  { symbol: 'YM',   name: 'Dow Jones',            pointValue: 5,     exchange: 'CBOT',  category: 'Equity' },
  { symbol: 'MYM',  name: 'Micro Dow Jones',      pointValue: 0.5,   exchange: 'CBOT',  category: 'Equity' },
  { symbol: 'RTY',  name: 'Russell 2000',         pointValue: 50,    exchange: 'CME',   category: 'Equity' },
  { symbol: 'M2K',  name: 'Micro Russell 2000',   pointValue: 5,     exchange: 'CME',   category: 'Equity' },
  { symbol: 'NKD',  name: 'Nikkei 225',           pointValue: 5,     exchange: 'CME',   category: 'Equity' },
  { symbol: 'EMD',  name: 'S&P Midcap 400',       pointValue: 100,   exchange: 'CME',   category: 'Equity' },
  // ── Energy ───────────────────────────────────────────────
  { symbol: 'CL',   name: 'Crude Oil WTI',        pointValue: 1000,  exchange: 'NYMEX', category: 'Energy' },
  { symbol: 'MCL',  name: 'Micro Crude Oil',      pointValue: 100,   exchange: 'NYMEX', category: 'Energy' },
  { symbol: 'NG',   name: 'Natural Gas',          pointValue: 10000, exchange: 'NYMEX', category: 'Energy' },
  { symbol: 'RB',   name: 'RBOB Gasoline',        pointValue: 420,   exchange: 'NYMEX', category: 'Energy' },
  { symbol: 'HO',   name: 'Heating Oil',          pointValue: 420,   exchange: 'NYMEX', category: 'Energy' },
  { symbol: 'BZ',   name: 'Brent Crude Oil',      pointValue: 1000,  exchange: 'NYMEX', category: 'Energy' },
  // ── Metals ───────────────────────────────────────────────
  { symbol: 'GC',   name: 'Gold',                 pointValue: 100,   exchange: 'COMEX', category: 'Metals' },
  { symbol: 'MGC',  name: 'Micro Gold',           pointValue: 10,    exchange: 'COMEX', category: 'Metals' },
  { symbol: 'SI',   name: 'Silver',               pointValue: 5000,  exchange: 'COMEX', category: 'Metals' },
  { symbol: 'SIL',  name: 'Micro Silver',         pointValue: 1000,  exchange: 'COMEX', category: 'Metals' },
  { symbol: 'HG',   name: 'Copper',               pointValue: 250,   exchange: 'COMEX', category: 'Metals' },
  { symbol: 'PA',   name: 'Palladium',            pointValue: 100,   exchange: 'NYMEX', category: 'Metals' },
  { symbol: 'PL',   name: 'Platinum',             pointValue: 50,    exchange: 'NYMEX', category: 'Metals' },
  // ── Currencies ───────────────────────────────────────────
  { symbol: '6E',   name: 'Euro FX',              pointValue: 125000,exchange: 'CME',   category: 'FX' },
  { symbol: 'M6E',  name: 'Micro Euro FX',        pointValue: 12500, exchange: 'CME',   category: 'FX' },
  { symbol: '6B',   name: 'British Pound',        pointValue: 62500, exchange: 'CME',   category: 'FX' },
  { symbol: '6J',   name: 'Japanese Yen',         pointValue: 125000,exchange: 'CME',   category: 'FX' },
  { symbol: '6C',   name: 'Canadian Dollar',      pointValue: 100000,exchange: 'CME',   category: 'FX' },
  { symbol: '6A',   name: 'Australian Dollar',    pointValue: 100000,exchange: 'CME',   category: 'FX' },
  { symbol: '6S',   name: 'Swiss Franc',          pointValue: 125000,exchange: 'CME',   category: 'FX' },
  { symbol: '6N',   name: 'New Zealand Dollar',   pointValue: 100000,exchange: 'CME',   category: 'FX' },
  { symbol: 'DX',   name: 'US Dollar Index',      pointValue: 1000,  exchange: 'ICE',   category: 'FX' },
  // ── Rates ────────────────────────────────────────────────
  { symbol: 'ZB',   name: '30Y T-Bond',           pointValue: 1000,  exchange: 'CBOT',  category: 'Rates' },
  { symbol: 'ZN',   name: '10Y T-Note',           pointValue: 1000,  exchange: 'CBOT',  category: 'Rates' },
  { symbol: 'ZF',   name: '5Y T-Note',            pointValue: 1000,  exchange: 'CBOT',  category: 'Rates' },
  { symbol: 'ZT',   name: '2Y T-Note',            pointValue: 2000,  exchange: 'CBOT',  category: 'Rates' },
  { symbol: 'GE',   name: 'Eurodollar',           pointValue: 2500,  exchange: 'CME',   category: 'Rates' },
  // ── Agriculture ──────────────────────────────────────────
  { symbol: 'ZC',   name: 'Corn',                 pointValue: 50,    exchange: 'CBOT',  category: 'Agri' },
  { symbol: 'ZW',   name: 'Wheat',                pointValue: 50,    exchange: 'CBOT',  category: 'Agri' },
  { symbol: 'ZS',   name: 'Soybeans',             pointValue: 50,    exchange: 'CBOT',  category: 'Agri' },
  { symbol: 'ZL',   name: 'Soybean Oil',          pointValue: 600,   exchange: 'CBOT',  category: 'Agri' },
  { symbol: 'ZM',   name: 'Soybean Meal',         pointValue: 100,   exchange: 'CBOT',  category: 'Agri' },
  { symbol: 'CT',   name: 'Cotton',               pointValue: 500,   exchange: 'ICE',   category: 'Agri' },
  { symbol: 'KC',   name: 'Coffee',               pointValue: 375,   exchange: 'ICE',   category: 'Agri' },
  { symbol: 'SB',   name: 'Sugar #11',            pointValue: 1120,  exchange: 'ICE',   category: 'Agri' },
  // ── Crypto ───────────────────────────────────────────────
  { symbol: 'BTC',  name: 'Bitcoin Futures',      pointValue: 5,     exchange: 'CME',   category: 'Crypto' },
  { symbol: 'MBT',  name: 'Micro Bitcoin',        pointValue: 0.1,   exchange: 'CME',   category: 'Crypto' },
  { symbol: 'ETH',  name: 'Ether Futures',        pointValue: 50,    exchange: 'CME',   category: 'Crypto' },
  { symbol: 'MET',  name: 'Micro Ether',          pointValue: 0.1,   exchange: 'CME',   category: 'Crypto' },
];

export const FUTURES_MAP = Object.fromEntries(
  FUTURES.map(f => [f.symbol, f])
);

export function getPointValue(symbol: string): number {
  const clean = symbol.toUpperCase().replace(/[A-Z]\d{2}$/, '');
  return FUTURES_MAP[clean]?.pointValue ?? 0;
}

export function getContract(symbol: string): FuturesContract | undefined {
  const clean = symbol.toUpperCase().replace(/[A-Z]\d{2}$/, '');
  return FUTURES_MAP[clean];
}

export const CATEGORIES = ['Equity', 'Energy', 'Metals', 'FX', 'Rates', 'Agri', 'Crypto'];

export const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  Equity: { he: 'מדדים', en: 'Equity' },
  Energy: { he: 'אנרגיה', en: 'Energy' },
  Metals: { he: 'מתכות', en: 'Metals' },
  FX:     { he: 'מטבעות', en: 'FX' },
  Rates:  { he: 'ריבית', en: 'Rates' },
  Agri:   { he: 'חקלאות', en: 'Agri' },
  Crypto: { he: 'קריפטו', en: 'Crypto' },
};
