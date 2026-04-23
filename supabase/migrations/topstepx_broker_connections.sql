-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Adds columns needed for TopstepX API integration

ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS api_username         text,
  ADD COLUMN IF NOT EXISTS api_key              text,
  ADD COLUMN IF NOT EXISTS projectx_account_id  integer,
  ADD COLUMN IF NOT EXISTS last_synced_at        timestamptz;

-- Unique constraint so upsert on (user_id, account_id, broker) works
ALTER TABLE broker_connections
  DROP CONSTRAINT IF EXISTS broker_connections_user_account_broker_key;

ALTER TABLE broker_connections
  ADD CONSTRAINT broker_connections_user_account_broker_key
  UNIQUE (user_id, account_id, broker);

-- RLS: users can only read/write their own connections
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broker_connections_owner" ON broker_connections;
CREATE POLICY "broker_connections_owner" ON broker_connections
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
