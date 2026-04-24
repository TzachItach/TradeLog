-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Adds tradovate_account_id column to broker_connections

ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS tradovate_account_id integer;
