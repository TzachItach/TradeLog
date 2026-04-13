// supabase/functions/tradovate-sync/index.ts
// Supabase Edge Function — מסנכרן עסקאות מ-Tradovate
// deploy: supabase functions deploy tradovate-sync

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TRADOVATE_BASE = 'https://live.tradovate.com/v1';
const TRADOVATE_DEMO = 'https://demo.tradovate.com/v1';

interface TradovateToken {
  access_token: string;
  expiration_time: string;
}

interface TradovateFill {
  id: number;
  orderId: number;
  contractId: number;
  timestamp: string;
  tradeDate: { year: number; month: number; day: number };
  action: 'Buy' | 'Sell';
  qty: number;
  price: number;
  active: boolean;
  finallyPaired: number;
}

interface TradovatePnL {
  id: number;
  accountId: number;
  contractId: number;
  timestamp: string;
  tradeDate: { year: number; month: number; day: number };
  openPl: number;
  openQty: number;
  settlementPrice: number;
  tradePl: number;
  totalPl: number;
}

async function refreshTradovateToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  isDemo: boolean
): Promise<TradovateToken> {
  const base = isDemo ? TRADOVATE_DEMO : TRADOVATE_BASE;
  const res = await fetch(`${base}/auth/oauthtoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

async function fetchTradovatePnL(
  accessToken: string,
  accountId: string,
  isDemo: boolean
): Promise<TradovatePnL[]> {
  const base = isDemo ? TRADOVATE_DEMO : TRADOVATE_BASE;
  const res = await fetch(`${base}/cashbalancelog/list?accountId=${accountId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`PnL fetch failed: ${res.status}`);
  return res.json();
}

async function fetchTradovateFills(
  accessToken: string,
  accountId: string,
  isDemo: boolean
): Promise<TradovateFill[]> {
  const base = isDemo ? TRADOVATE_DEMO : TRADOVATE_BASE;
  const res = await fetch(`${base}/fill/list?accountId=${accountId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fills fetch failed: ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const clientId     = Deno.env.get('TRADOVATE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('TRADOVATE_CLIENT_SECRET')!;

  try {
    // מצא את כל החיבורים הפעילים של Tradovate
    const { data: connections, error: connErr } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('broker', 'tradovate')
      .eq('is_active', true);

    if (connErr) throw connErr;
    if (!connections?.length) {
      return new Response(JSON.stringify({ message: 'No active Tradovate connections' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalInserted = 0, totalSkipped = 0;

    for (const conn of connections) {
      try {
        // פענח טוקן (מוצפן ב-base64)
        const storedToken = JSON.parse(atob(conn.access_token));
        const isDemo = conn.metadata?.is_demo ?? false;

        // רענן טוקן אם פג
        let accessToken = storedToken.access_token;
        const expiresAt = new Date(storedToken.expiration_time).getTime();
        if (Date.now() > expiresAt - 60_000) {
          const refreshed = await refreshTradovateToken(
            storedToken.refresh_token,
            clientId,
            clientSecret,
            isDemo
          );
          accessToken = refreshed.access_token;
          // עדכן טוקן חדש בטבלה
          const newTokenB64 = btoa(JSON.stringify(refreshed));
          await supabase
            .from('broker_connections')
            .update({ access_token: newTokenB64, token_expires_at: refreshed.expiration_time })
            .eq('id', conn.id);
        }

        // שלוף עסקאות
        const fills = await fetchTradovateFills(accessToken, conn.broker_account_id, isDemo);

        for (const fill of fills) {
          const tradeDate = `${fill.tradeDate.year}-${String(fill.tradeDate.month).padStart(2,'0')}-${String(fill.tradeDate.day).padStart(2,'0')}`;
          const brokerId = `tradovate-fill-${fill.id}`;

          // בדוק כפילויות
          const { data: existing } = await supabase
            .from('trades')
            .select('id')
            .eq('broker_trade_id', brokerId)
            .eq('account_id', conn.account_id)
            .single();

          if (existing) { totalSkipped++; continue; }

          // הכנס עסקה חדשה
          const { error: insertErr } = await supabase.from('trades').insert({
            id: crypto.randomUUID(),
            user_id: conn.user_id,
            account_id: conn.account_id,
            symbol: String(fill.contractId),
            direction: fill.action === 'Buy' ? 'long' : 'short',
            trade_date: tradeDate,
            pnl: 0, // יעודכן מה-PnL endpoint
            size: fill.qty,
            source: 'tradovate',
            status: 'synced',
            broker_trade_id: brokerId,
            confirmations: {},
            field_values: {},
          });

          if (!insertErr) totalInserted++;
        }

        // עדכן זמן סנכרון אחרון
        await supabase
          .from('broker_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id);

        // לוג סנכרון
        await supabase.from('sync_log').insert({
          user_id: conn.user_id,
          account_id: conn.account_id,
          broker: 'tradovate',
          trades_inserted: totalInserted,
          trades_skipped: totalSkipped,
          status: 'success',
        });
      } catch (connError) {
        console.error(`Connection ${conn.id} failed:`, connError);
        await supabase.from('sync_log').insert({
          user_id: conn.user_id,
          account_id: conn.account_id,
          broker: 'tradovate',
          trades_inserted: 0,
          trades_skipped: 0,
          status: 'error',
          error_message: String(connError),
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: totalInserted, skipped: totalSkipped }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
