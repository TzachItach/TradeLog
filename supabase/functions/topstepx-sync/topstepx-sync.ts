// supabase/functions/topstepx-sync/index.ts
// Supabase Edge Function — מסנכרן עסקאות מ-TopstepX
// deploy: supabase functions deploy topstepx-sync

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOPSTEPX_BASE = 'https://api.topstepx.com/api/v1';

interface TopstepXTrade {
  id: string;
  accountId: string;
  contractId: string;
  contractName: string;
  tradeDate: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  realizedPnl: number;
  commission: number;
  createdAt: string;
}

interface TopstepXAccount {
  id: string;
  name: string;
  balance: number;
  status: string;
}

async function fetchTopstepXTrades(
  apiToken: string,
  accountId: string,
  fromDate?: string
): Promise<TopstepXTrade[]> {
  const params = new URLSearchParams({ accountId });
  if (fromDate) params.append('fromDate', fromDate);

  const res = await fetch(`${TOPSTEPX_BASE}/trade/search?${params}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`TopstepX trades fetch failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.trades ?? data ?? [];
}

async function fetchTopstepXAccounts(apiToken: string): Promise<TopstepXAccount[]> {
  const res = await fetch(`${TOPSTEPX_BASE}/account/search`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) throw new Error(`TopstepX accounts fetch failed: ${res.status}`);
  const data = await res.json();
  return data.accounts ?? data ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data: connections, error: connErr } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('broker', 'topstepx')
      .eq('is_active', true);

    if (connErr) throw connErr;
    if (!connections?.length) {
      return new Response(JSON.stringify({ message: 'No active TopstepX connections' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalInserted = 0, totalSkipped = 0;

    for (const conn of connections) {
      try {
        // TopstepX uses API token (not OAuth)
        const apiToken = atob(conn.access_token);

        // שלוף מתאריך הסנכרון האחרון
        const fromDate = conn.last_synced_at
          ? new Date(conn.last_synced_at).toISOString().split('T')[0]
          : undefined;

        const trades = await fetchTopstepXTrades(apiToken, conn.broker_account_id, fromDate);

        for (const trade of trades) {
          const brokerId = `topstepx-${trade.id}`;

          const { data: existing } = await supabase
            .from('trades')
            .select('id')
            .eq('broker_trade_id', brokerId)
            .eq('account_id', conn.account_id)
            .single();

          if (existing) { totalSkipped++; continue; }

          const tradeDate = trade.tradeDate
            ? trade.tradeDate.split('T')[0]
            : new Date(trade.createdAt).toISOString().split('T')[0];

          const netPnL = (trade.realizedPnl || 0) - (trade.commission || 0);

          const { error: insertErr } = await supabase.from('trades').insert({
            id: crypto.randomUUID(),
            user_id: conn.user_id,
            account_id: conn.account_id,
            symbol: trade.contractName || trade.contractId,
            direction: trade.side === 'Buy' ? 'long' : 'short',
            trade_date: tradeDate,
            pnl: netPnL,
            size: trade.quantity,
            source: 'topstepx',
            status: 'synced',
            broker_trade_id: brokerId,
            confirmations: {},
            field_values: {},
            notes: `Commission: $${(trade.commission || 0).toFixed(2)}`,
          });

          if (!insertErr) totalInserted++;
        }

        await supabase
          .from('broker_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', conn.id);

        await supabase.from('sync_log').insert({
          user_id: conn.user_id,
          account_id: conn.account_id,
          broker: 'topstepx',
          trades_inserted: totalInserted,
          trades_skipped: totalSkipped,
          status: 'success',
        });
      } catch (connError) {
        console.error(`Connection ${conn.id} failed:`, connError);
        await supabase.from('sync_log').insert({
          user_id: conn.user_id,
          account_id: conn.account_id,
          broker: 'topstepx',
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
