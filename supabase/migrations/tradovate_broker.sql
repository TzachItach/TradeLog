-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Adds Tradovate-specific columns to broker_connections

ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS tradovate_account_id integer;

-- 'live' = live.tradovate.com | 'demo' = demo.tradovate.com (prop firm evals)
ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS broker_env text DEFAULT 'live';
