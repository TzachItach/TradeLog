import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

const LIVE_BASE = 'https://live.tradovate.com/v1';
const DEMO_BASE = 'https://demo.tradovate.com/v1';

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

async function authenticate(baseUrl: string, username: string, password: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        name: username,
        password,
        appId: APP_ID,
        appVersion: APP_VERSION,
        deviceId: DEVICE_ID,
        cid: CID,
        sec: SEC,
      }),
    });
    const data = await res.json() as { accessToken?: string };
    return { token: data.accessToken, httpStatus: res.status };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    });
    res.end('ok');
    return;
  }

  if (req.method !== 'POST') {
    return sendJson(res, { error: 'Method not allowed' }, 405);
  }

  try {
    const body = await readBody(req);
    const userId    = body.user_id      as string | undefined;
    const accountId = body.account_id   as string | undefined;
    const username  = body.api_username as string | undefined;
    const password  = body.api_password as string | undefined;
    const env       = body.env === 'demo' ? 'demo' : 'live';
    const baseUrl   = env === 'demo' ? DEMO_BASE : LIVE_BASE;

    if (!userId || !accountId || !username || !password) {
      return sendJson(res, { error: 'Missing required parameters' }, 400);
    }

    // Verify JWT
    const authHeader = (req.headers['authorization'] ?? '') as string;
    if (!authHeader.startsWith('Bearer ')) {
      return sendJson(res, { error: 'Unauthorized' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      return sendJson(res, { error: 'Server misconfiguration: missing Supabase env vars' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user || user.id !== userId) {
      return sendJson(res, { error: 'Forbidden' }, 403);
    }

    // Authenticate with Tradovate
    let accessToken: string | undefined;
    try {
      const result = await authenticate(baseUrl, username, password);
      accessToken = result.token;
      if (!accessToken) {
        return sendJson(res, {
          error: 'Invalid Tradovate credentials — check email/password and Live/Demo selection',
          tradovateStatus: result.httpStatus,
        }, 401);
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      const isTimeout = detail.includes('abort') || detail.includes('timeout');
      return sendJson(res, {
        error: isTimeout ? 'Tradovate API timed out (15s)' : 'Could not reach Tradovate API',
        detail,
        baseUrl,
      }, 502);
    }

    // Fetch account list
    let tradovateAccountId: number | null = null;
    try {
      const acctRes = await fetch(`${baseUrl}/account/list`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const accounts = await acctRes.json() as Array<{ id: number; active: boolean }>;
      if (Array.isArray(accounts) && accounts.length > 0) {
        const active = accounts.filter((a) => a.active);
        tradovateAccountId = (active[0] ?? accounts[0]).id ?? null;
      }
    } catch {
      // Non-fatal
    }

    // Store in Supabase
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { error: dbError } = await adminClient.from('broker_connections').upsert(
      {
        user_id:              userId,
        account_id:           accountId,
        broker:               'tradovate',
        api_username:         username,
        api_key:              password,
        tradovate_account_id: tradovateAccountId,
        broker_env:           env,
        is_active:            true,
      },
      { onConflict: 'user_id,account_id,broker' },
    );

    if (dbError) return sendJson(res, { error: dbError.message }, 500);

    return sendJson(res, { success: true, env, tradovateAccountId });

  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return sendJson(res, { error: 'Internal server error', detail }, 500);
  }
}
