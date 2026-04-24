export type Language = 'he' | 'en';
export type TradeDirection = 'long' | 'short';
export type AccountType = 'personal' | 'prop_firm' | 'demo';
export type BrokerName = 'manual' | 'tradovate' | 'topstepx';
export type FieldType = 'checkbox' | 'text' | 'select' | 'tag';
export type TradeSource = 'manual' | 'auto';

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  account_type: AccountType;
  broker: BrokerName;
  initial_balance: number;
  currency: string;
  is_active: boolean;
  // Prop Firm fields (optional, only for account_type === 'prop_firm')
  prop_phase?: 'challenge' | 'funded';
  prop_drawdown_type?: 'trailing_eod' | 'trailing_intraday' | 'static';
  prop_max_drawdown?: number;   // absolute $ amount
  prop_daily_limit?: number;    // absolute $ amount
  prop_profit_target?: number;  // absolute $ amount (challenge only)
  prop_min_days?: number;       // minimum trading days (challenge only)
  prop_max_days?: number;       // maximum trading days (challenge only)
  prop_start_date?: string;     // ISO date string
}

export interface StrategyField {
  id: string;
  strategy_id: string;
  field_type: FieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  is_required: boolean;
  sort_order: number;
}

export interface Strategy {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  fields: StrategyField[];
}

export interface Trade {
  id: string;
  user_id?: string;
  account_id: string;
  strategy_id?: string;
  symbol: string;
  direction: TradeDirection;
  trade_date: string;
  pnl: number;
  size?: number;
  stop_loss_pts?: number;
  take_profit_pts?: number;
  entry_price?: number;
  exit_price?: number;
  entry_time?: string;  // "HH:mm"
  exit_time?: string;   // "HH:mm"
  htf_pd_array?: string;
  psychology?: string;
  notes?: string;
  confirmations: Record<string, boolean>;
  field_values: Record<string, unknown>;
  source: TradeSource;
  broker_trade_id?: string;
  media?: TradeMedia[];
}

export interface TradeMedia {
  id: string;
  trade_id: string;
  storage_path: string;
  label?: string;
}

export interface DayStats {
  dateStr: string;
  trades: Trade[];
  totalPnL: number;
  wins: number;
  losses: number;
}

export interface AppStats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
}

export type ModalState =
  | { type: 'new'; date?: string }
  | { type: 'edit'; tradeId: string }
  | { type: 'account'; accountId?: string }
  | { type: 'strategy'; strategyId?: string };

export interface BrokerConnection {
  id: string;
  account_id: string;
  broker: BrokerName;
  is_active: boolean;
  last_synced_at?: string;
}

export type ExpenseFeeType = 'challenge' | 'reset' | 'activation' | 'data_fee' | 'other';

export interface PropExpense {
  id: string;
  user_id?: string;
  account_id?: string;     // optional link to a specific account
  prop_firm: string;       // e.g. "TopstepX", "Apex"
  account_size: number;    // e.g. 50000, 100000, 150000
  fee_type: ExpenseFeeType;
  amount: number;          // USD, always positive
  date: string;            // ISO date YYYY-MM-DD
  notes?: string;
}

export interface PropPayout {
  id: string;
  user_id?: string;
  account_id?: string;
  prop_firm: string;
  amount: number;          // net payout after firm split, USD
  date: string;            // ISO date
  notes?: string;
}
