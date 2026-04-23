import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECTX_BASE =
  Deno.env.get('TOPSTEPX_BASE_URL') ?? 'https://api.topstepx.projectx.com';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const broker      = url.searchParams.get('broker');
  const userId      = url.searchParams.get('user_id');
  const accountId   = url.searchParams.get('account_id');
  const apiToken    = url.searchParams.get('api_token');
  const apiUsername = url.searchParams.get('api_username');

  if (broker !== 'topstepx' || !userId || !accountId || !apiToken || !apiUsername) {
    return json({ error: 'Missing required parameters' }, 400);
  }

  // ── 1. Validate credentials with ProjectX ──────────────────
  let sessionToken: string;
  let projectxAccountId: number | null = null;

  try {
    const authRes = await fetch(`${PROJECTX_BASE}/api/Auth/loginKey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: apiUsername, apiKey: apiToken }),
    });
    const authData = await authRes.json();

    if (!authData.success || !authData.token) {
      return json({ error: 'Invalid TopstepX credentials', detail: authData.errorMessage }, 401);
    }
    sessionToken = authData.token;
  } catch (e) {
    return json({ error: 'Could not reach TopstepX API', detail: String(e) }, 502);
  }

  // ── 2. Fetch ProjectX account ID ───────────────────────────
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
    }
  } catch {
    // Non-fatal — sync will re-fetch accounts if this is null
  }

  // ── 3. Store credentials ───────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase.from('broker_connections').upsert(
    {
      user_id:              userId,
      account_id:           accountId,
      broker:               'topstepx',
      api_username:         apiUsername,
      api_key:              apiToken,
      projectx_account_id:  projectxAccountId,
      is_active:            true,
    },
    { onConflict: 'user_id,account_id,broker' },
  );

  if (error) return json({ error: error.message }, 500);

  return json({ success: true });
});
