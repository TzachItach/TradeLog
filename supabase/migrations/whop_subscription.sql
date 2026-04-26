-- Add Whop subscription fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS whop_membership_id  TEXT DEFAULT NULL;
