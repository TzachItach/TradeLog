import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECTX_BASE =
  Deno.env.get('TOPSTEPX_BASE_URL') ?? 'https://api.topstepx.com';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface ProjectXAccount {
  id: number;
  name: string;
  balance: number;
  canTrade: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const body         = await req.json().catch(() => ({}));
  const broker       = body.broker               as string | undefined;
  const userId       = body.user_id              as string | undefined;
  const accountId    = body.account_id           as string | undefined; // TradeLog account UUID
  const apiToken     = body.api_token            as string | undefined;
  const apiUsername  = body.api_username         as string | undefined;
  const step         = body.step                 as 'validate' | 'connect' | undefined;
  const pxAccountId  = body.projectx_account_id  as number | undefined;

  const isValidate = step === 'validate';

  if (broker !== 'topstepx' || !userId || !apiToken || !apiUsername) {
    return json({ error: 'Missing required parameters' }, 400);
  }
  if (!isValidate && !accountId) {
    return json({ error: 'Missing account_id for connect step' }, 400);
  }

  // ── Verify JWT ─────────────────────────────────────────────
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

  // ── Authenticate with ProjectX ─────────────────────────────
  let sessionToken: string;
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

  // ── Fetch ProjectX accounts ────────────────────────────────
  let accounts: ProjectXAccount[] = [];
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
      accounts = acctData.accounts as ProjectXAccount[];
    }
  } catch (e) {
    if (isValidate) {
      return json({ error: 'Could not fetch TopstepX accounts', detail: String(e) }, 502);
    }
  }

  // ── Validate step: return account list, no DB write ────────
  if (isValidate) {
    if (!accounts.length) {
      return json({ error: 'No active TopstepX accounts found' }, 404);
    }
    return json({ success: true, accounts });
  }

  // ── Connect step: save chosen account to DB ────────────────
  // Use the explicitly chosen pxAccountId, or fall back to accounts[0]
  const resolvedPxId = pxAccountId ?? accounts[0]?.id ?? null;

  const { error } = await supabase.from('broker_connections').upsert(
    {
      user_id:             userId,
      account_id:          accountId,
      broker:              'topstepx',
      api_username:        apiUsername,
      api_key:             apiToken,
      projectx_account_id: resolvedPxId,
      is_active:           true,
    },
    { onConflict: 'user_id,account_id,broker' },
  );

  if (error) return json({ error: error.message }, 500);

  return json({ success: true });
});
