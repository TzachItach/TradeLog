import { supabase, DEMO_MODE } from './supabase';
import type { Account, Trade, Strategy, PropExpense, PropPayout, BudgetSettings } from '../types';

// לוג שגיאות Supabase בצורה ברורה
function logErr(fn: string, error: { message: string; code?: string } | null) {
  if (error) console.error(`[DB] ${fn}:`, error.message, error.code ?? '');
}

// ─── LOAD ────────────────────────────────────────────────────
export async function loadUserData(userId: string): Promise<{
  accounts: Account[]; strategies: Strategy[]; trades: Trade[];
  expenses: PropExpense[]; payouts: PropPayout[];
  dailyGoalTarget: number; dailyMaxLoss: number;
  subscriptionStatus: 'active' | 'expired' | null;
  budgetSettings: BudgetSettings | null;
}> {
  if (DEMO_MODE || !supabase) return { accounts: [], strategies: [], trades: [], expenses: [], payouts: [], dailyGoalTarget: 0, dailyMaxLoss: 0, subscriptionStatus: null, budgetSettings: null };

  // צור profile אם לא קיים (fallback על המקרה שה-trigger לא רץ)
  const { error: pe } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' });
  if (pe) logErr('profiles.upsert', pe);

  const [profileRes, accRes, stratRes, tradeRes, expRes, payRes] = await Promise.all([
    supabase.from('profiles').select('daily_goal_target, daily_max_loss, subscription_status, budget_settings').eq('id', userId).single(),
    supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('strategies').select('*, strategy_fields(*)').eq('user_id', userId).order('created_at'),
    supabase.from('trades').select('*, trade_media(*)').eq('user_id', userId).order('trade_date', { ascending: false }),
    supabase.from('prop_expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('prop_payouts').select('*').eq('user_id', userId).order('date', { ascending: false }),
  ]);

  logErr('profiles.select', profileRes.error);
  logErr('accounts.select', accRes.error);
  logErr('strategies.select', stratRes.error);
  logErr('trades.select', tradeRes.error);
  logErr('prop_expenses.select', expRes.error);
  logErr('prop_payouts.select', payRes.error);

  // If the accounts query failed (e.g. expired session, RLS), throw so the caller's
  // .catch() keeps the localStorage cache instead of treating it as a new user.
  if (accRes.error) throw new Error(`accounts fetch failed: ${accRes.error.message}`);

  const dailyGoalTarget    = profileRes.data?.daily_goal_target ?? 0;
  const dailyMaxLoss       = profileRes.data?.daily_max_loss ?? 0;
  const subscriptionStatus = (profileRes.data?.subscription_status ?? null) as 'active' | 'expired' | null;
  const budgetSettings     = (profileRes.data?.budget_settings ?? null) as BudgetSettings | null;

  const accounts: Account[] = (accRes.data ?? []).map((r) => ({
    id: r.id, user_id: r.user_id, name: r.name,
    account_type: r.account_type, broker: r.broker,
    initial_balance: r.initial_balance ?? 0,
    currency: r.currency ?? 'USD', is_active: r.is_active ?? true,
    // Prop Firm fields
    prop_phase: r.prop_phase ?? undefined,
    prop_drawdown_type: r.prop_drawdown_type ?? undefined,
    prop_max_drawdown: r.prop_max_drawdown ?? undefined,
    prop_daily_limit: r.prop_daily_limit ?? undefined,
    prop_profit_target: r.prop_profit_target ?? undefined,
    prop_min_days: r.prop_min_days ?? undefined,
    prop_max_days: r.prop_max_days ?? undefined,
    prop_start_date: r.prop_start_date ?? undefined,
  }));

  const strategies: Strategy[] = (stratRes.data ?? []).map((r) => ({
    id: r.id, user_id: r.user_id, name: r.name,
    description: r.description ?? '', color: r.color ?? '#1DB954',
    is_active: r.is_active ?? true,
    fields: (r.strategy_fields ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((f: { id: string; strategy_id: string; field_type: string; label: string; placeholder?: string; is_required: boolean; sort_order: number }) => ({
        id: f.id, strategy_id: f.strategy_id,
        field_type: f.field_type as 'checkbox' | 'text' | 'select' | 'tag',
        label: f.label, placeholder: f.placeholder,
        is_required: f.is_required, sort_order: f.sort_order,
      })),
  }));

  const trades: Trade[] = (tradeRes.data ?? []).map((r) => ({
    id: r.id, user_id: r.user_id, account_id: r.account_id,
    strategy_id: r.strategy_id, symbol: r.symbol, direction: r.direction,
    trade_date: r.trade_date, pnl: r.pnl ?? 0, size: r.size,
    stop_loss_pts: r.stop_loss_pts, take_profit_pts: r.take_profit_pts,
    htf_pd_array: r.htf_pd_array, psychology: r.psychology, notes: r.notes,
    confirmations: r.confirmations ?? {}, field_values: r.field_values ?? {},
    source: r.source ?? 'manual',
    broker_trade_id: r.broker_trade_id ?? undefined,
    media: (r.trade_media ?? []).map((m: { id: string; trade_id: string; storage_path: string; label?: string }) => ({
      id: m.id, trade_id: m.trade_id, storage_path: m.storage_path, label: m.label,
    })),
  }));

  const expenses: PropExpense[] = (expRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, user_id: r.user_id as string,
    account_id: (r.account_id as string | null) ?? undefined,
    prop_firm: r.prop_firm as string, account_size: (r.account_size as number) ?? 0,
    fee_type: r.fee_type as PropExpense['fee_type'], amount: (r.amount as number) ?? 0,
    date: r.date as string, notes: (r.notes as string | null) ?? undefined,
  }));

  const payouts: PropPayout[] = (payRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, user_id: r.user_id as string,
    account_id: (r.account_id as string | null) ?? undefined,
    prop_firm: r.prop_firm as string, amount: (r.amount as number) ?? 0,
    date: r.date as string, notes: (r.notes as string | null) ?? undefined,
  }));

  console.log(`[DB] Loaded: ${accounts.length} accounts, ${strategies.length} strategies, ${trades.length} trades, ${expenses.length} expenses, ${payouts.length} payouts`);
  return { accounts, strategies, trades, expenses, payouts, dailyGoalTarget, dailyMaxLoss, subscriptionStatus, budgetSettings };
}

