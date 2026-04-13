import { supabase, DEMO_MODE } from './supabase';
import type { Account, Trade, Strategy } from '../types';

// ─── helpers ───────────────────────────────────────────────────
function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── LOAD ALL USER DATA ────────────────────────────────────────
export async function loadUserData(userId: string): Promise<{
  accounts: Account[];
  strategies: Strategy[];
  trades: Trade[];
}> {
  if (DEMO_MODE || !supabase) return { accounts: [], strategies: [], trades: [] };

  const [accRes, stratRes, tradeRes] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('strategies').select('*, strategy_fields(*)').eq('user_id', userId).order('created_at'),
    supabase.from('trades').select('*').eq('user_id', userId).order('trade_date', { ascending: false }),
  ]);

  const accounts: Account[] = (accRes.data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name,
    account_type: r.account_type,
    broker: r.broker,
    initial_balance: r.initial_balance ?? 0,
    currency: r.currency ?? 'USD',
    is_active: r.is_active ?? true,
  }));

  const strategies: Strategy[] = (stratRes.data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name,
    description: r.description ?? '',
    color: r.color ?? '#5b8fff',
    is_active: r.is_active ?? true,
    fields: (r.strategy_fields ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((f: {
        id: string; strategy_id: string; field_type: string;
        label: string; placeholder?: string; is_required: boolean; sort_order: number;
      }) => ({
        id: f.id,
        strategy_id: f.strategy_id,
        field_type: f.field_type as 'checkbox' | 'text' | 'select' | 'tag',
        label: f.label,
        placeholder: f.placeholder,
        is_required: f.is_required,
        sort_order: f.sort_order,
      })),
  }));

  const trades: Trade[] = (tradeRes.data ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    account_id: r.account_id,
    strategy_id: r.strategy_id,
    symbol: r.symbol,
    direction: r.direction,
    trade_date: r.trade_date,
    pnl: r.pnl ?? 0,
    size: r.size,
    stop_loss_pts: r.stop_loss_pts,
    take_profit_pts: r.take_profit_pts,
    htf_pd_array: r.htf_pd_array,
    psychology: r.psychology,
    notes: r.notes,
    confirmations: r.confirmations ?? {},
    field_values: r.field_values ?? {},
    source: r.source ?? 'manual',
  }));

  return { accounts, strategies, trades };
}

// ─── ACCOUNTS ─────────────────────────────────────────────────
export async function dbSaveAccount(account: Account, userId: string) {
  if (DEMO_MODE || !supabase) return;
  await supabase.from('accounts').upsert({
    id: account.id,
    user_id: userId,
    name: account.name,
    account_type: account.account_type,
    broker: account.broker,
    initial_balance: account.initial_balance,
    currency: account.currency,
    is_active: account.is_active,
  });
}

export async function dbDeleteAccount(id: string) {
  if (DEMO_MODE || !supabase) return;
  await supabase.from('accounts').delete().eq('id', id);
}

// ─── STRATEGIES ───────────────────────────────────────────────
export async function dbSaveStrategy(strategy: Strategy, userId: string) {
  if (DEMO_MODE || !supabase) return;

  // upsert strategy row
  await supabase.from('strategies').upsert({
    id: strategy.id,
    user_id: userId,
    name: strategy.name,
    description: strategy.description ?? '',
    color: strategy.color,
    is_active: strategy.is_active,
  });

  // delete old fields and re-insert (simplest approach)
  await supabase.from('strategy_fields').delete().eq('strategy_id', strategy.id);

  if (strategy.fields.length > 0) {
    await supabase.from('strategy_fields').insert(
      strategy.fields.map((f, i) => ({
        id: f.id.startsWith('f-') ? uid() : f.id,
        strategy_id: strategy.id,
        user_id: userId,
        field_type: f.field_type,
        label: f.label,
        placeholder: f.placeholder ?? null,
        is_required: f.is_required,
        sort_order: f.sort_order ?? i + 1,
      }))
    );
  }
}

export async function dbDeleteStrategy(id: string) {
  if (DEMO_MODE || !supabase) return;
  // strategy_fields cascade deletes automatically via FK
  await supabase.from('strategies').delete().eq('id', id);
}

// ─── TRADES ───────────────────────────────────────────────────
export async function dbSaveTrade(trade: Trade, userId: string) {
  if (DEMO_MODE || !supabase) return;
  await supabase.from('trades').upsert({
    id: trade.id,
    user_id: userId,
    account_id: trade.account_id,
    strategy_id: trade.strategy_id ?? null,
    symbol: trade.symbol,
    direction: trade.direction,
    trade_date: trade.trade_date,
    pnl: trade.pnl,
    size: trade.size ?? null,
    stop_loss_pts: trade.stop_loss_pts ?? null,
    take_profit_pts: trade.take_profit_pts ?? null,
    htf_pd_array: trade.htf_pd_array ?? null,
    psychology: trade.psychology ?? null,
    notes: trade.notes ?? null,
    confirmations: trade.confirmations ?? {},
    field_values: trade.field_values ?? {},
    source: trade.source ?? 'manual',
    status: 'complete',
  });
}

export async function dbDeleteTrade(id: string) {
  if (DEMO_MODE || !supabase) return;
  await supabase.from('trades').delete().eq('id', id);
}

// ─── DEFAULT SEED (new user) ──────────────────────────────────
export async function dbSeedNewUser(
  userId: string,
  account: Account,
  strategies: Strategy[]
) {
  if (DEMO_MODE || !supabase) return;
  await dbSaveAccount(account, userId);
  for (const s of strategies) {
    await dbSaveStrategy(s, userId);
  }
}
