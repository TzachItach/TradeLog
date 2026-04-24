import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRADOVATE_BASE =
  Deno.env.get('TRADOVATE_BASE_URL') ?? 'https://live.tradovate.com/v1';
const APP_ID      = Deno.env.get('TRADOVATE_APP_ID')      ?? 'TradeLog';
const APP_VERSION = Deno.env.get('TRADOVATE_APP_VERSION') ?? '1.0';
const CID         = parseInt(Deno.env.get('TRADOVATE_CID') ?? '0');
const SEC         = Deno.env.get('TRADOVATE_SEC')          ?? '';
const DEVICE_ID   = 'tradelog-server-v1';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url       = new URL(req.url);
  const userId    = url.searchParams.get('user_id');
  const accountId = url.searchParams.get('account_id');
  const username  = url.searchParams.get('api_username');
  const password  = url.searchParams.get('api_password');

  if (!userId || !accountId || !username || !password) {
    return json({ error: 'Missing required parameters' }, 400);
  }

  // ── 1. Authenticate with Tradovate ─────────────────────────
  let accessToken: string;
  try {
    const authRes = await fetch(`${TRADOVATE_BASE}/auth/accesstokenrequest`, {
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
    const authData = await authRes.json();

    if (!authData.accessToken) {
      return json(
        { error: 'Invalid Tradovate credentials', detail: authData.errorText ?? JSON.stringify(authData) },
        401,
      );
    }
    accessToken = authData.accessToken;
  } catch (e) {
    return json({ error: 'Could not reach Tradovate API', detail: String(e) }, 502);
  }

  // ── 2. Fetch account list to get numeric account ID ────────
  let tradovateAccountId: number | null = null;
  try {
    const acctRes = await fetch(`${TRADOVATE_BASE}/account/list`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
    });
    const accounts = await acctRes.json();
    if (Array.isArray(accounts) && accounts.length > 0) {
      // Prefer the first active/live account
      const live = accounts.find((a: { active: boolean; accountType: string }) =>
        a.active && a.accountType !== 'Demo');
      tradovateAccountId = (live ?? accounts[0]).id;
    }
  } catch {
    // Non-fatal — sync will re-fetch if this is null
  }

  // ── 3. Store credentials in Supabase ───────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.from('broker_connections').upsert(
    {
      user_id:              userId,
      account_id:           accountId,
      broker:               'tradovate',
      api_username:         username,
      api_key:              password,
      tradovate_account_id: tradovateAccountId,
      is_active:            true,
    },
    { onConflict: 'user_id,account_id,broker' },
  );

  if (error) return json({ error: error.message }, 500);

  return json({ success: true, tradovateAccountId });
});