// ─── PROP EXPENSES ───────────────────────────────────────────────────────────
export async function dbSaveExpense(expense: PropExpense, userId: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('prop_expenses').upsert({
    id: expense.id, user_id: userId,
    account_id: expense.account_id ?? null,
    prop_firm: expense.prop_firm, account_size: expense.account_size,
    fee_type: expense.fee_type, amount: expense.amount,
    date: expense.date, notes: expense.notes ?? null,
  });
  logErr('prop_expenses.upsert', error);
}

export async function dbDeleteExpense(id: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('prop_expenses').delete().eq('id', id);
  logErr('prop_expenses.delete', error);
}

// ─── PROP PAYOUTS ─────────────────────────────────────────────────────────────
export async function dbSavePayout(payout: PropPayout, userId: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('prop_payouts').upsert({
    id: payout.id, user_id: userId,
    account_id: payout.account_id ?? null,
    prop_firm: payout.prop_firm, amount: payout.amount,
    date: payout.date, notes: payout.notes ?? null,
  });
  logErr('prop_payouts.upsert', error);
}

export async function dbDeletePayout(id: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('prop_payouts').delete().eq('id', id);
  logErr('prop_payouts.delete', error);
}

// ─── PROFILE ─────────────────────────────────────────────────
export async function dbSaveProfile(userId: string, data: { dailyGoalTarget: number; dailyMaxLoss: number; budgetSettings?: BudgetSettings | null }) {
  if (DEMO_MODE || !supabase) return;
  const payload: Record<string, unknown> = {
    id: userId,
    daily_goal_target: data.dailyGoalTarget,
    daily_max_loss: data.dailyMaxLoss,
  };
  if ('budgetSettings' in data) payload.budget_settings = data.budgetSettings ?? null;
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  logErr('profiles.upsert', error);
}

export async function dbSaveBudgetSettings(userId: string, settings: BudgetSettings | null) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('profiles').upsert({ id: userId, budget_settings: settings }, { onConflict: 'id' });
  logErr('profiles.budget_settings.upsert', error);
}

// ─── ACCOUNTS ────────────────────────────────────────────────
export async function dbSaveAccount(account: Account, userId: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('accounts').upsert({
    id: account.id, user_id: userId, name: account.name,
    account_type: account.account_type, broker: account.broker,
    initial_balance: account.initial_balance,
    currency: account.currency, is_active: account.is_active,
    // Prop Firm fields
    prop_phase: account.prop_phase ?? null,
    prop_drawdown_type: account.prop_drawdown_type ?? null,
    prop_max_drawdown: account.prop_max_drawdown ?? null,
    prop_daily_limit: account.prop_daily_limit ?? null,
    prop_profit_target: account.prop_profit_target ?? null,
    prop_min_days: account.prop_min_days ?? null,
    prop_max_days: account.prop_max_days ?? null,
    prop_start_date: account.prop_start_date ?? null,
  });
  logErr('accounts.upsert', error);
}

