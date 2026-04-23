import type { Account, Strategy, Trade, PropExpense, PropPayout } from './types';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'חשבון אישי', account_type: 'personal', broker: 'manual', initial_balance: 50000, currency: 'USD', is_active: true },
  { id: 'a2', name: 'Prop Firm 1', account_type: 'prop_firm', broker: 'topstepx', initial_balance: 100000, currency: 'USD', is_active: true },
  { id: 'a3', name: 'Prop Firm 2', account_type: 'prop_firm', broker: 'tradovate', initial_balance: 50000, currency: 'USD', is_active: true },
];

export const TURTLE_SOUP_CHECKBOXES = [
  'Turtle Soup', '1m IFVG', '3m IFVG', '5m IFVG',
  'Premium (Short zone)', 'Discount (Long zone)',
  'Entry at Pullback', 'OTE', '0.5 Range', 'Liquidity Taken',
];

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: 's1',
    name: 'Turtle Soup',
    description: 'ICT Turtle Soup Setup',
    color: '#4a7dff',
    is_active: true,
    fields: [
      ...TURTLE_SOUP_CHECKBOXES.map((label, i) => ({
        id: `f-ts-${i}`, strategy_id: 's1', field_type: 'checkbox' as const,
        label, is_required: false, sort_order: i + 1,
      })),
      { id: 'f-ts-htf', strategy_id: 's1', field_type: 'text' as const, label: 'HTF PD Array', placeholder: 'e.g. 4H FVG / 1D OB', is_required: false, sort_order: 11 },
      { id: 'f-ts-psy', strategy_id: 's1', field_type: 'text' as const, label: 'Psychology', placeholder: 'Focus, emotions...', is_required: false, sort_order: 12 },
    ],
  },
  {
    id: 's2',
    name: 'ICT Breaker',
    description: 'ICT Breaker Block Setup',
    color: '#00c896',
    is_active: true,
    fields: [
      { id: 'f-ib-1', strategy_id: 's2', field_type: 'checkbox' as const, label: 'Breaker Block', is_required: false, sort_order: 1 },
      { id: 'f-ib-2', strategy_id: 's2', field_type: 'checkbox' as const, label: 'FVG Retracement', is_required: false, sort_order: 2 },
      { id: 'f-ib-3', strategy_id: 's2', field_type: 'checkbox' as const, label: 'Liquidity Swept', is_required: false, sort_order: 3 },
    ],
  },
  {
    id: 's3',
    name: 'SMC OTE',
    description: 'Smart Money Concept OTE',
    color: '#ff9f43',
    is_active: true,
    fields: [
      { id: 'f-ote-1', strategy_id: 's3', field_type: 'checkbox' as const, label: 'OTE Zone', is_required: false, sort_order: 1 },
      { id: 'f-ote-2', strategy_id: 's3', field_type: 'checkbox' as const, label: 'CHoCH Confirmed', is_required: false, sort_order: 2 },
    ],
  },
];

const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');
const d = (day: number) => `${y}-${m}-${String(day).padStart(2, '0')}`;

