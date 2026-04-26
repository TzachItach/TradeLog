import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

const LIVE_BASE = 'https://live.tradovateapi.com/v1';
const DEMO_BASE = 'https://demo.tradovateapi.com/v1';

const APP_ID      = process.env.TRADOVATE_APP_ID      ?? 'TradeLog';
const APP_VERSION = process.env.TRADOVATE_APP_VERSION ?? '1.0';
const CID         = parseInt(process.env.TRADOVATE_CID ?? '0');
const SEC         = process.env.TRADOVATE_SEC          ?? '';
const DEVICE_ID   = 'tradelog-server-v1';

function sendJson(res: ServerResponse, body: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

function normalizeSymbol(raw: string): string {
  return raw
    .replace(/\s+[FGHJKMNQUVXZ]\d{1,2}$/, '')
    .replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '')
    .toUpperCase()
    .trim();
}

async function getTradovateToken(baseUrl: string, username: string, password: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ name: username, password, appId: APP_ID, appVersion: APP_VERSION, deviceId: DEVICE_ID, cid: CID, sec: SEC }),
    });
    const data = await res.json() as { accessToken?: string };
    return data.accessToken ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchContract(baseUrl: string, token: string, contractId: number): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/contract/item?id=${contractId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json() as { name?: string };
    return data?.name ? normalizeSymbol(data.name) : null;
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
    const accounts = await res.json() as Array<{ id: number; active: boolean }>;
    if (!Array.isArray(accounts) || accounts.length === 0) return null;
    const active = accounts.filter((a) => a.active);
    return (active[0] ?? accounts[0]).id ?? null;
  } catch {
    return null;
  }
}

interface ExecReport {
  id: number;
  accountId: number;
  contractId: number;
  timestamp: string;
  qty: number;
  side: 'Buy' | 'Sell';
  grossPL?: number;
  commission?: number;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    });
    res.end('ok');
    return;
  }

  if (req.method !== 'POST') return sendJson(res, { error: 'Method not allowed' }, 405);

  const body   = await readBody(req);
  const userId = body.user_id as string | undefined;
  if (!userId) return sendJson(res, { error: 'Missing user_id' }, 400);

  // Verify JWT
  const authHeader = (req.headers['authorization'] ?? '') as string;
  if (!authHeader.startsWith('Bearer ')) return sendJson(res, { error: 'Unauthorized' }, 401);
  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey;

  if (!supabaseUrl || !supabaseKey) return sendJson(res, { error: 'Server misconfiguration' }, 500);

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user || user.id !== userId) return sendJson(res, { error: 'Forbidden' }, 403);

  // Load active Tradovate connections
  const { data: connections, error: connErr } = await supabase
    .from('broker_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('broker', 'tradovate')
    .eq('is_active', true);

  if (connErr) return sendJson(res, { error: connErr.message }, 500);
  if (!connections?.length) return sendJson(res, { error: 'No active Tradovate connection. Connect first in Settings.' }, 404);

  let totalInserted = 0;

  for (const conn of connections) {
    const baseUrl = conn.broker_env === 'demo' ? DEMO_BASE : LIVE_BASE;

    // Authenticate
    const accessToken = await getTradovateToken(baseUrl, conn.api_username, conn.api_key);
    if (!accessToken) {
      console.error(`[tradovate-sync] Auth failed for account ${conn.account_id}`);
      continue;
    }

    // Resolve account ID if missing
    let tradovateAccountId: number = conn.tradovate_account_id;
    if (!tradovateAccountId) {
      const resolved = await fetchTradovateAccountId(baseUrl, accessToken);
      if (!resolved) continue;
      tradovateAccountId = resolved;
      await supabase.from('broker_connections').update({ tradovate_account_id: tradovateAccountId }).eq('id', conn.id);
    }

    // Sync window
    const startDate = conn.last_synced_at
      ? new Date(conn.last_synced_at)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endTimestamp = new Date().toISOString();

    // Fetch execution reports
    let allReports: ExecReport[] = [];
    try {
      const rRes = await fetch(`${baseUrl}/executionReport/list`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      if (rRes.ok) {
        const data = await rRes.json();
        allReports = Array.isArray(data) ? data as ExecReport[] : [];
      }
    } catch {
      continue;
    }

    // Filter: this account, within window, closing fills only (grossPL != 0)
    const closingFills = allReports.filter((r) => {
      if (r.accountId !== tradovateAccountId) return false;
      if (new Date(r.timestamp) < startDate) return false;
      return r.grossPL !== undefined && r.grossPL !== null && r.grossPL !== 0;
    });

    if (!closingFills.length) {
      await supabase.from('broker_connections').update({ last_synced_at: endTimestamp }).eq('id', conn.id);
      continue;
    }

    // Filter already-imported
    const candidateIds = closingFills.map((r) => `tradovate-${r.id}`);
    const { data: existing } = await supabase
      .from('trades').select('broker_trade_id').eq('user_id', userId).in('broker_trade_id', candidateIds);
    const existingSet = new Set((existing ?? []).map((r: { broker_trade_id: string }) => r.broker_trade_id));
    const newFills = closingFills.filter((r) => !existingSet.has(`tradovate-${r.id}`));

    if (!newFills.length) {
      await supabase.from('broker_connections').update({ last_synced_at: endTimestamp }).eq('id', conn.id);
      continue;
    }

    // Resolve contract IDs → symbols (parallel)
    const uniqueContractIds = [...new Set(newFills.map((r) => r.contractId))];
    const contractMap = new Map<number, string>();
    await Promise.all(
      uniqueContractIds.map(async (cid) => {
        const sym = await fetchContract(baseUrl, accessToken, cid);
        if (sym) contractMap.set(cid, sym);
      }),
    );

    // Build rows
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
        notes:           commission > 0 ? `Fees: $${commission.toFixed(2)} | ${envLabel}` : envLabel,
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

    await supabase.from('broker_connections').update({ last_synced_at: endTimestamp }).eq('id', conn.id);
  }

  return sendJson(res, { success: true, inserted: totalInserted });
}