export async function dbDeleteAccount(id: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  logErr('accounts.delete', error);
}

// ─── STRATEGIES ──────────────────────────────────────────────
export async function dbSaveStrategy(strategy: Strategy, userId: string) {
  if (DEMO_MODE || !supabase) return;

  const { error: se } = await supabase.from('strategies').upsert({
    id: strategy.id, user_id: userId, name: strategy.name,
    description: strategy.description ?? '', color: strategy.color,
    is_active: strategy.is_active,
  });
  logErr('strategies.upsert', se);
  if (se) return;

  // מחק שדות ישנים וכנס מחדש
  await supabase.from('strategy_fields').delete().eq('strategy_id', strategy.id);

  if (strategy.fields.length > 0) {
    const { error: fe } = await supabase.from('strategy_fields').insert(
      strategy.fields.map((f, i) => ({
        id: f.id, strategy_id: strategy.id, user_id: userId,
        field_type: f.field_type, label: f.label,
        placeholder: f.placeholder ?? null,
        is_required: f.is_required, sort_order: i + 1,
      }))
    );
    logErr('strategy_fields.insert', fe);
  }
}

export async function dbDeleteStrategy(id: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('strategies').delete().eq('id', id);
  logErr('strategies.delete', error);
}

// ─── TRADES ──────────────────────────────────────────────────
export async function dbSaveTrade(trade: Trade, userId: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('trades').upsert({
    id: trade.id, user_id: userId, account_id: trade.account_id,
    strategy_id: trade.strategy_id ?? null, symbol: trade.symbol,
    direction: trade.direction, trade_date: trade.trade_date,
    pnl: trade.pnl, size: trade.size ?? null,
    stop_loss_pts: trade.stop_loss_pts ?? null,
    take_profit_pts: trade.take_profit_pts ?? null,
    htf_pd_array: trade.htf_pd_array ?? null,
    psychology: trade.psychology ?? null, notes: trade.notes ?? null,
    confirmations: trade.confirmations ?? {},
    field_values: trade.field_values ?? {},
    source: trade.source ?? 'manual', status: 'complete',
    broker_trade_id: trade.broker_trade_id ?? null,
  });
  logErr('trades.upsert', error);
}

export async function dbDeleteTrade(id: string) {
  if (DEMO_MODE || !supabase) return;
  const { error } = await supabase.from('trades').delete().eq('id', id);
  logErr('trades.delete', error);
}

export async function dbUploadTradeMedia(tradeId: string, userId: string, files: File[]): Promise<void> {
  if (DEMO_MODE || !supabase) return;
  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${tradeId}/${crypto.randomUUID()}.${ext}`;
    console.log('[DB] Uploading media:', path);
    const { error: upErr } = await supabase.storage
      .from('trade-media')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) {
      console.error('[DB] storage.upload failed:', upErr.message, upErr);
      continue;
    }
    const { error: dbErr } = await supabase.from('trade_media').insert({
      id: crypto.randomUUID(),
      trade_id: tradeId,
      user_id: userId,
      storage_path: path,
    });
    if (dbErr) {
      console.error('[DB] trade_media.insert failed:', dbErr.message, dbErr);
    } else {
      console.log('[DB] Media saved OK:', path);
    }
  }
}

export async function dbGetTradeMediaUrls(mediaPaths: string[]): Promise<string[]> {
  if (DEMO_MODE || !supabase || mediaPaths.length === 0) return [];
  const urls = await Promise.all(
    mediaPaths.map(async (path) => {
      const { data } = await supabase!.storage
        .from('trade-media')
        .createSignedUrl(path, 60 * 60); // שעה
      return data?.signedUrl ?? '';
    })
  );
  return urls.filter(Boolean);
}

// ─── SEED ────────────────────────────────────────────────────
export async function dbSeedNewUser(userId: string, account: Account, strategies: Strategy[]) {
  if (DEMO_MODE || !supabase) return;
  await dbSaveAccount(account, userId);
  for (const s of strategies) await dbSaveStrategy(s, userId);
  console.log('[DB] New user seeded ✓');
}