export const MOCK_TRADES: Trade[] = [
  { id: 't1',  account_id: 'a1', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(1),  pnl:  1250, size: 1, stop_loss_pts: 20, take_profit_pts: 50, htf_pd_array: '4H FVG', psychology: 'Focused', notes: '', confirmations: { 'Turtle Soup': true, '1m IFVG': true, 'OTE': true }, field_values: {}, source: 'manual' },
  { id: 't2',  account_id: 'a1', strategy_id: 's2', symbol: 'ES',  direction: 'short', trade_date: d(1),  pnl:  -430, size: 1, stop_loss_pts: 15, take_profit_pts: 30, htf_pd_array: '1D OB',  psychology: 'FOMO',    notes: 'Entered too early', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't3',  account_id: 'a1', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(2),  pnl:  2100, size: 2, stop_loss_pts: 18, take_profit_pts: 55, htf_pd_array: '4H FVG', psychology: 'Calm',    notes: '', confirmations: { 'Turtle Soup': true, '3m IFVG': true }, field_values: {}, source: 'manual' },
  { id: 't4',  account_id: 'a1', strategy_id: 's3', symbol: 'ES',  direction: 'short', trade_date: d(3),  pnl:  -820, size: 1, stop_loss_pts: 25, take_profit_pts: 40, htf_pd_array: '1D FVG', psychology: 'Anxious', notes: 'Stop too tight', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't5',  account_id: 'a2', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(7),  pnl:  3400, size: 2, stop_loss_pts: 20, take_profit_pts: 80, htf_pd_array: 'W FVG',  psychology: 'Patient', notes: 'Perfect entry', confirmations: { 'Turtle Soup': true, '5m IFVG': true, 'OTE': true, 'Liquidity Taken': true }, field_values: {}, source: 'auto' },
  { id: 't6',  account_id: 'a2', strategy_id: 's2', symbol: 'CL',  direction: 'short', trade_date: d(8),  pnl: -1200, size: 1, stop_loss_pts: 30, take_profit_pts: 60, htf_pd_array: '4H OB',  psychology: 'Rushed',  notes: '', confirmations: {}, field_values: {}, source: 'auto' },
  { id: 't7',  account_id: 'a1', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(9),  pnl:   890, size: 1, stop_loss_pts: 18, take_profit_pts: 40, htf_pd_array: '4H FVG', psychology: 'Calm',    notes: '', confirmations: { '1m IFVG': true }, field_values: {}, source: 'manual' },
  { id: 't8',  account_id: 'a1', strategy_id: 's3', symbol: 'ES',  direction: 'long',  trade_date: d(9),  pnl:   440, size: 1, stop_loss_pts: 12, take_profit_pts: 25, htf_pd_array: '1D FVG', psychology: 'Good',    notes: '', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't9',  account_id: 'a1', strategy_id: 's1', symbol: 'GC',  direction: 'short', trade_date: d(9),  pnl:  -220, size: 1, stop_loss_pts: 10, take_profit_pts: 20, htf_pd_array: '4H OB',  psychology: 'Tired',   notes: 'Late in session', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't10', account_id: 'a2', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(10), pnl:  4200, size: 3, stop_loss_pts: 20, take_profit_pts: 90, htf_pd_array: 'W FVG',  psychology: 'Perfect', notes: 'Best trade this month', confirmations: { 'Turtle Soup': true, '1m IFVG': true, '3m IFVG': true, 'OTE': true, 'Liquidity Taken': true }, field_values: {}, source: 'auto' },
  { id: 't11', account_id: 'a1', strategy_id: 's2', symbol: 'NQ',  direction: 'short', trade_date: d(11), pnl: -1800, size: 2, stop_loss_pts: 25, take_profit_pts: 50, htf_pd_array: '4H OB',  psychology: 'Revenge', notes: 'Revenge trade — should not have taken', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't12', account_id: 'a1', strategy_id: 's3', symbol: 'ES',  direction: 'long',  trade_date: d(14), pnl:   620, size: 1, stop_loss_pts: 15, take_profit_pts: 30, htf_pd_array: '4H FVG', psychology: 'Calm',    notes: '', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't13', account_id: 'a2', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(15), pnl:  1900, size: 1, stop_loss_pts: 20, take_profit_pts: 60, htf_pd_array: '4H FVG', psychology: 'Focused', notes: '', confirmations: { 'Turtle Soup': true, '5m IFVG': true }, field_values: {}, source: 'auto' },
  { id: 't14', account_id: 'a1', strategy_id: 's1', symbol: 'CL',  direction: 'short', trade_date: d(16), pnl:  -560, size: 1, stop_loss_pts: 15, take_profit_pts: 35, htf_pd_array: '1D OB',  psychology: 'Okay',    notes: '', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't15', account_id: 'a1', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(17), pnl:  3100, size: 2, stop_loss_pts: 20, take_profit_pts: 75, htf_pd_array: 'W FVG',  psychology: 'Patient', notes: 'Waited for HTF confirmation', confirmations: { 'Turtle Soup': true, '1m IFVG': true, 'OTE': true, '0.5 Range': true }, field_values: {}, source: 'manual' },
  { id: 't16', account_id: 'a2', strategy_id: 's2', symbol: 'ES',  direction: 'long',  trade_date: d(21), pnl:  -900, size: 1, stop_loss_pts: 20, take_profit_pts: 40, htf_pd_array: '4H OB',  psychology: 'Distracted', notes: '', confirmations: {}, field_values: {}, source: 'auto' },
  { id: 't17', account_id: 'a1', strategy_id: 's1', symbol: 'NQ',  direction: 'long',  trade_date: d(22), pnl:  2800, size: 2, stop_loss_pts: 20, take_profit_pts: 70, htf_pd_array: '4H FVG', psychology: 'Calm',    notes: '', confirmations: { 'Turtle Soup': true, '3m IFVG': true, 'Liquidity Taken': true }, field_values: {}, source: 'manual' },
  { id: 't18', account_id: 'a1', strategy_id: 's3', symbol: 'GC',  direction: 'long',  trade_date: d(23), pnl:  1100, size: 1, stop_loss_pts: 15, take_profit_pts: 35, htf_pd_array: '1D FVG', psychology: 'Good',    notes: '', confirmations: {}, field_values: {}, source: 'manual' },
  { id: 't19', account_id: 'a2', strategy_id: 's1', symbol: 'NQ',  direction: 'short', trade_date: d(28), pnl: -2200, size: 2, stop_loss_pts: 22, take_profit_pts: 55, htf_pd_array: '4H OB',  psychology: 'Overconfident', notes: 'Counter trend — mistake', confirmations: {}, field_values: {}, source: 'auto' },
  { id: 't20', account_id: 'a1', strategy_id: 's1', symbol: 'ES',  direction: 'long',  trade_date: d(29), pnl:   780, size: 1, stop_loss_pts: 12, take_profit_pts: 30, htf_pd_array: '4H FVG', psychology: 'Calm',    notes: '', confirmations: { 'Turtle Soup': true, 'OTE': true }, field_values: {}, source: 'manual' },
];

