import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECTX_BASE =
  Deno.env.get('TOPSTEPX_BASE_URL') ?? 'https://api.topstepx.com';

// ProjectX uses non-standard symbols for some contracts
const PX_ALIAS: Record<string, string> = {
  EP: 'ES',   // E-mini S&P 500
};

// MNQM5 → MNQ | CON.F.US.MNQ.M25 → MNQ | CON.F.US.EP.H25 → ES
function normalizeSymbol(raw: string): string {
  const parts = raw.split('.');
  const base = parts.length >= 4
    ? parts[3].toUpperCase()
    : raw.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '').toUpperCase().trim();
  return PX_ALIAS[base] ?? base;
}

interface ProjectXTrade {
  id: number;
  contractId: string;
  creationTimestamp: string;
  profitAndLoss: number | null;
  fees: number;
  side: number;   // 1=buy, 0=sell
  size: number;
  voided: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const body = await req.json().catch(() => ({}));
  const userId: string | undefined = body.user_id;

  if (!userId) return json({ error: 'Missing user_id in request body' }, 400);

  // ── Verify JWT — caller must be the same user ──────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authErr || !user || user.id !== userId) {
    return json({ error: 'Forbidden' }, 403);
  }

  // ── 1. Load active TopstepX connections ────────────────────
  const { data: connections, error: connErr } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('broker', 'topstepx')
    .eq('is_active', true);

  if (connErr) return json({ error: connErr.message }, 500);
  if (!connections?.length) {
    return json({ error: 'No active TopstepX connection. Connect first in Settings.' }, 404);
  }

  let totalInserted = 0;
  const errors: string[] = [];

  for (const conn of connections) {
    // ── 2. Authenticate with ProjectX ────────────────────────
    // Official docs: POST /api/Auth/loginKey → {token, success, errorCode, errorMessage}
    // errorCode 0 = success; token valid for 24 hours
    let sessionToken: string;
    try {
      const authRes = await fetch(`${PROJECTX_BASE}/api/Auth/loginKey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: conn.api_username, apiKey: conn.api_key }),
      });
      const authData = await authRes.json();
      if (!authData.success || !authData.token) {
        const msg = authData.errorCode === 3
          ? 'Invalid TopstepX credentials — please reconnect in Settings'
          : `TopstepX auth failed (errorCode: ${authData.errorCode ?? 'unknown'})`;
        console.error(`[topstepx-sync] ${msg} for account ${conn.account_id}`);
        errors.push(msg);
        continue;
      }
      sessionToken = authData.token;
    } catch (e) {
      const msg = 'Could not reach TopstepX API';
      console.error('[topstepx-sync] Auth request failed:', e);
      errors.push(msg);
      continue;
    }

    // ── 3. Resolve ProjectX account ID ───────────────────────
    // Official docs: POST /api/Account/search → {accounts[{id,name,canTrade,isVisible}], success, errorCode}
    let projectxAccountId: number = conn.projectx_account_id;
    if (!projectxAccountId) {
      try {
        const acctRes = await fetch(`${PROJECTX_BASE}/api/Account/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ onlyActiveAccounts: true }),
        });
        const acctData = await acctRes.json();
        if (acctData.success && acctData.accounts?.length > 0) {
          projectxAccountId = acctData.accounts[0].id;
          await supabase.from('broker_connections')
            .update({ projectx_account_id: projectxAccountId })
            .eq('id', conn.id);
        }
      } catch {
        // non-fatal: if already cached above this won't run
      }
    }
    if (!projectxAccountId) {
      const msg = 'Could not resolve TopstepX account ID';
      console.error('[topstepx-sync]', msg);
      errors.push(msg);
      continue;
    }

    // ── 4. Determine sync window ──────────────────────────────
    // First sync: last 90 days. Subsequent syncs: from last_synced_at.
    const startTimestamp = conn.last_synced_at
      ? new Date(conn.last_synced_at).toISOString()
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endTimestamp = new Date().toISOString();

    // ── 5. Fetch trades from ProjectX ─────────────────────────
    // Official docs: POST /api/Trade/search → {trades[{id,contractId,creationTimestamp,
    //   profitAndLoss,fees,side,size,voided}], success, errorCode}
    // side: 0=Sell(closed long)→direction:'long', 1=Buy(closed short)→direction:'short'
    // profitAndLoss: null = half-turn (open position), skip it
    let rawTrades: ProjectXTrade[] = [];
    try {
      const tradeRes = await fetch(`${PROJECTX_BASE}/api/Trade/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          accountId: projectxAccountId,
          startTimestamp,
          endTimestamp,
        }),
      });
      const tradeData = await tradeRes.json();
      if (!tradeData.success) {
        const msg = `Trade fetch failed (errorCode: ${tradeData.errorCode ?? 'unknown'})`;
        console.error('[topstepx-sync]', msg);
        errors.push(msg);
        continue;
      }
      if (tradeData.trades?.length) {
        rawTrades = (tradeData.trades as ProjectXTrade[])
          .filter(t => t.profitAndLoss !== null && !t.voided);
      }
    } catch (e) {
      const msg = 'Could not fetch trades from TopstepX';
      console.error('[topstepx-sync] Trade fetch failed:', e);
      errors.push(msg);
      continue;
    }

    if (!rawTrades.length) {
      await supabase.from('broker_connections')
        .update({ last_synced_at: endTimestamp })
        .eq('id', conn.id);
      continue;
    }

    // ── 6. Filter out already-imported trades ─────────────────
    const candidateIds = rawTrades.map(t => `topstepx-${t.id}`);
    const { data: existing } = await supabase
      .from('trades')
      .select('broker_trade_id')
      .eq('user_id', userId)
      .in('broker_trade_id', candidateIds);

    const existingSet = new Set((existing ?? []).map((r: { broker_trade_id: string }) => r.broker_trade_id));
    const newTrades = rawTrades.filter(t => !existingSet.has(`topstepx-${t.id}`));

    if (newTrades.length === 0) {
      await supabase.from('broker_connections')
        .update({ last_synced_at: endTimestamp })
        .eq('id', conn.id);
      continue;
    }

    // ── 7. Map and insert ─────────────────────────────────────
    const rows = newTrades.map(t => ({
      id:              crypto.randomUUID(),
      user_id:         userId,
      account_id:      conn.account_id,
      symbol:          normalizeSymbol(t.contractId),
      direction:       t.side === 0 ? 'long' : 'short',
      trade_date:      t.creationTimestamp.split('T')[0],
      pnl:             Math.round(((t.profitAndLoss ?? 0) - (t.fees ?? 0)) * 100) / 100,
      size:            t.size,
      notes:           (t.fees ?? 0) > 0 ? `Fees: $${(t.fees).toFixed(2)} | TopstepX` : 'TopstepX',
      source:          'topstepx',
      broker_trade_id: `topstepx-${t.id}`,
      confirmations:   {},
      field_values:    {},
    }));

    const { error: insertErr } = await supabase.from('trades').insert(rows);
    if (insertErr) {
      const msg = `Failed to save trades: ${insertErr.message}`;
      console.error('[topstepx-sync]', msg);
      errors.push(msg);
    } else {
      totalInserted += rows.length;
    }

    // ── 8. Update last_synced_at ──────────────────────────────
    await supabase.from('broker_connections')
      .update({ last_synced_at: endTimestamp })
      .eq('id', conn.id);
  }

  return json({ success: true, inserted: totalInserted, errors });
});
