import { createClient } from '@supabase/supabase-js';

const LIVE_BASE = 'https://live.tradovate.com/v1';
const DEMO_BASE = 'https://demo.tradovate.com/v1';

const APP_ID      = process.env.TRADOVATE_APP_ID      ?? 'TradeLog';
const APP_VERSION = process.env.TRADOVATE_APP_VERSION ?? '1.0';
const CID         = parseInt(process.env.TRADOVATE_CID ?? '0');
const SEC         = process.env.TRADOVATE_SEC          ?? '';
const DEVICE_ID   = 'tradelog-server-v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
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
    return { token: data.accessToken as string | undefined, status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Parse body
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const userId    = body.user_id     as string | undefined;
  const accountId = body.account_id  as string | undefined;
  const username  = body.api_username as string | undefined;
  const password  = body.api_password as string | undefined;
  const env       = body.env === 'demo' ? 'demo' : 'live';
  const baseUrl   = env === 'demo' ? DEMO_BASE : LIVE_BASE;

  if (!userId || !accountId || !username || !password) {
    return json({ error: 'Missing required parameters' }, 400);
  }

  // Verify JWT
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const supabaseUrl  = process.env.VITE_SUPABASE_URL!;
  const supabaseKey  = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabase     = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authErr || !user || user.id !== userId) {
    return json({ error: 'Forbidden' }, 403);
  }

  // Authenticate with Tradovate
  let accessToken: string | undefined;
  try {
    const result = await authenticate(baseUrl, username, password);
    accessToken = result.token;
    if (!accessToken) {
      return json({
        error: 'Invalid Tradovate credentials — check email/password and Live/Demo selection',
        tradovateStatus: result.status,
      }, 401);
    }
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const isTimeout = detail.includes('abort') || detail.includes('timeout');
    return json({
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
    const accounts = await acctRes.json();
    if (Array.isArray(accounts) && accounts.length > 0) {
      const active = accounts.filter((a: { active: boolean }) => a.active);
      tradovateAccountId = (active[0] ?? accounts[0]).id ?? null;
    }
  } catch {
    // Non-fatal
  }

  // Store in Supabase (use service role if available, else anon)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey;
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { error } = await adminClient.from('broker_connections').upsert(
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

  if (error) return json({ error: error.message }, 500);

  return json({ success: true, env, tradovateAccountId });
}