// Helper: date N months ago
const pastMonth = (monthsAgo: number, day: number) => {
  const dt = new Date();
  dt.setDate(day);
  dt.setMonth(dt.getMonth() - monthsAgo);
  return dt.toISOString().slice(0, 10);
};

export const MOCK_EXPENSES: PropExpense[] = [
  { id: 'exp-1',  prop_firm: 'TopstepX', account_size: 100000, fee_type: 'challenge',   amount: 165, date: pastMonth(5, 3),  notes: 'First attempt' },
  { id: 'exp-2',  prop_firm: 'TopstepX', account_size: 100000, fee_type: 'reset',       amount: 99,  date: pastMonth(4, 15), notes: 'Blew day 8' },
  { id: 'exp-3',  prop_firm: 'TopstepX', account_size: 100000, fee_type: 'challenge',   amount: 165, date: pastMonth(4, 16), notes: 'Second attempt' },
  { id: 'exp-4',  prop_firm: 'Apex',     account_size: 50000,  fee_type: 'challenge',   amount: 97,  date: pastMonth(3, 2),  notes: '' },
  { id: 'exp-5',  prop_firm: 'TopstepX', account_size: 100000, fee_type: 'activation',  amount: 149, date: pastMonth(3, 20), notes: 'Passed! Activation fee' },
  { id: 'exp-6',  prop_firm: 'Apex',     account_size: 50000,  fee_type: 'reset',       amount: 67,  date: pastMonth(2, 5),  notes: '' },
  { id: 'exp-7',  prop_firm: 'Apex',     account_size: 50000,  fee_type: 'challenge',   amount: 97,  date: pastMonth(2, 6),  notes: 'Third try' },
  { id: 'exp-8',  prop_firm: 'TopstepX', account_size: 100000, fee_type: 'data_fee',    amount: 85,  date: pastMonth(1, 1),  notes: 'Monthly data' },
  { id: 'exp-9',  prop_firm: 'Apex',     account_size: 50000,  fee_type: 'activation',  amount: 85,  date: pastMonth(1, 10), notes: 'Passed 50k!' },
  { id: 'exp-10', prop_firm: 'TopstepX', account_size: 150000, fee_type: 'challenge',   amount: 375, date: pastMonth(0, 4),  notes: 'Scaling up' },
];

export const MOCK_PAYOUTS: PropPayout[] = [
  { id: 'pay-1', prop_firm: 'TopstepX', account_id: 'a2', amount: 1200, date: pastMonth(2, 28), notes: 'First withdrawal' },
  { id: 'pay-2', prop_firm: 'Apex',     amount: 800,  date: pastMonth(1, 22), notes: '' },
  { id: 'pay-3', prop_firm: 'TopstepX', account_id: 'a2', amount: 2400, date: pastMonth(0, 15), notes: 'Best month yet' },
];
