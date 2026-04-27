import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

const LIVE_BASE = 'https://live.tradovateapi.com/v1';
const DEMO_BASE = 'https://demo.tradovateapi.com/v1';

const APP_ID      = process.env.TRADOVATE_APP_ID      ?? 'tradovate_trader(web)';
const APP_VERSION = process.env.TRADOVATE_APP_VERSION ?? '1.0';
const CID         = parseInt(process.env.TRADOVATE_CID ?? '1');
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
        enc: true,
        chl: String(Math.floor(Math.random() * 1e12)),
      }),
    });
    const text = await res.text();
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Tradovate returned HTTP ${res.status} with non-JSON response: ${text.slice(0, 200)}`);
    }
    const data = JSON.parse(text) as { accessToken?: string };
    return { token: data.accessToken, httpStatus: res.status, rawBody: text };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAccounts(baseUrl: string, accessToken: string) {
  const res = await fetch(`${baseUrl}/account/list`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
  });
  const raw = await res.json() as Array<{ id: number; name: string; active: boolean; archived?: boolean }>;
  return (Array.isArray(raw) ? raw : [])
    .filter((a) => !a.archived)
    .map((a) => ({ id: a.id, name: a.name, active: a.active }));
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

  try {
    const body      = await readBody(req);
    const action    = (body.action as string | undefined) ?? 'connect';
    const userId    = body.user_id      as string | undefined;
    const username  = body.api_username as string | undefined;
    const password  = body.api_password as string | undefined;
    const env          = body.env === 'demo' ? 'demo' : 'live';
    const preAuthToken = body.pre_auth_token as string | undefined;
    const primaryUrl   = env === 'demo' ? DEMO_BASE : LIVE_BASE;
    const fallbackUrl  = env === 'demo' ? LIVE_BASE : DEMO_BASE;

    if (!userId || !username || !password) return sendJson(res, { error: 'Missing required parameters' }, 400);

    // Verify JWT
    const authHeader = (req.headers['authorization'] ?? '') as string;
    if (!authHeader.startsWith('Bearer ')) return sendJson(res, { error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';
    if (!supabaseUrl || !supabaseKey) return sendJson(res, { error: 'Server misconfiguration' }, 500);

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user || user.id !== userId) return sendJson(res, { error: 'Forbidden' }, 403);

    // Authenticate with Tradovate — use pre_auth_token if provided (client-side auth), else try server-side
    let accessToken: string | undefined;
    let baseUrl = primaryUrl;
    let resolvedEnv = env;

    if (preAuthToken) {
      // Token already obtained client-side — skip server-side re-auth
      accessToken = preAuthToken;
    } else {
      try {
        const primary = await authenticate(primaryUrl, username, password);
        if (primary.token) {
          accessToken = primary.token;
        } else {
          const fallback = await authenticate(fallbackUrl, username, password);
          if (fallback.token) {
            accessToken = fallback.token;
            baseUrl = fallbackUrl;
            resolvedEnv = env === 'demo' ? 'live' : 'demo';
          } else {
            return sendJson(res, {
              error: 'Invalid Tradovate credentials — check username/password',
              hint: 'Tried both Live and Demo endpoints. Verify credentials at trader.tradovate.com',
              tradovateStatus: primary.httpStatus,
              tradovateResponse: primary.rawBody,
            }, 401);
          }
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
    }

    // ── LIST MODE: return accounts, don't save ──
    if (action === 'list') {
      try {
        const accounts = await fetchAccounts(baseUrl, accessToken);
        return sendJson(res, { accounts, resolvedEnv });
      } catch {
        return sendJson(res, { error: 'Could not fetch Tradovate account list' }, 502);
      }
    }

    // ── CONNECT MODE: save specific connection ──
    const accountId           = body.account_id          as string | undefined;
    const tradovateAccountId  = body.tradovate_account_id as number | undefined;

    if (!accountId) return sendJson(res, { error: 'Missing account_id' }, 400);

    // If no specific tradovate_account_id provided, use first active account (legacy fallback)
    let resolvedTdvId: number | null = tradovateAccountId ?? null;
    if (!resolvedTdvId) {
      try {
        const accounts = await fetchAccounts(baseUrl, accessToken);
        const active = accounts.filter((a) => a.active);
        resolvedTdvId = (active[0] ?? accounts[0])?.id ?? null;
      } catch { /* non-fatal */ }
    }

    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey;
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error: dbError } = await adminClient.from('broker_connections').upsert(
      {
        user_id:              userId,
        account_id:           accountId,
        broker:               'tradovate',
        api_username:         username,
        api_key:              password,
        tradovate_account_id: resolvedTdvId,
        broker_env:           resolvedEnv,
        is_active:            true,
      },
      { onConflict: 'user_id,account_id,broker' },
    );

    if (dbError) return sendJson(res, { error: dbError.message }, 500);
    return sendJson(res, { success: true, env, tradovateAccountId: resolvedTdvId });

  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return sendJson(res, { error: 'Internal server error', detail }, 500);
  }
}
