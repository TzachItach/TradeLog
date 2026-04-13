// supabase/functions/broker-oauth/index.ts
// מטפל ב-OAuth callbacks מברוקרים
// deploy: supabase functions deploy broker-oauth

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TRADOVATE_BASE = 'https://live.tradovate.com/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  const url = new URL(req.url);
  const broker  = url.searchParams.get('broker');   // 'tradovate'
  const code    = url.searchParams.get('code');      // OAuth code
  const userId  = url.searchParams.get('user_id');  // TradeLog user ID
  const accountId = url.searchParams.get('account_id'); // TradeLog account ID

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const appUrl = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';

  try {
    if (broker === 'tradovate') {
      const clientId     = Deno.env.get('TRADOVATE_CLIENT_ID')!;
      const clientSecret = Deno.env.get('TRADOVATE_CLIENT_SECRET')!;
      const redirectUri  = `${Deno.env.get('SUPABASE_URL')}/functions/v1/broker-oauth?broker=tradovate`;

      // החלף code בטוקן
      const tokenRes = await fetch(`${TRADOVATE_BASE}/auth/oauthtoken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Tradovate token exchange failed: ${err}`);
      }

      const token = await tokenRes.json();

      // שלוף פרטי חשבון מ-Tradovate
      const acctRes = await fetch(`${TRADOVATE_BASE}/account/list`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const accounts = await acctRes.json();
      const brokerAccountId = accounts?.[0]?.id?.toString() ?? 'unknown';

      // שמור חיבור ב-Supabase (מוצפן ב-base64)
      const tokenEncoded = btoa(JSON.stringify(token));
      await supabase.from('broker_connections').upsert({
        id: crypto.randomUUID(),
        user_id: userId,
        account_id: accountId,
        broker: 'tradovate',
        broker_account_id: brokerAccountId,
        access_token: tokenEncoded,
        token_expires_at: token.expiration_time,
        is_active: true,
      }, { onConflict: 'account_id,broker' });

      // הפנה בחזרה לאפליקציה
      return Response.redirect(`${appUrl}/dashboard/settings?broker=tradovate&status=success`, 302);
    }

    if (broker === 'topstepx') {
      // TopstepX uses API token (passed directly, not OAuth code)
      const apiToken = url.searchParams.get('api_token');
      if (!apiToken) throw new Error('Missing api_token for TopstepX');

      // אמת את הטוקן מול TopstepX API
      const testRes = await fetch('https://api.topstepx.com/api/v1/account/search', {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!testRes.ok) throw new Error('Invalid TopstepX API token');
      const data = await testRes.json();
      const brokerAccountId = data.accounts?.[0]?.id?.toString() ?? 'unknown';

      const tokenEncoded = btoa(apiToken);
      await supabase.from('broker_connections').upsert({
        id: crypto.randomUUID(),
        user_id: userId,
        account_id: accountId,
        broker: 'topstepx',
        broker_account_id: brokerAccountId,
        access_token: tokenEncoded,
        is_active: true,
      }, { onConflict: 'account_id,broker' });

      return Response.redirect(`${appUrl}/dashboard/settings?broker=topstepx&status=success`, 302);
    }

    throw new Error(`Unknown broker: ${broker}`);
  } catch (err) {
    console.error('broker-oauth error:', err);
    return Response.redirect(
      `${appUrl}/dashboard/settings?broker=${broker}&status=error&message=${encodeURIComponent(String(err))}`,
      302
    );
  }
});
