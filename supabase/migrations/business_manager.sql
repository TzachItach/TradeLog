-- Business Manager: prop_expenses + prop_payouts tables
-- Run in Supabase SQL Editor

-- ─── prop_expenses ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_expenses (
  id            uuid        PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    uuid        REFERENCES accounts(id) ON DELETE SET NULL,
  prop_firm     text        NOT NULL,
  account_size  numeric     NOT NULL DEFAULT 0,
  fee_type      text        NOT NULL CHECK (fee_type IN ('challenge','reset','activation','data_fee','other')),
  amount        numeric     NOT NULL CHECK (amount >= 0),
  date          date        NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prop_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own prop_expenses"
  ON prop_expenses
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS prop_expenses_user_id_idx ON prop_expenses (user_id);
CREATE INDEX IF NOT EXISTS prop_expenses_date_idx    ON prop_expenses (date DESC);

-- ─── prop_payouts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prop_payouts (
  id            uuid        PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    uuid        REFERENCES accounts(id) ON DELETE SET NULL,
  prop_firm     text        NOT NULL,
  amount        numeric     NOT NULL CHECK (amount >= 0),
  date          date        NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prop_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own prop_payouts"
  ON prop_payouts
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS prop_payouts_user_id_idx ON prop_payouts (user_id);
CREATE INDEX IF NOT EXISTS prop_payouts_date_idx    ON prop_payouts (date DESC);
