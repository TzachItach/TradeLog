import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIVE_BASE  = 'https://live.tradovate.com/v1';
const DEMO_BASE  = 'https://demo.tradovate.com/v1';

const APP_ID      = Deno.env.get('TRADOVATE_APP_ID')      ?? 'TradeLog';
const APP_VERSION = Deno.env.get('TRADOVATE_APP_VERSION') ?? '1.0';
const CID         = parseInt(Deno.env.get('TRADOVATE_CID') ?? '0');
const SEC         = Deno.env.get('TRADOVATE_SEC')          ?? '';
const DEVICE_ID   = 'tradelog-server-v1';

// ── Symbol normalization ────────────────────────────────────────
// "MNQM5" → "MNQ" | "ESH5" → "ES" | "MNQ M5" → "MNQ"
function normalizeSymbol(raw: string): string {
  return raw
    .replace(/\s+[FGHJKMNQUVXZ]\d{1,2}$/, '')
    .replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '')
    .toUpperCase()
    .trim();
}

interface TradovateExecReport {
  id: number;
  accountId: number;
  contractId: number;
  timestamp: string;
  price: number;
  qty: number;
  side: 'Buy' | 'Sell';
  orderId: number;
  grossPL?: number;
  commission?: number;
}

interface TradovateContract {
  id: number;
  name: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function getBaseUrl(env: string | null): string {
  return env === 'demo' ? DEMO_BASE : LIVE_BASE;
}

async function getTradovateToken(baseUrl: string, username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name:       username,
        password,
        appId:      APP_ID,
        appVersion: APP_VERSION,
        deviceId:   DEVICE_ID,
        cid:        CID,
        sec:        SEC,
      }),
    });
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

async function fetchExecReports(baseUrl: string, token: string): Promise<TradovateExecReport[]> {
  const res = await fetch(`${baseUrl}/executionReport/list`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchContract(baseUrl: string, token: string, contractId: number): Promise<TradovateContract | null> {
  try {
    const res = await fetch(`${baseUrl}/contract/item?id=${contractId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id ? (data as TradovateContract) : null;
  } catch {
    return null;
  }
}

async function fetchTradovateAccountId(baseUrl: string, token: string): Promise<number | null> {
  try {
    const res = await fetch(`${baseUrl}/account/list`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const accounts = await res.json();
    if (!Array.isArray(accounts) || accounts.length === 0) return null;
    const active = accounts.filter((a: { active: boolean }) => a.active);
    return (active[0] ?? accounts[0]).id ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const body   = await req.json().catch(() => ({}));
  const userId = body.user_id as string | undefined;

  if (!userId) return json({ error: 'Missing user_id in request body' }, 400);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── 1. Load active Tradovate connections ───────────────────
  const { data: connections, error: connErr } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('broker', 'tradovate')
    .eq('is_active', true);

  if (connErr) return json({ error: connErr.message }, 500);
  if (!connections?.length) {
    return json({ error: 'No active Tradovate connection. Connect first in Settings.' }, 404);
  }

  let totalInserted = 0;

  for (const conn of connections) {
    // Use the stored environment (live or demo) so eval accounts work correctly
    const baseUrl = getBaseUrl(conn.broker_env);

    // ── 2. Authenticate ───────────────────────────────────────
    const token = await getTradovateToken(baseUrl, conn.api_username, conn.api_key);
    if (!token) {
      console.error(`[tradovate-sync] Auth failed for account ${conn.account_id} (env: ${conn.broker_env})`);
      continue;
    }

    // ── 3. Resolve numeric Tradovate account ID ───────────────
    let tradovateAccountId: number = conn.tradovate_account_id;
    if (!tradovateAccountId) {
      const resolved = await fetchTradovateAccountId(baseUrl, token);
      if (!resolved) {
        console.error('[tradovate-sync] Could not resolve Tradovate account ID');
        continue;
      }
      tradovateAccountId = resolved;
      await supabase.from('broker_connections')
        .update({ tradovate_account_id: tradovateAccountId })
        .eq('id', conn.id);
    }

    // ── 4. Determine sync window ──────────────────────────────
    const startDate = conn.last_synced_at
      ? new Date(conn.last_synced_at)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endTimestamp = new Date().toISOString();

    // ── 5. Fetch all execution reports ────────────────────────
    let allReports: TradovateExecReport[] = [];
    try {
      allReports = await fetchExecReports(baseUrl, token);
    } catch (e) {
      console.error('[tradovate-sync] Execution report fetch failed:', e);
      continue;
    }

    // ── 6. Filter: this account, within time window, closing fills only
    // Closing fills realise P&L → grossPL non-zero.
    // side: "Sell" closes a long → direction 'long'
    // side: "Buy"  closes a short → direction 'short'
    const closingFills = allReports.filter((r) => {
      if (r.accountId !== tradovateAccountId) return false;
      if (new Date(r.timestamp) < startDate) return false;
      return r.grossPL !== undefined && r.grossPL !== null && r.grossPL !== 0;
    });

    if (!closingFills.length) {
      await supabase.from('broker_connections')
        .update({ last_synced_at: endTimestamp })
        .eq('id', conn.id);
      continue;
    }

    // ── 7. Filter out already-imported fills ──────────────────
    const candidateIds = closingFills.map((r) => `tradovate-${r.id}`);
    const { data: existing } = await supabase
      .from('trades')
      .select('broker_trade_id')
      .eq('user_id', userId)
      .in('broker_trade_id', candidateIds);

    const existingSet = new Set(
      (existing ?? []).map((r: { broker_trade_id: string }) => r.broker_trade_id),
    );
    const newFills = closingFills.filter((r) => !existingSet.has(`tradovate-${r.id}`));

    if (!newFills.length) {
      await supabase.from('broker_connections')
        .update({ last_synced_at: endTimestamp })
        .eq('id', conn.id);
      continue;
    }

    // ── 8. Resolve contract IDs → symbols (parallel) ──────────
    const uniqueContractIds = [...new Set(newFills.map((r) => r.contractId))];
    const contractMap = new Map<number, string>();

    await Promise.all(
      uniqueContractIds.map(async (cid) => {
        const contract = await fetchContract(baseUrl, token, cid);
        if (contract?.name) {
          contractMap.set(cid, normalizeSymbol(contract.name));
        }
      }),
    );

    // ── 9. Map fills to TradeLog trade rows ───────────────────
    const rows = newFills.map((r) => {
      const symbol     = contractMap.get(r.contractId) ?? `CONTRACT-${r.contractId}`;
      const grossPL    = r.grossPL    ?? 0;
      const commission = r.commission ?? 0;
      const pnl        = Math.round((grossPL - commission) * 100) / 100;
      const envLabel   = conn.broker_env === 'demo' ? 'Tradovate Demo' : 'Tradovate';

      return {
        id:              crypto.randomUUID(),
        user_id:         userId,
        account_id:      conn.account_id,
        symbol,
        direction:       r.side === 'Sell' ? 'long' : 'short',
        trade_date:      r.timestamp.split('T')[0],
        pnl,
        size:            r.qty,
        notes:           commission > 0
          ? `Fees: $${commission.toFixed(2)} | ${envLabel}`
          : envLabel,
        source:          'auto',
        broker_trade_id: `tradovate-${r.id}`,
        confirmations:   {},
        field_values:    {},
      };
    });

    const { error: insertErr } = await supabase.from('trades').insert(rows);
    if (insertErr) {
      console.error('[tradovate-sync] Insert failed:', insertErr.message);
    } else {
      totalInserted += rows.length;
    }

    // ── 10. Update last_synced_at ─────────────────────────────
    await supabase.from('broker_connections')
      .update({ last_synced_at: endTimestamp })
      .eq('id', conn.id);
  }

  return json({ success: true, inserted: totalInserted });
});
